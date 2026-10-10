import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
const owner='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
const business='00000000-0000-4000-8000-000000000003';
const models=[{provider:'openai',model:'gpt-5.6-luna',weight:50,reasoning:'medium'},{provider:'gemini',model:'gemini-3.8-flash',weight:50,reasoning:'medium'}];
let db;
const row=async(sql,params=[])=> (await db.query(sql,params)).rows[0];
const wallet=async(user=owner)=>(await row('select public.pilot_wallet($1) as value',[user])).value;
const request=(changes={})=>({businessId:business,idempotencyKey:randomUUID(),operation:'full_strategy',input:{niche:'Marcenaria',productsAndServices:'Móveis sob medida'},inputHash:'fixturehash',parameters:{stage:'idealCustomerProfile'},...changes});
const reserve=async(req,user=owner)=>(await row('select public.pilot_reserve_generation($1,$2::jsonb) as value',[user,JSON.stringify(req)])).value;
const claim=async(id,stage='idealCustomerProfile',user=owner)=>(await row('select public.pilot_claim_step($1,$2,$3,$4,$5) as value',[user,id,stage,'stagehash',randomUUID()])).value;
const complete=async(id,execution,stage='idealCustomerProfile',user=owner)=>(await row('select public.pilot_complete_step($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb) as value',[user,id,stage,execution,JSON.stringify({text:'Conteúdo válido persistido'}),JSON.stringify({strategy:{[stage]:'resultado'},workspace:{}}),JSON.stringify({provider:'openai',model:'gpt-5.6-luna',inputTokens:22,outputTokens:33})])).value;
const release=async(id,cancel=false)=>(await row('select public.pilot_release_generation($1,$2,$3,$4) as value',[owner,id,'TEST_FAILURE',cancel])).value;
before(async()=>{
 db=new PGlite();
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 GRANT USAGE ON SCHEMA auth TO authenticated;`);
 for(const path of ['docs/supabase-schema.sql','supabase/migrations/20260906002606_billing_event_safety.sql','supabase/migrations/20260906003602_protect_plan_fields.sql','supabase/migrations/20260910120000_pilot_generation_ledger.sql'])
   await db.exec(await readFile(new URL('../'+path,import.meta.url),'utf8'));
 await db.query('INSERT INTO auth.users VALUES($1),($2)',[owner,other]);
 await db.query('INSERT INTO public.admin_users(user_id,email) VALUES($1,$2)',[owner,'fixture@example.invalid']);
 for(const candidate of models)await db.query('INSERT INTO public.ai_model_tests(admin_user_id,candidate,success) VALUES($1,$2,true)',[owner,JSON.stringify(candidate)]);
 await db.query('SELECT public.pilot_apply_model_config($1,$2::jsonb)',[owner,JSON.stringify(models)]);
});
after(async()=>{await db?.close();});
beforeEach(async()=>{
 await db.exec('TRUNCATE public.pilot_content_feedback,public.pilot_revisions,public.ai_credit_ledger,public.ai_generation_steps,public.ai_generations,public.ai_wallets,public.pilot_businesses CASCADE');
 await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[owner]);
 await db.exec('UPDATE public.ai_model_state SET rotation_cursor=0; UPDATE public.user_plans SET is_blocked=false');
 await db.exec('TRUNCATE public.ai_model_health');
});
test('pilot allowance is granted once and never resets with repeated wallet reads',async()=>{
 assert.equal((await wallet()).available,30);assert.equal((await wallet()).balance,30);
 assert.equal((await row('SELECT count(*)::int n FROM public.ai_credit_ledger')).n,1);
});
test('concurrent idempotent reservations reserve once and pin a model/configuration',async()=>{
 const req=request();const results=await Promise.all(Array.from({length:6},()=>reserve(req)));
 assert.equal(new Set(results.map(g=>g.id)).size,1);assert.equal((await wallet()).reserved,20);
 assert.deepEqual(results[0].selected_model,models[0]);
 assert.equal((await row("SELECT count(*)::int n FROM public.ai_credit_ledger WHERE kind='reserve'")).n,1);
});
test('50/50 rotation alternates new logical operations and retains the model on replay',async()=>{
 const selected=[];
 for(let i=0;i<4;i++){
  const req=request({operation:'idea',parameters:{}});const generation=await reserve(req);
  selected.push(generation.selected_model.provider);assert.equal((await reserve(req)).selected_model.provider,generation.selected_model.provider);
  const execution=await claim(generation.id,'result');await complete(generation.id,execution.executionId,'result');
 }
 assert.deepEqual(selected,['openai','gemini','openai','gemini']);
});
test('temporary provider quarantine selects a healthy model and all unavailable models never reserve credits',async()=>{
 await wallet();await db.exec("INSERT INTO public.ai_model_health(provider,model,unavailable_until) VALUES('openai','gpt-5.6-luna',now()+interval '5 minutes')");
 const g=await reserve(request({operation:'idea',parameters:{}}));assert.equal(g.selected_model.provider,'gemini');await release(g.id);
 await db.exec("INSERT INTO public.ai_model_health(provider,model,unavailable_until) VALUES('gemini','gemini-3.8-flash',now()+interval '5 minutes')");
 await assert.rejects(reserve(request({operation:'idea',parameters:{}})),/MODELS_COOLDOWN/);assert.equal((await wallet()).reserved,0);
});
test('a changed operation or input cannot reuse an idempotency key',async()=>{
 const req=request();await reserve(req);
 await assert.rejects(reserve({...req,inputHash:'different'}),/IDEMPOTENCY_CONFLICT/);
 await assert.rejects(reserve({...req,operation:'idea'}),/IDEMPOTENCY_CONFLICT/);
});
test('full strategy persists each step and only charges once after the final commit',async()=>{
 const req=request();const g=await reserve(req);
 for(const stage of ['idealCustomerProfile','monetizationIdeas','instagramBio','storiesStrategy','final']){
  const c=await claim(g.id,stage);assert.equal(c.claimed,true);
  const result=await complete(g.id,c.executionId,stage);
  assert.equal(result.status,stage==='final'?'completed':'awaiting_input');
  assert.equal((await wallet()).balance,stage==='final'?10:30);
 }
 assert.equal((await wallet()).reserved,0);
 assert.equal((await reserve(req)).status,'completed');
 assert.equal((await row("SELECT count(*)::int n FROM public.ai_credit_ledger WHERE kind='charge'")).n,1);
 assert.equal((await row('SELECT count(*)::int n FROM public.pilot_revisions')).n,5);
});
test('stage order, single execution lease and cached stages prevent duplicate provider calls',async()=>{
 const g=await reserve(request());await assert.rejects(claim(g.id,'final'),/STAGE_ORDER/);
 const first=await claim(g.id);assert.equal((await claim(g.id)).busy,true);
 await complete(g.id,first.executionId);assert.equal((await claim(g.id)).cached,true);
 await assert.rejects(complete(g.id,first.executionId),/EXECUTION_EXPIRED/);
});
test('failure releases once, preserves earlier content and retry reserves once without redoing it',async()=>{
 const req=request();const g=await reserve(req);const c=await claim(g.id);await complete(g.id,c.executionId);
 await release(g.id);await release(g.id);assert.equal((await wallet()).available,30);
 assert.equal((await reserve(req)).status,'failed');
 await reserve({...req,retry:true});assert.equal((await wallet()).reserved,20);
 assert.equal((await claim(g.id)).cached,true);
 assert.equal((await row("SELECT count(*)::int n FROM public.ai_credit_ledger WHERE kind='release'")).n,1);
});
test('cancellation rejects a late provider completion and leaves no debit',async()=>{
 const g=await reserve(request());const c=await claim(g.id);await release(g.id,true);
 await assert.rejects(complete(g.id,c.executionId),/EXECUTION_EXPIRED/);
 assert.equal((await wallet()).balance,30);assert.equal((await wallet()).reserved,0);
});
test('a late failed worker cannot release the reservation of a newer retry',async()=>{
 const req=request();const g=await reserve(req);const first=await claim(g.id);await release(g.id,true);
 await reserve({...req,retry:true});const second=await claim(g.id);
 await db.query('SELECT public.pilot_release_generation($1,$2,$3,false,$4)',[owner,g.id,'OLD_ATTEMPT_FAILURE',first.executionId]);
 assert.equal((await wallet()).reserved,20);await complete(g.id,second.executionId);
});
test('latest attempt parameters persist before a provider call and cached output has a stable version ID',async()=>{
 const g=await reserve(request());const parameters={stage:'idealCustomerProfile',workspace:{selectedMonetizationIds:[],storiesAgenda:{days:[]}}};
 const execution=randomUUID();await db.query('SELECT public.pilot_claim_step($1,$2,$3,$4,$5,$6)',[owner,g.id,'idealCustomerProfile','hash',execution,JSON.stringify(parameters)]);
 assert.deepEqual((await row('SELECT parameters FROM public.ai_generations WHERE id=$1',[g.id])).parameters,parameters);
 const result=await complete(g.id,execution);assert.equal((await claim(g.id)).versionId,result.versionId);
});
test('persistence failure rolls back output and debit as one transaction',async()=>{
 const g=await reserve(request({operation:'idea',parameters:{}}));const c=await claim(g.id,'result');
 await db.exec(`CREATE FUNCTION public.reject_pilot_fixture() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'fixture storage failure'; END$$;
 CREATE TRIGGER reject_pilot_fixture BEFORE INSERT ON public.pilot_revisions FOR EACH ROW EXECUTE FUNCTION public.reject_pilot_fixture();`);
 try{await assert.rejects(complete(g.id,c.executionId,'result'),/fixture storage failure/);assert.equal((await wallet()).balance,30);assert.equal((await wallet()).reserved,1);}
 finally{await db.exec('DROP TRIGGER reject_pilot_fixture ON public.pilot_revisions; DROP FUNCTION public.reject_pilot_fixture()');}
 await complete(g.id,c.executionId,'result');assert.equal((await wallet()).balance,29);
});
test('server prices enforce story quantities and cannot be overridden by client cost',async()=>{
 const cost=async(op,p)=>(await row('select public.pilot_credit_cost($1,$2) cost',[op,JSON.stringify(p)])).cost;
 assert.equal(await cost('stories_day',{storyCount:6,cost:1}),4);assert.equal(await cost('stories_week',{storyCount:71}),30);
 await assert.rejects(cost('stories_day',{storyCount:0}),/INVALID_COUNT/);
 await assert.rejects(cost('stories_week',{storyCount:106}),/INVALID_COUNT/);
 const g=await reserve(request({operation:'script',credits:0,parameters:{cost:0}}));assert.equal(g.credits,2);
});
test('insufficient credits never create an extra reservation or negative available balance',async()=>{
 await reserve(request());await assert.rejects(reserve(request()),/INSUFFICIENT_CREDITS/);
 assert.equal((await wallet()).available,10);
});
test('expired reservation is reconciled before another debit and a stale lease cannot complete',async()=>{
 const g=await reserve(request());const c=await claim(g.id);
 await db.query("UPDATE public.ai_generation_steps SET lease_until=now()-interval '1 second' WHERE generation_id=$1",[g.id]);
 await db.query('SELECT public.pilot_reconcile($1)',[owner]);
 assert.equal((await wallet()).available,30);await assert.rejects(complete(g.id,c.executionId),/EXECUTION_EXPIRED/);
});
test('business ownership and parent generation ownership are checked before reserving',async()=>{
 const g=await reserve(request());await assert.rejects(reserve(request(),other),/OWNERSHIP/);
 await assert.rejects(reserve(request({businessId:randomUUID(),parentGenerationId:g.id}),other),/OWNERSHIP/);
});
test('authenticated clients cannot mutate balance, legacy usage, versions or invoke privileged RPCs',async()=>{
 await wallet();await db.exec('SET ROLE authenticated');
 try{
  for(const sql of ["UPDATE public.ai_wallets SET balance=900","UPDATE public.user_plans SET strategies_used=0","UPDATE public.user_plans SET period_start=now()","DELETE FROM public.pilot_revisions"])
   await assert.rejects(db.exec(sql),/permission denied/);
  await assert.rejects(wallet(),/permission denied/);
  assert.equal((await row('SELECT balance FROM public.ai_wallets')).balance,30);
 }finally{await db.exec('RESET ROLE');}
});
test('RLS hides another account generations and ledger even from an admin client',async()=>{
 await reserve(request());await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[other]);await db.exec('SET ROLE authenticated');
 try{for(const table of ['ai_wallets','ai_generations','ai_credit_ledger','pilot_revisions','pilot_businesses'])assert.equal((await db.query('SELECT * FROM public.'+table)).rows.length,0);}
 finally{await db.exec('RESET ROLE');}
});
test('model activation requires matching recent tests and writes config plus audit atomically',async()=>{
 const changed=[{...models[0],reasoning:'high'}];
 await assert.rejects(db.query('SELECT public.pilot_apply_model_config($1,$2)',[owner,JSON.stringify(changed)]),/MODEL_TEST_REQUIRED/);
 await assert.rejects(db.query('SELECT public.pilot_apply_model_config($1,$2)',[other,JSON.stringify(models)]),/ADMIN_REQUIRED/);
 const count=(await row('SELECT count(*)::int n FROM public.ai_model_configs')).n;
 await db.exec(`CREATE FUNCTION public.reject_config_fixture() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'fixture audit failure'; END$$;
 CREATE TRIGGER reject_config_fixture BEFORE INSERT ON public.admin_audit_logs FOR EACH ROW EXECUTE FUNCTION public.reject_config_fixture();`);
 try{await assert.rejects(db.query('SELECT public.pilot_apply_model_config($1,$2)',[owner,JSON.stringify(models)]),/fixture audit failure/);assert.equal((await row('SELECT count(*)::int n FROM public.ai_model_configs')).n,count);}
 finally{await db.exec('DROP TRIGGER reject_config_fixture ON public.admin_audit_logs; DROP FUNCTION public.reject_config_fixture()');}
});
test('admin credit grant retries have one effect and reset cannot consume active reservations',async()=>{
 await wallet();const args=[owner,owner,10,'grant-fixture-key','Teste',false];
 const sql='SELECT public.pilot_admin_credits($1,$2,$3,$4,$5,$6)';await db.query(sql,args);await db.query(sql,args);assert.equal((await wallet()).balance,40);
 await reserve(request());await assert.rejects(db.query(sql,[owner,owner,10,'reset-fixture-key','Teste',true]),/ACTIVE_RESERVATIONS/);
});
