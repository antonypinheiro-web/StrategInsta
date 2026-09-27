import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PilotError, runModel, validateModel } from '../_shared/pilot-models.ts';
import { aggregateStage, buildPilotPrompt, mergeWorkspaceContext, normalizeParameters, object, OPERATIONS, parsePilotOutput, stampVersion, string, uuid, validateBriefing, type JsonObject } from '../_shared/pilot-content.ts';

const corsHeaders = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
const database=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
type Database=ReturnType<typeof database>;
const safeCodes=new Set(['USER_BLOCKED','INSUFFICIENT_CREDITS','MODEL_CONFIG_REQUIRED','MODELS_COOLDOWN','IDEMPOTENCY_CONFLICT','OWNERSHIP','TOO_MANY_PENDING','RATE_LIMITED','DAILY_BUNDLE_LIMIT','STAGE_ORDER','INVALID_COUNT','INVALID_SELECTION','INVALID_OPERATION','INVALID_SECTION','EXECUTION_EXPIRED','ATTACHMENT_COUNT_LIMIT','ATTACHMENT_TOTAL_LIMIT','ATTACHMENT_CONFLICT']);
async function rpc(db:Database,name:string,args:JsonObject):Promise<unknown>{
  const {data,error}=await db.rpc(name,args);
  if(error){const code=safeCodes.has(error.message)?error.message:'PERSISTENCE_FAILED';throw new PilotError(code,code==='INSUFFICIENT_CREDITS'?402:code==='OWNERSHIP'?403:code==='PERSISTENCE_FAILED'?500:409);}
  return data;
}
function checked<T>(result:{data:T;error:unknown}):T {if(result.error)throw new PilotError('PERSISTENCE_FAILED',500);return result.data;}
async function wallet(db:Database,user:string){await rpc(db,'pilot_wallet',{p_user:user});await rpc(db,'pilot_reconcile',{p_user:user});return rpc(db,'pilot_wallet',{p_user:user});}
function withVersion(generation:JsonObject,stage?:string):JsonObject{
  const metadata=object(generation.metadata??{});const stages=Object.keys(metadata);
  const step=object(metadata[stage??stages.at(-1)??'']??{});
  return {...generation,...(typeof step.versionId==='string'?{versionId:step.versionId}:{})};
}
async function hash(value:unknown){const bytes=new TextEncoder().encode(JSON.stringify(value));const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');}
async function ownBusiness(db:Database,user:string,businessId:string,create=false){
  if(create){const existing=checked(await db.from('pilot_businesses').select('id,user_id').eq('id',businessId).maybeSingle());
    if(!existing)checked(await db.from('pilot_businesses').insert({id:businessId,user_id:user}));}
  const row=checked(await db.from('pilot_businesses').select('id').eq('id',businessId).eq('user_id',user).maybeSingle());
  if(!row)throw new PilotError('OWNERSHIP',403);
}
async function ownStrategy(db:Database,user:string,id:unknown){
  if(!id)return;
  const row=checked(await db.from('strategies').select('user_id').eq('id',uuid(id)).maybeSingle());
  if(row&&row.user_id!==user)throw new PilotError('OWNERSHIP',403);
}
async function ownAttachments(db:Database,user:string,businessId:string,input:JsonObject){
  for(const source of (input.attachments as unknown[]|undefined)??[]){const a=object(source);
    const row=checked(await db.from('pilot_attachments').select('id,size,sha256,kind').eq('user_id',user).eq('business_id',businessId).eq('storage_path',a.storagePath).in('status',['ready','detached']).maybeSingle());
    if(!row)throw new PilotError('ATTACHMENT_NOT_READY',409);
    const kind=['jpeg','png','webp'].includes(String(a.kind))?'image':a.kind;
    if(Number(row.size)!==Number(a.size)||row.sha256!==a.sha256||row.kind!==kind)throw new PilotError('ATTACHMENT_MISMATCH');
  }
}
async function history(db:Database,user:string,p:JsonObject){
  const size=Math.max(1,Math.min(200,Number.isInteger(p.limit)?Number(p.limit):30));
  const offset=p.offset===undefined?(p.page===undefined?0:Number(p.page)*size):Number(p.offset);
  if(!Number.isSafeInteger(offset)||offset<0)throw new PilotError('INVALID_OFFSET');
  const page=Math.floor(offset/size);
  let generations=db.from('ai_generations').select('*',{count:'exact'}).eq('user_id',user).order('created_at',{ascending:false}).order('id',{ascending:false});
  let revisions=db.from('pilot_revisions').select('*',{count:'exact'}).eq('user_id',user).order('created_at',{ascending:false}).order('id',{ascending:false});
  let ledger=db.from('ai_credit_ledger').select('*',{count:'exact'}).eq('user_id',user).order('created_at',{ascending:false}).order('id',{ascending:false});
  if(p.businessId){const id=uuid(p.businessId);generations=generations.eq('business_id',id);revisions=revisions.eq('business_id',id);}
  if(p.generationId){const id=uuid(p.generationId);generations=generations.eq('id',id);revisions=revisions.eq('generation_id',id);}
  if(p.operation)generations=generations.eq('operation',string(p.operation,60));
  if(p.status)generations=generations.eq('status',string(p.status,30));
  if(p.from)generations=generations.gte('created_at',new Date(string(p.from,40)).toISOString());
  if(p.to)generations=generations.lte('created_at',new Date(string(p.to,40)).toISOString());
  if(p.generationId)ledger=ledger.eq('generation_id',uuid(p.generationId));
  const [g,r,l]=await Promise.all([generations.range(offset,offset+size-1),revisions.range(offset,offset+size-1),ledger.range(offset,offset+size-1)]);
  const generationRows=(checked(g)??[]).map(row=>withVersion(row));const revisionRows=checked(r)??[];
  const versionIds=new Set<string>(revisionRows.map(row=>row.id));
  for(const generation of generationRows)for(const metadata of Object.values(object(generation.metadata??{}))){if(metadata&&typeof metadata==='object'&&typeof object(metadata).versionId==='string')versionIds.add(String(object(metadata).versionId));}
  const feedbackRows:unknown[]=[];const ids=[...versionIds];
  for(let i=0;i<ids.length;i+=200){
    const rows=checked(await db.from('pilot_content_feedback').select('*').eq('user_id',user).in('version_id',ids.slice(i,i+200)).order('updated_at',{ascending:false}).limit(1000));
    feedbackRows.push(...(rows??[]));
  }
  return {generations:generationRows,revisions:revisionRows,feedback:feedbackRows,feedbackScope:'page',ledger:checked(l),page,pageSize:size,total:g.count??0,revisionsTotal:r.count??0,ledgerTotal:l.count??0,hasMore:Math.max(g.count??0,r.count??0,l.count??0)>offset+size};
}
async function saveRevision(db:Database,user:string,p:JsonObject){
  const businessId=uuid(p.businessId);await ownBusiness(db,user,businessId,true);await ownStrategy(db,user,p.strategyId);
  if(!['input','manual_edit','selection','agenda'].includes(String(p.kind)))throw new PilotError('INVALID_REVISION');
  const content=object(p.content);if(JSON.stringify(content).length>600_000)throw new PilotError('REVISION_TOO_LARGE');
  if(p.kind==='input')validateBriefing(content.input??content);
  if(p.parentRevisionId){const parent=checked(await db.from('pilot_revisions').select('id').eq('id',uuid(p.parentRevisionId)).eq('user_id',user).eq('business_id',businessId).maybeSingle());if(!parent)throw new PilotError('OWNERSHIP',403);}
  const row=checked(await db.from('pilot_revisions').insert({user_id:user,business_id:businessId,strategy_id:p.strategyId??null,parent_revision_id:p.parentRevisionId??null,kind:p.kind,title:string(p.title,180,1),content}).select('*').single());
  return {revision:row,versionId:row.id};
}
async function feedback(db:Database,user:string,p:JsonObject){
  const versionId=uuid(p.versionId);const revision=checked(await db.from('pilot_revisions').select('id,business_id').eq('id',versionId).eq('user_id',user).maybeSingle());
  if(!revision)throw new PilotError('OWNERSHIP',403);
  if(!['good','bad','unrated'].includes(String(p.rating))||!['reach','interaction','retention','conversion'].includes(String(p.goal))||typeof p.published!=='boolean')throw new PilotError('INVALID_FEEDBACK');
  const publishedAt=p.published&&p.publishedAt?new Date(string(p.publishedAt,40)).toISOString():null;
  const row=checked(await db.from('pilot_content_feedback').upsert({user_id:user,business_id:revision.business_id,version_id:versionId,content_id:string(p.contentId,160,1),rating:p.rating,goal:p.goal,published:p.published,published_at:publishedAt,period:p.period?string(p.period,300):null,metrics:p.metrics?string(p.metrics,1500):null,notes:p.notes?string(p.notes,2000):null,updated_at:new Date().toISOString()},{onConflict:'user_id,version_id,content_id'}).select('*').single());
  return {ok:true,feedback:row};
}
async function referenceContext(db:Database,user:string,business:string){
  const entries=checked(await db.from('pilot_content_feedback').select('*').eq('user_id',user).eq('business_id',business).order('updated_at',{ascending:false}).limit(12));
  const ids=[...new Set((entries??[]).map(row=>row.version_id))];
  const revisions=ids.length?checked(await db.from('pilot_revisions').select('id,content').eq('user_id',user).eq('business_id',business).in('id',ids)):[];
  const map=new Map((revisions??[]).map(row=>[row.id,row.content]));
  function findItem(value:unknown,id:string):unknown{
    if(!value||typeof value!=='object')return undefined;
    if(!Array.isArray(value)&&object(value).id===id)return value;
    for(const item of Object.values(value)){const found=findItem(item,id);if(found!==undefined)return found;}
    return undefined;
  }
  const rows=entries??[];
  const selected=[...rows.filter(row=>row.rating==='good').slice(0,3),...rows.filter(row=>row.rating!=='good').slice(0,3)];
  const result:JsonObject[]=[];let budget=30000;
  for(const entry of selected){
    const source=map.get(entry.version_id);const item=typeof source==='string'?source:findItem(source,entry.content_id);
    const excerpt=JSON.stringify(item??{missingPublishedItem:true}).slice(0,Math.min(8000,budget));
    if(!excerpt)break;budget-=excerpt.length;
    result.push({contentId:entry.content_id,rating:entry.rating,goal:entry.goal,published:entry.published,publishedAt:entry.published_at,period:entry.period,metrics:entry.metrics,notes:entry.notes,evidenceType:entry.published?'user_reported_publication':'preference_only',sourceExcerpt:excerpt,excerptLimited:JSON.stringify(item??'').length>excerpt.length});
  }
  return result;
}
async function loadImage(db:Database,user:string,business:string,path:string){
  const file=checked(await db.from('pilot_attachments').select('*').eq('storage_path',path).eq('user_id',user).eq('business_id',business).in('status',['ready','detached']).maybeSingle());
  if(!file||file.kind!=='image'||file.size>10*1024*1024)throw new PilotError('INVALID_IMAGE');
  const blob=checked(await db.storage.from('briefing-files').download(path));
  if(!blob||blob.size!==file.size)throw new PilotError('INVALID_IMAGE');
  const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return {mimeType:file.mime_type,data:btoa(binary)};
}
function ensureSelection(parameters:JsonObject,prior:JsonObject){
  const workspace=object(parameters.workspace??prior.workspace??{});
  const ids=parameters.selectedMonetizationIds??workspace.selectedMonetizationIds??[];
  if(!Array.isArray(ids)||ids.length>3||new Set(ids).size!==ids.length)throw new PilotError('INVALID_SELECTION');
  const analysis=object(workspace.monetization??{});const ideas=(analysis.ideas??[]) as JsonObject[];
  if(ids.some(id=>typeof id!=='string'||!ideas.some(idea=>idea.id===id)))throw new PilotError('INVALID_SELECTION');
  return {...parameters,selectedMonetizationIds:ids};
}
async function generate(db:Database,user:string,p:JsonObject){
  const operation=string(p.operation,40);if(!(OPERATIONS as readonly string[]).includes(operation))throw new PilotError('INVALID_OPERATION');
  const input=validateBriefing(p.input);const businessId=uuid(p.businessId);const idempotencyKey=uuid(p.idempotencyKey);
  let parameters=normalizeParameters(operation,p.parameters??{});
  if(p.strategyId)uuid(p.strategyId);if(p.parentGenerationId)uuid(p.parentGenerationId);
  await ownAttachments(db,user,businessId,input);
  const stage=operation==='full_strategy'?String(parameters.stage):'result';
  const inputHash=await hash(operation==='full_strategy'?{businessId,operation,input}:{businessId,operation,input,parameters});
  let generation=object(await rpc(db,'pilot_reserve_generation',{p_user:user,p_request:{operation,input,businessId,idempotencyKey,strategyId:p.strategyId??null,parentGenerationId:p.parentGenerationId??null,inputHash,parameters,retry:p.retry===true}}));
  if(generation.status==='completed')return {generation:withVersion(generation,stage),wallet:await wallet(db,user)};
  if(generation.status==='failed'||generation.status==='canceled')return {generation,wallet:await wallet(db,user),code:generation.error_code??'GENERATION_FAILED',error:'A tentativa não foi concluída. Seu conteúdo anterior foi preservado.'};
  let prior=object(generation.output??{});
  if(operation!=='full_strategy'&&p.parentGenerationId){
    const parent=checked(await db.from('ai_generations').select('output').eq('id',p.parentGenerationId).eq('user_id',user).eq('business_id',businessId).single());
    if(!parent)throw new PilotError('OWNERSHIP',403);
    prior=object(parent.output??{});
  }
  if(parameters.strategy)prior={...prior,strategy:object(parameters.strategy)};
  prior=mergeWorkspaceContext(prior,parameters);
  const claim=object(await rpc(db,'pilot_claim_step',{p_user:user,p_generation:generation.id,p_stage:stage,p_hash:await hash(parameters),p_execution:crypto.randomUUID(),p_parameters:parameters}));
  if(claim.cached||!claim.claimed)return {generation:withVersion(generation,stage),wallet:await wallet(db,user),pending:claim.busy===true};
  try{
    if(operation==='monetization_plan'||operation==='full_strategy')parameters=ensureSelection(parameters,prior);
    const feedbackRows=await referenceContext(db,user,businessId);
    const {system,user:prompt}=buildPilotPrompt(operation,parameters,input,prior,feedbackRows);
    const config=validateModel(generation.selected_model);
    const image=operation==='attachment_ocr'?await loadImage(db,user,businessId,String(parameters.storagePath)):undefined;
    const attempts:JsonObject[]=[];let effective=config;let result;
    try{result=await runModel(config,system,prompt,Deno.env.get,{image,maxOutputTokens:stage==='final'?24000:operation==='refine_short'?4000:16000});}
    catch(error){
      const e=error instanceof PilotError?error:new PilotError('PROVIDER_UNAVAILABLE',503);
      attempts.push({provider:config.provider,model:config.model,code:e.code});
      checked(await db.from('ai_model_health').upsert({provider:config.provider,model:config.model,code:e.code,unavailable_until:new Date(Date.now()+(e.transient?5:30)*60_000).toISOString(),updated_at:new Date().toISOString()}));
      if(!e.transient)throw e;
      const row=checked(await db.from('ai_model_configs').select('models').eq('id',generation.config_id).single());
      if(!row)throw new PilotError('MODEL_CONFIG_REQUIRED',503);
      const alternative=(row.models as unknown[]).map(validateModel).find(m=>m.provider!==config.provider||m.model!==config.model);
      if(!alternative)throw e;
      effective=alternative;result=await runModel(effective,system,prompt,Deno.env.get,{image,maxOutputTokens:stage==='final'?24000:operation==='refine_short'?4000:16000});
    }
    const {text:discardedText,...metadata}=result;
    // Usage survives output validation failures. This update cannot finalize or spend credits.
    checked(await db.from('ai_generation_steps').update({metadata:{...metadata,attempts,fallback:attempts.length>0}}).eq('generation_id',generation.id).eq('stage',stage).eq('execution_id',claim.executionId).eq('status','processing'));
    checked(await db.from('ai_model_health').upsert({provider:effective.provider,model:effective.model,code:null,unavailable_until:null,updated_at:new Date().toISOString()}));
    const versionId=crypto.randomUUID();
    const output=stampVersion(parsePilotOutput(result.text,operation,parameters),versionId);
    const aggregate=operation==='full_strategy'?aggregateStage(prior,stage,output,parameters):output;
    generation=object(await rpc(db,'pilot_complete_step',{p_user:user,p_generation:generation.id,p_stage:stage,p_execution:claim.executionId,p_output:output,p_aggregate:aggregate,p_metadata:{...metadata,versionId,attempts,fallback:attempts.length>0,effectiveConfig:effective,origin:parameters.origin??null}}));
    return {generation,wallet:await wallet(db,user)};
  }catch(error){
    const code=error instanceof PilotError?error.code:'GENERATION_FAILED';
    try{generation=object(await rpc(db,'pilot_release_generation',{p_user:user,p_generation:generation.id,p_code:code,p_execution:claim.executionId}));}
    catch{throw new PilotError('RECONCILIATION_PENDING',503);}
    const released=['failed','canceled'].includes(String(generation.status));
    return {generation,wallet:await wallet(db,user),error:released?'Não foi possível concluir. A reserva foi liberada.':'Consulte o histórico para confirmar o resultado desta tentativa.',code,creditsReleased:released};
  }
}
async function attachmentAction(db:Database,user:string,action:string,p:JsonObject){
  const businessId=uuid(p.businessId);const id=uuid(p.id);
  if(action==='prepareUpload'){
    uuid(p.briefingId);
    const kind=string(p.kind,10);const mime=string(p.mimeType,100);const size=Number(p.size);
    const allowed:Record<string,string[]>={pdf:['application/pdf'],docx:['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],txt:['text/plain'],image:['image/jpeg','image/png','image/webp']};
    if(!allowed[kind]?.includes(mime)||!Number.isInteger(size)||size<1||size>(kind==='image'?10:50)*1024*1024||!/^[a-f0-9]{64}$/.test(String(p.sha256)))throw new PilotError('INVALID_ATTACHMENT');
    string(p.name,200,1);return rpc(db,'pilot_prepare_attachment',{p_user:user,p_payload:{...p,id,businessId,size}});
  }
  const file=checked(await db.from('pilot_attachments').select('*').eq('id',id).eq('user_id',user).eq('business_id',businessId).neq('status','deleted').maybeSingle());
  if(!file)throw new PilotError('OWNERSHIP',403);
  if(action==='removeAttachment'){
    checked(await db.from('pilot_attachments').update({status:file.status==='ready'||file.status==='detached'?'detached':'deleted'}).eq('id',id).eq('user_id',user));return {removed:true,sourcePreserved:true};
  }
  const info=checked(await db.storage.from('briefing-files').info(file.storage_path));
  if(!info||Number(info.size)!==Number(file.size))throw new PilotError('ATTACHMENT_SIZE_MISMATCH');
  const signed=checked(await db.storage.from('briefing-files').createSignedUrl(file.storage_path,60));
  if(!signed)throw new PilotError('ATTACHMENT_READ_FAILED');
  const response=await fetch(signed.signedUrl,{headers:{Range:'bytes=0-4095'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new PilotError('ATTACHMENT_READ_FAILED');
  const bytes=new Uint8Array(await response.arrayBuffer());
  const ascii=new TextDecoder().decode(bytes.subarray(0,16));
  const valid=file.kind==='pdf'?ascii.startsWith('%PDF-'):file.kind==='docx'?bytes[0]===80&&bytes[1]===75&&bytes[2]===3&&bytes[3]===4:file.kind==='txt'?!bytes.includes(0):file.mime_type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:file.mime_type==='image/png'?bytes[0]===137&&ascii.slice(1,4)==='PNG':ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WEBP';
  if(!valid)throw new PilotError('ATTACHMENT_SIGNATURE_MISMATCH');
  checked(await db.from('pilot_attachments').update({status:'ready'}).eq('id',id).eq('user_id',user));
  return {storagePath:file.storage_path,status:'ready'};
}

serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST')return json({code:'METHOD_NOT_ALLOWED'},405);
  try{
    const db=database();const authorization=req.headers.get('Authorization');
    if(!authorization?.startsWith('Bearer '))throw new PilotError('UNAUTHENTICATED',401);
    const {data:{user},error}=await db.auth.getUser(authorization.slice(7));if(error||!user)throw new PilotError('UNAUTHENTICATED',401);
    const raw=await req.text();if(raw.length>750_000)throw new PilotError('INPUT_TOO_LARGE',413);
    let body:JsonObject;try{body=object(JSON.parse(raw));}catch{throw new PilotError('INVALID_REQUEST');}
    if(body.systemPrompt!==undefined||body.userPrompt!==undefined)throw new PilotError('CLIENT_PROMPTS_NOT_ALLOWED');
    const action=string(body.action,40);const p=object(body.payload??{});let result:unknown;
    switch(action){
      case 'wallet':result={wallet:await wallet(db,user.id)};break;
      case 'quote':{
        const operation=string(p.operation,40);const parameters=normalizeParameters(operation,p.parameters??{});
        const totalCredits=Number(await rpc(db,'pilot_credit_cost',{p_operation:operation,p_parameters:parameters}));const balance=object(await wallet(db,user.id));
        let credits=totalCredits;
        if(p.idempotencyKey){
          const existing=checked(await db.from('ai_generations').select('status,operation,business_id').eq('user_id',user.id).eq('idempotency_key',uuid(p.idempotencyKey)).maybeSingle());
          if(existing){
            if(existing.operation!==operation || (p.businessId&&existing.business_id!==uuid(p.businessId)))throw new PilotError('IDEMPOTENCY_CONFLICT',409);
            if(['reserved','processing','awaiting_input','completed'].includes(existing.status))credits=0;
          }
        }
        result={credits,totalCredits,wallet:balance,availableAfter:Number(balance.available)-credits};break;
      }
      case 'generate':result=await generate(db,user.id,p);break;
      case 'cancel':result={generation:await rpc(db,'pilot_release_generation',{p_user:user.id,p_generation:uuid(p.generationId),p_code:'USER_CANCELED',p_canceled:true}),wallet:await wallet(db,user.id)};break;
      case 'history':result=await history(db,user.id,p);break;
      case 'saveRevision':result=await saveRevision(db,user.id,p);break;
      case 'feedback':result=await feedback(db,user.id,p);break;
      case 'prepareUpload':case 'completeUpload':case 'removeAttachment':result=await attachmentAction(db,user.id,action,p);break;
      default:throw new PilotError('INVALID_ACTION');
    }
    return json(result);
  }catch(error){const e=error instanceof PilotError?error:new PilotError('REQUEST_FAILED',500);
    console.warn('[call-ai]',e.code);
    return json({error:'Não foi possível concluir a operação.',code:e.code},e.status);
  }
});
