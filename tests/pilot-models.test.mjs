import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PilotError,TARGET_MODELS,validateModel,runModel,listProviderModels} from '../supabase/functions/_shared/pilot-models.ts';
import {aggregateStage,buildPilotPrompt,mergeWorkspaceContext,normalizeParameters,parsePilotOutput,stampVersion,validateBriefing} from '../supabase/functions/_shared/pilot-content.ts';
const keys=()=> 'fixture-secret-never-printed';
const openai=TARGET_MODELS[0],gemini=TARGET_MODELS[1];
test('OpenAI adapter uses Responses, bounded reasoning and no inherited temperature',async()=>{
 let payload;const result=await runModel(openai,'System JSON','User JSON',keys,{fetcher:async(url,init)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');payload=JSON.parse(init.body);
  return Response.json({status:'completed',output:[{type:'reasoning',summary:[]},{type:'message',content:[{type:'output_text',text:'{"ok":true}'}]}],usage:{input_tokens:100,output_tokens:50,input_tokens_details:{cached_tokens:20}}});
 }});
 assert.deepEqual(payload.reasoning,{effort:'medium'});assert.equal(payload.temperature,undefined);assert.equal(payload.store,false);
 assert.equal(result.text,'{"ok":true}');assert.equal(result.inputTokens,100);assert.equal(result.cachedTokens,20);
 assert.equal(result.estimatedCostUsd,0.00008);
});
test('Gemini adapter hides API key from URL, skips thought content and includes thinking tokens in cost',async()=>{
 const result=await runModel(gemini,'JSON','JSON',keys,{fetcher:async(url,init)=>{
  assert.ok(!url.includes('fixture-secret'));assert.equal(init.headers['x-goog-api-key'],keys());
  const payload=JSON.parse(init.body);assert.deepEqual(payload.generationConfig.thinkingConfig,{thinkingLevel:'MEDIUM'});
  assert.equal(payload.generationConfig.temperature,undefined);
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'private reasoning'},{text:'{"ok":true}'}]}}],usageMetadata:{promptTokenCount:200,candidatesTokenCount:30,thoughtsTokenCount:20}});
 }});
 assert.equal(result.text,'{"ok":true}');assert.equal(result.outputTokens,50);
});
test('authentication/model errors are not transient fallback triggers and bodies never leak',async()=>{
 for(const status of [400,401,403,404])await assert.rejects(runModel(openai,'JSON','JSON',keys,{fetcher:async()=>Response.json({error:{message:'private echoed prompt'}},{status})}),e=>e instanceof PilotError&&!e.transient&&!e.message.includes('private'));
 await assert.rejects(runModel(openai,'JSON','JSON',keys,{fetcher:async()=>new Response('',{status:429})}),e=>e.transient&&e.code==='PROVIDER_RATE_LIMIT');
});
test('missing keys, obsolete models and unsupported thinking fail before sending requests',async()=>{
 assert.throws(()=>validateModel({...openai,model:'gpt-4o-mini'}),/MODEL_ADAPTER_UNSUPPORTED/);
 assert.throws(()=>validateModel({...gemini,reasoning:'minimal'}),/INVALID_REASONING/);
 await assert.rejects(runModel(openai,'JSON','JSON',()=>undefined),/PROVIDER_KEY_MISSING/);
});
test('expired price table produces unknown cost instead of a stale estimate',async()=>{
 const result=await runModel({...openai,priceExpiresAt:'2020-01-01'},'JSON','JSON',keys,{fetcher:async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{}'}]}],usage:{input_tokens:100,output_tokens:10}})});
 assert.equal(result.estimatedCostUsd,null);assert.equal(result.priceExpired,true);
});
test('provider catalogue only exposes compatible text models and proves no activation',async()=>{
 const models=await listProviderModels('openai',keys,async()=>Response.json({data:[{id:'gpt-5.6-luna'},{id:'gpt-4o-mini'},{id:'gpt-5.6-image'},{id:'whisper-1'}]}));
 assert.deepEqual(models,['gpt-5.6-luna']);
});
test('story count for pricing is derived from validated agenda, ignoring a cheaper client count',()=>{
 const result=normalizeParameters('stories_day',{storyCount:1,day:{date:'2026-09-28',routine:'Entrega real',requestedCount:11}});
 assert.equal(result.storyCount,11);
 assert.throws(()=>normalizeParameters('stories_day',{day:{date:'2026-09-28',routine:'',requestedCount:16}}),/INVALID_COUNT/);
 assert.throws(()=>normalizeParameters('refine_short',{origin:{kind:'section'},section:'idealCustomerProfile',item:{text:'large analysis'}}),/SHORT_SCOPE_EXCEEDED/);
});
test('bio total count, matrix shape and script scope reject invalid usable-looking output',()=>{
 assert.throws(()=>parsePilotOutput(JSON.stringify({options:Array.from({length:3},(_,i)=>({id:String(i),name:'Marca',text:'a'.repeat(151)}))}),'section',{section:'instagramBio'}),/INVALID_BIO/);
 assert.throws(()=>parsePilotOutput(JSON.stringify({id:'matrix',cells:[]}),'section',{section:'contentTable'}),/INVALID_OUTPUT/);
 assert.throws(()=>parsePilotOutput(JSON.stringify({id:'script',title:'Test',objective:'Reach',cta:'Visite',format:'carousel',origin:{id:'a',kind:'idea'},blocks:[]}),'script',{format:'reel',origin:{id:'a',kind:'idea'}}),/FORMAT_MISMATCH/);
});
test('manual ICP revisions and selected monetization survive subsequent generation stages',()=>{
 const prior={strategy:{idealCustomerProfile:'Original'},workspace:{schemaVersion:1,scripts:[],selectedMonetizationIds:[]}};
 const parameters={workspace:{overrides:{idealCustomerProfile:'Revisado pelo empreendedor'},monetizationPlan:'Plano aprovado',bios:[{id:'b',text:'Editada',name:'Marca'}]},selectedMonetizationIds:['offer-a']};
 const context=mergeWorkspaceContext(prior,parameters);assert.equal(context.strategy.idealCustomerProfile,'Revisado pelo empreendedor');
 const output={id:'analysis',potential:'Potencial contextual',basis:['Marcenaria'],ideas:[{id:'offer-a',title:'Serviço',offer:'Móvel',basis:'Input',resources:'Time',risks:'Capacidade',hypothesis:'Validar'}]};
 const aggregate=aggregateStage(prior,'monetizationIdeas',output,parameters);
 assert.equal(aggregate.workspace.monetizationPlan,'Plano aprovado');assert.equal(aggregate.workspace.bios[0].text,'Editada');
 assert.deepEqual(aggregate.workspace.selectedMonetizationIds,['offer-a']);
});
test('initial content records receive persisted version ID recursively without altering earlier objects',()=>{
 const item={id:'week',days:[{id:'day',stories:[{id:'story',speech:'Texto'}]}]};
 const result=stampVersion(item,'00000000-0000-4000-8000-000000000001');
 assert.equal(result.days[0].stories[0].versionId,'00000000-0000-4000-8000-000000000001');assert.equal(item.versionId,undefined);
});
test('briefing excludes unprocessed files and enforces aggregate attachment budget',()=>{
 assert.throws(()=>validateBriefing({niche:'Artesanato',files:[]}),/FILES_REQUIRE_PRIVATE_UPLOAD/);
 const a={summary:'Fonte aprovada',reviewedAt:'2026-09-27',storagePath:'fixture',kind:'pdf',size:50*1024*1024};
 assert.throws(()=>validateBriefing({niche:'Artesanato',attachments:[a,a,a]}),/ATTACHMENT_TOTAL_LIMIT/);
});
test('prompts isolate documents as data and contextualize inputs without claiming Instagram access',()=>{
 const prompt=buildPilotPrompt('section',{section:'idealCustomerProfile'},{niche:'Marcenaria',productsAndServices:'Cozinhas sob medida'},{},[]);
 assert.match(prompt.system,/dados não confiáveis/);assert.match(prompt.system,/Não invente/);assert.match(prompt.system,/não há ferramentas conectadas/);
 assert.match(prompt.user,/Cozinhas sob medida/);
});
