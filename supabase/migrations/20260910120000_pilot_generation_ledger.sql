-- Pilot wallet. Apply together with the new call-ai and admin-api functions.
-- Legacy strategy balances/contracts are preserved in their original tables.
BEGIN;

CREATE TABLE public.pilot_businesses (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ai_wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 30 CHECK(balance >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK(reserved >= 0 AND reserved <= balance),
  allowance integer NOT NULL DEFAULT 30 CHECK(allowance >= 0),
  policy_revision text NOT NULL DEFAULT 'pilot-2026-09-10',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ai_model_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  candidate jsonb NOT NULL, success boolean NOT NULL, code text,
  metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ai_model_configs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, models jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id), rollback_of bigint REFERENCES public.ai_model_configs(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ai_model_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  config_id bigint REFERENCES public.ai_model_configs(id), rotation_cursor bigint NOT NULL DEFAULT 0
);
INSERT INTO public.ai_model_state(singleton) VALUES(true);
CREATE TABLE public.ai_model_health (
  provider text NOT NULL, model text NOT NULL, unavailable_until timestamptz,
  code text, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(provider, model)
);
CREATE TABLE public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.pilot_businesses(id), strategy_id uuid,
  idempotency_key uuid NOT NULL, operation text NOT NULL,
  status text NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','processing','awaiting_input','completed','failed','canceled')),
  credits integer NOT NULL CHECK(credits > 0), input_hash text NOT NULL, input jsonb NOT NULL,
  parameters jsonb NOT NULL DEFAULT '{}', output jsonb NOT NULL DEFAULT '{}',
  parent_generation_id uuid REFERENCES public.ai_generations(id),
  config_id bigint REFERENCES public.ai_model_configs(id), selected_model jsonb NOT NULL,
  provider text, model text, prompt_revision text NOT NULL DEFAULT 'pilot-2026-09-10',
  metadata jsonb NOT NULL DEFAULT '{}', error_code text,
  reservation_expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,idempotency_key)
);
CREATE INDEX ai_generations_history ON public.ai_generations(user_id,business_id,created_at DESC,id DESC);
CREATE TABLE public.ai_generation_steps (
  generation_id uuid NOT NULL REFERENCES public.ai_generations(id) ON DELETE CASCADE,
  stage text NOT NULL, input_hash text NOT NULL, status text NOT NULL CHECK(status IN ('processing','completed','failed')),
  execution_id uuid NOT NULL, lease_until timestamptz NOT NULL,
  output jsonb, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(generation_id,stage)
);
CREATE TABLE public.ai_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id uuid REFERENCES public.ai_generations(id),
  kind text NOT NULL CHECK(kind IN ('allowance','grant','reserve','release','charge','adjustment')),
  amount integer NOT NULL, balance_after integer NOT NULL, reserved_after integer NOT NULL,
  reference text UNIQUE, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_credit_ledger_owner ON public.ai_credit_ledger(user_id,created_at DESC);
CREATE TABLE public.pilot_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.pilot_businesses(id), strategy_id uuid,
  generation_id uuid REFERENCES public.ai_generations(id), parent_revision_id uuid REFERENCES public.pilot_revisions(id),
  kind text NOT NULL CHECK(kind IN ('input','manual_edit','selection','agenda','generation')),
  title text NOT NULL CHECK(length(title) BETWEEN 1 AND 180), content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pilot_revisions_owner ON public.pilot_revisions(user_id,business_id,created_at DESC,id DESC);
CREATE TABLE public.pilot_content_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.pilot_businesses(id), version_id uuid NOT NULL REFERENCES public.pilot_revisions(id),
  content_id text NOT NULL, rating text NOT NULL CHECK(rating IN ('good','bad','unrated')),
  goal text NOT NULL CHECK(goal IN ('reach','interaction','retention','conversion')),
  published boolean NOT NULL DEFAULT false, published_at timestamptz, period text, metrics text, notes text,
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,version_id,content_id),
  CHECK(published OR published_at IS NULL)
);

-- Clients only read their rows. All mutations are authenticated and validated by Edge.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['pilot_businesses','ai_wallets','ai_generations','ai_credit_ledger','pilot_revisions','pilot_content_feedback'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
    EXECUTE format('CREATE POLICY owner_read ON public.%I FOR SELECT TO authenticated USING(user_id=auth.uid())',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['ai_generation_steps','ai_model_tests','ai_model_configs','ai_model_state','ai_model_health'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
  END LOOP;
END $$;
GRANT USAGE,SELECT ON SEQUENCE public.ai_model_configs_id_seq TO service_role;
-- Close SEC-002, including old column-level grants.
REVOKE UPDATE ON public.user_plans FROM authenticated,anon;
REVOKE UPDATE(strategies_used,period_start) ON public.user_plans FROM authenticated,anon;

CREATE FUNCTION public.pilot_wallet(p_user uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE w public.ai_wallets%ROWTYPE;
BEGIN
  INSERT INTO public.user_plans(user_id) VALUES(p_user) ON CONFLICT(user_id) DO NOTHING;
  INSERT INTO public.ai_wallets(user_id) VALUES(p_user) ON CONFLICT(user_id) DO NOTHING;
  IF FOUND THEN
    INSERT INTO public.ai_credit_ledger(user_id,kind,amount,balance_after,reserved_after,reference,metadata)
    VALUES(p_user,'allowance',30,30,0,'pilot-once:'||p_user,'{"policy":"pilot-2026-09-10","recurring":false}');
  END IF;
  SELECT * INTO STRICT w FROM public.ai_wallets WHERE user_id=p_user;
  RETURN to_jsonb(w)||jsonb_build_object('available',w.balance-w.reserved);
END $$;

CREATE FUNCTION public.pilot_credit_cost(p_operation text,p_parameters jsonb) RETURNS integer
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE n integer;
BEGIN
  CASE p_operation
    WHEN 'full_strategy' THEN RETURN 20;
    WHEN 'idea' THEN RETURN 1;
    WHEN 'variation' THEN RETURN 1;
    WHEN 'refine_short' THEN RETURN 1;
    WHEN 'script' THEN RETURN 2;
    WHEN 'attachment_ocr' THEN RETURN 2;
    WHEN 'stories_day' THEN
      n := (p_parameters->>'storyCount')::integer;
      IF n IS NULL OR n<1 OR n>15 THEN RAISE EXCEPTION 'INVALID_COUNT'; END IF;
      RETURN ((n+4)/5)*2;
    WHEN 'stories_week' THEN
      n := (p_parameters->>'storyCount')::integer;
      IF n IS NULL OR n<1 OR n>105 THEN RAISE EXCEPTION 'INVALID_COUNT'; END IF;
      RETURN ((n+34)/35)*10;
    WHEN 'monetization_plan' THEN
      n := jsonb_array_length(p_parameters->'selectedMonetizationIds');
      IF n IS NULL OR n<1 OR n>3 THEN RAISE EXCEPTION 'INVALID_SELECTION'; END IF;
      RETURN 5;
    WHEN 'section' THEN
      CASE p_parameters->>'section'
        WHEN 'instagramBio' THEN RETURN 2;
        WHEN 'idealCustomerProfile' THEN RETURN 3;
        WHEN 'monetizationIdeas' THEN RETURN 3;
        WHEN 'contentTable' THEN RETURN 5;
        WHEN 'editorialCalendar' THEN RETURN 5;
        WHEN 'actionPlan' THEN RETURN 3;
        ELSE RAISE EXCEPTION 'INVALID_SECTION';
      END CASE;
    ELSE RAISE EXCEPTION 'INVALID_OPERATION';
  END CASE;
END $$;

CREATE FUNCTION public.pilot_release_generation(p_user uuid,p_generation uuid,p_code text,p_canceled boolean DEFAULT false,p_execution uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE g public.ai_generations%ROWTYPE; w public.ai_wallets%ROWTYPE;
BEGIN
  SELECT * INTO STRICT w FROM public.ai_wallets WHERE user_id=p_user FOR UPDATE;
  SELECT * INTO STRICT g FROM public.ai_generations WHERE id=p_generation AND user_id=p_user FOR UPDATE;
  IF p_execution IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ai_generation_steps WHERE generation_id=g.id AND execution_id=p_execution AND status='processing') THEN RETURN to_jsonb(g); END IF;
  IF g.status IN ('reserved','processing','awaiting_input') THEN
    UPDATE public.ai_wallets SET reserved=reserved-g.credits,updated_at=now() WHERE user_id=p_user RETURNING * INTO w;
    UPDATE public.ai_generations SET status=CASE WHEN p_canceled THEN 'canceled' ELSE 'failed' END,
      error_code=left(p_code,80),updated_at=now() WHERE id=g.id RETURNING * INTO g;
    UPDATE public.ai_generation_steps SET status='failed' WHERE generation_id=g.id AND status='processing';
    INSERT INTO public.ai_credit_ledger(user_id,generation_id,kind,amount,balance_after,reserved_after,metadata)
      VALUES(p_user,g.id,'release',g.credits,w.balance,w.reserved,jsonb_build_object('code',left(p_code,80)));
  END IF;
  RETURN to_jsonb(g);
END $$;

CREATE FUNCTION public.pilot_admin_usage_metrics(p_admin uuid,p_since timestamptz) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE used integer; granted integer; cost numeric; priced integer; unpriced integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=p_admin AND active) THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
 SELECT coalesce(-sum(amount) FILTER(WHERE kind='charge'),0),coalesce(sum(amount) FILTER(WHERE kind='grant'),0)
 INTO used,granted FROM public.ai_credit_ledger WHERE created_at>=p_since;
 SELECT sum(CASE WHEN jsonb_typeof(metadata->'estimatedCostUsd')='number' THEN (metadata->>'estimatedCostUsd')::numeric END),
 count(*) FILTER(WHERE jsonb_typeof(metadata->'estimatedCostUsd')='number'),
 count(*) FILTER(WHERE jsonb_typeof(metadata->'estimatedCostUsd') IS DISTINCT FROM 'number' OR coalesce((metadata->>'fallback')::boolean,false))
 INTO cost,priced,unpriced FROM public.ai_generation_steps WHERE created_at>=p_since AND status IN ('completed','failed');
 RETURN jsonb_build_object('creditsUsed',used,'extraCreditsGranted',granted,'extraCreditsUsed',NULL,
   'estimatedAiCostUsd',cost,'aiCostMeasuredOperations',priced,'aiCostUnpricedOperations',unpriced,
   'aiCostUnit','generation_step','estimatedAiCost',NULL);
END $$;

CREATE FUNCTION public.pilot_reconcile(p_user uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE g record; BEGIN
  PERFORM 1 FROM public.ai_wallets WHERE user_id=p_user FOR UPDATE;
  FOR g IN SELECT id FROM public.ai_generations WHERE user_id=p_user AND status IN ('reserved','processing','awaiting_input')
    AND (reservation_expires_at<now() OR EXISTS(SELECT 1 FROM public.ai_generation_steps s WHERE s.generation_id=ai_generations.id AND s.status='processing' AND s.lease_until<now()))
  LOOP PERFORM public.pilot_release_generation(p_user,g.id,'TIMEOUT'); END LOOP;
END $$;

CREATE FUNCTION public.pilot_reserve_generation(p_user uuid,p_request jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE g public.ai_generations%ROWTYPE; w public.ai_wallets%ROWTYPE; c public.ai_model_configs%ROWTYPE;
  v_cursor bigint; chosen jsonb; v_total integer; v_slot integer; v_gcd integer:=0; v_available jsonb; entry jsonb; cost integer;
  v_business uuid := (p_request->>'businessId')::uuid;
BEGIN
  PERFORM public.pilot_wallet(p_user);
  SELECT * INTO STRICT w FROM public.ai_wallets WHERE user_id=p_user FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.user_plans WHERE user_id=p_user AND is_blocked) THEN RAISE EXCEPTION 'USER_BLOCKED'; END IF;
  PERFORM public.pilot_reconcile(p_user);
  SELECT * INTO w FROM public.ai_wallets WHERE user_id=p_user;
  INSERT INTO public.pilot_businesses(id,user_id,name) VALUES(v_business,p_user,left(coalesce(p_request->'input'->>'brandName',''),120)) ON CONFLICT(id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM public.pilot_businesses WHERE id=v_business AND user_id=p_user) THEN RAISE EXCEPTION 'OWNERSHIP'; END IF;
  IF EXISTS(SELECT 1 FROM public.strategies WHERE id=(p_request->>'strategyId')::uuid AND user_id<>p_user) THEN RAISE EXCEPTION 'OWNERSHIP'; END IF;
  IF p_request->>'parentGenerationId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ai_generations WHERE id=(p_request->>'parentGenerationId')::uuid AND user_id=p_user AND business_id=v_business) THEN RAISE EXCEPTION 'OWNERSHIP'; END IF;
  SELECT * INTO g FROM public.ai_generations WHERE user_id=p_user AND idempotency_key=(p_request->>'idempotencyKey')::uuid FOR UPDATE;
  IF FOUND THEN
    IF g.business_id<>v_business OR g.operation<>p_request->>'operation' OR g.input_hash<>p_request->>'inputHash' THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
    IF g.status IN ('failed','canceled') AND coalesce((p_request->>'retry')::boolean,false) THEN
      IF w.balance-w.reserved<g.credits THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;
      UPDATE public.ai_wallets SET reserved=reserved+g.credits,updated_at=now() WHERE user_id=p_user RETURNING * INTO w;
      UPDATE public.ai_generations SET status='reserved',error_code=NULL,reservation_expires_at=now()+interval '24 hours',updated_at=now() WHERE id=g.id RETURNING * INTO g;
      INSERT INTO public.ai_credit_ledger(user_id,generation_id,kind,amount,balance_after,reserved_after) VALUES(p_user,g.id,'reserve',g.credits,w.balance,w.reserved);
    END IF;
    RETURN to_jsonb(g);
  END IF;
  IF (SELECT count(*) FROM public.ai_generations WHERE user_id=p_user AND status IN ('reserved','processing','awaiting_input'))>=3 THEN RAISE EXCEPTION 'TOO_MANY_PENDING'; END IF;
  IF (SELECT count(*) FROM public.ai_generations WHERE user_id=p_user AND created_at>now()-interval '1 minute')>=12 THEN RAISE EXCEPTION 'RATE_LIMITED'; END IF;
  IF p_request->>'operation'='full_strategy' AND (SELECT count(*) FROM public.ai_generations WHERE user_id=p_user AND operation='full_strategy' AND created_at>now()-interval '24 hours')>=3 THEN RAISE EXCEPTION 'DAILY_BUNDLE_LIMIT'; END IF;
  cost:=public.pilot_credit_cost(p_request->>'operation',coalesce(p_request->'parameters','{}'));
  IF w.balance-w.reserved<cost THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;
  SELECT config_id,rotation_cursor INTO c.id,v_cursor FROM public.ai_model_state WHERE singleton FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'MODEL_CONFIG_REQUIRED'; END IF;
  SELECT * INTO STRICT c FROM public.ai_model_configs WHERE id=c.id;
  SELECT jsonb_agg(value) INTO v_available FROM jsonb_array_elements(c.models)
    WHERE NOT EXISTS(SELECT 1 FROM public.ai_model_health h WHERE h.provider=value->>'provider' AND h.model=value->>'model' AND h.unavailable_until>now());
  IF v_available IS NULL THEN RAISE EXCEPTION 'MODELS_COOLDOWN'; END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(v_available) LOOP
    v_gcd:=gcd(v_gcd,(entry->>'weight')::integer);
  END LOOP;
  SELECT sum((value->>'weight')::integer/v_gcd) INTO v_total FROM jsonb_array_elements(v_available);
  v_slot:=(v_cursor%v_total)::integer;
  FOR entry IN SELECT value FROM jsonb_array_elements(v_available) LOOP
    IF v_slot<(entry->>'weight')::integer/v_gcd THEN chosen:=entry; EXIT; END IF;
    v_slot:=v_slot-(entry->>'weight')::integer/v_gcd;
  END LOOP;
  UPDATE public.ai_model_state SET rotation_cursor=rotation_cursor+1 WHERE singleton;
  INSERT INTO public.ai_generations(user_id,business_id,strategy_id,idempotency_key,operation,credits,input_hash,input,parameters,parent_generation_id,config_id,selected_model)
    VALUES(p_user,v_business,(p_request->>'strategyId')::uuid,(p_request->>'idempotencyKey')::uuid,p_request->>'operation',cost,p_request->>'inputHash',p_request->'input',coalesce(p_request->'parameters','{}'),(p_request->>'parentGenerationId')::uuid,c.id,chosen) RETURNING * INTO g;
  UPDATE public.ai_wallets SET reserved=reserved+cost,updated_at=now() WHERE user_id=p_user RETURNING * INTO w;
  INSERT INTO public.ai_credit_ledger(user_id,generation_id,kind,amount,balance_after,reserved_after) VALUES(p_user,g.id,'reserve',cost,w.balance,w.reserved);
  RETURN to_jsonb(g);
END $$;

CREATE FUNCTION public.pilot_claim_step(p_user uuid,p_generation uuid,p_stage text,p_hash text,p_execution uuid,p_parameters jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE g public.ai_generations%ROWTYPE; s public.ai_generation_steps%ROWTYPE; previous text;
BEGIN
  PERFORM 1 FROM public.ai_wallets WHERE user_id=p_user FOR UPDATE;
  SELECT * INTO STRICT g FROM public.ai_generations WHERE id=p_generation AND user_id=p_user FOR UPDATE;
  SELECT * INTO s FROM public.ai_generation_steps WHERE generation_id=g.id AND stage=p_stage;
  IF FOUND AND s.status='completed' THEN RETURN jsonb_build_object('cached',true,'output',s.output,'versionId',s.metadata->>'versionId'); END IF;
  IF g.status NOT IN ('reserved','awaiting_input') THEN RETURN jsonb_build_object('busy',g.status='processing','status',g.status); END IF;
  IF g.operation='full_strategy' THEN
    previous:=CASE p_stage WHEN 'idealCustomerProfile' THEN NULL WHEN 'monetizationIdeas' THEN 'idealCustomerProfile' WHEN 'instagramBio' THEN 'monetizationIdeas' WHEN 'storiesStrategy' THEN 'instagramBio' WHEN 'final' THEN 'storiesStrategy' ELSE 'INVALID' END;
    IF previous='INVALID' OR (previous IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ai_generation_steps WHERE generation_id=g.id AND stage=previous AND status='completed')) THEN RAISE EXCEPTION 'STAGE_ORDER'; END IF;
  ELSIF p_stage<>'result' THEN RAISE EXCEPTION 'INVALID_STAGE'; END IF;
  INSERT INTO public.ai_generation_steps(generation_id,stage,input_hash,status,execution_id,lease_until)
    VALUES(g.id,p_stage,p_hash,'processing',p_execution,now()+interval '6 minutes')
    ON CONFLICT(generation_id,stage) DO UPDATE SET input_hash=EXCLUDED.input_hash,status='processing',execution_id=EXCLUDED.execution_id,lease_until=EXCLUDED.lease_until;
  UPDATE public.ai_generations SET status='processing',parameters=coalesce(p_parameters,parameters),updated_at=now() WHERE id=g.id;
  RETURN jsonb_build_object('claimed',true,'executionId',p_execution);
END $$;

CREATE FUNCTION public.pilot_complete_step(p_user uuid,p_generation uuid,p_stage text,p_execution uuid,p_output jsonb,p_aggregate jsonb,p_metadata jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE g public.ai_generations%ROWTYPE; w public.ai_wallets%ROWTYPE; revision uuid; completed boolean;
BEGIN
  SELECT * INTO STRICT w FROM public.ai_wallets WHERE user_id=p_user FOR UPDATE;
  SELECT * INTO STRICT g FROM public.ai_generations WHERE id=p_generation AND user_id=p_user FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM public.ai_generation_steps WHERE generation_id=g.id AND stage=p_stage AND execution_id=p_execution AND status='processing' AND lease_until>=now()) OR g.status<>'processing' OR g.reservation_expires_at<now() THEN RAISE EXCEPTION 'EXECUTION_EXPIRED'; END IF;
  completed:=g.operation<>'full_strategy' OR p_stage='final';
  revision:=coalesce((p_metadata->>'versionId')::uuid,gen_random_uuid());
  INSERT INTO public.pilot_revisions(id,user_id,business_id,strategy_id,generation_id,kind,title,content)
    VALUES(revision,p_user,g.business_id,g.strategy_id,g.id,'generation',g.operation||': '||p_stage,p_output);
  UPDATE public.ai_generation_steps SET status='completed',output=p_output,metadata=p_metadata||jsonb_build_object('versionId',revision) WHERE generation_id=g.id AND stage=p_stage;
  UPDATE public.ai_generations SET status=CASE WHEN completed THEN 'completed' ELSE 'awaiting_input' END,
    output=p_aggregate,provider=p_metadata->>'provider',model=p_metadata->>'model',
    selected_model=coalesce(p_metadata->'effectiveConfig',selected_model),
    metadata=metadata||jsonb_build_object(p_stage,p_metadata||jsonb_build_object('versionId',revision)),updated_at=now()
    WHERE id=g.id RETURNING * INTO g;
  IF completed THEN
    UPDATE public.ai_wallets SET balance=balance-g.credits,reserved=reserved-g.credits,updated_at=now() WHERE user_id=p_user RETURNING * INTO w;
    INSERT INTO public.ai_credit_ledger(user_id,generation_id,kind,amount,balance_after,reserved_after,reference)
      VALUES(p_user,g.id,'charge',-g.credits,w.balance,w.reserved,'charge:'||g.id);
  END IF;
  RETURN to_jsonb(g)||jsonb_build_object('versionId',revision);
END $$;

CREATE FUNCTION public.pilot_apply_model_config(p_admin uuid,p_models jsonb,p_rollback bigint DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_candidate jsonb; revision bigint;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=p_admin AND active) THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  IF jsonb_typeof(p_models)<>'array' OR jsonb_array_length(p_models) NOT BETWEEN 1 AND 4 THEN RAISE EXCEPTION 'INVALID_CONFIG'; END IF;
  FOR v_candidate IN SELECT value FROM jsonb_array_elements(p_models) LOOP
    IF v_candidate->>'provider' NOT IN ('openai','gemini') OR (v_candidate->>'weight')::integer NOT BETWEEN 1 AND 100 OR NOT EXISTS(
      SELECT 1 FROM public.ai_model_tests t WHERE t.admin_user_id=p_admin AND t.success AND t.candidate=v_candidate AND t.created_at>now()-interval '24 hours') THEN RAISE EXCEPTION 'MODEL_TEST_REQUIRED'; END IF;
  END LOOP;
  PERFORM 1 FROM public.ai_model_state WHERE singleton FOR UPDATE;
  INSERT INTO public.ai_model_configs(models,created_by,rollback_of) VALUES(p_models,p_admin,p_rollback) RETURNING id INTO revision;
  UPDATE public.ai_model_state SET config_id=revision,rotation_cursor=0 WHERE singleton;
  INSERT INTO public.admin_audit_logs(admin_user_id,action,target_type,target_id,metadata)
    VALUES(p_admin,'applyAiConfig','ai_model_config',revision::text,jsonb_build_object('models',p_models,'rollbackOf',p_rollback));
  RETURN jsonb_build_object('revision',revision,'models',p_models);
END $$;

CREATE FUNCTION public.pilot_admin_credits(p_admin uuid,p_user uuid,p_amount integer,p_reference text,p_reason text,p_reset boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE w public.ai_wallets%ROWTYPE; delta integer; receipt public.ai_credit_ledger%ROWTYPE;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id=p_admin AND active) THEN RAISE EXCEPTION 'ADMIN_REQUIRED'; END IF;
  IF p_amount<0 OR p_amount>100000 OR length(p_reference)<8 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  PERFORM public.pilot_wallet(p_user);
  SELECT * INTO STRICT w FROM public.ai_wallets WHERE user_id=p_user FOR UPDATE;
  SELECT * INTO receipt FROM public.ai_credit_ledger WHERE reference=p_reference;
  IF FOUND THEN
    IF receipt.user_id<>p_user OR (receipt.metadata->>'requestedAmount')::integer IS DISTINCT FROM p_amount OR (receipt.metadata->>'reset')::boolean IS DISTINCT FROM p_reset THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
    RETURN public.pilot_wallet(p_user);
  END IF;
  delta:=CASE WHEN p_reset THEN p_amount-w.balance ELSE p_amount END;
  IF w.balance+delta<w.reserved THEN RAISE EXCEPTION 'ACTIVE_RESERVATIONS'; END IF;
  UPDATE public.ai_wallets SET balance=balance+delta,updated_at=now() WHERE user_id=p_user RETURNING * INTO w;
  INSERT INTO public.ai_credit_ledger(user_id,kind,amount,balance_after,reserved_after,reference,metadata)
    VALUES(p_user,CASE WHEN p_reset THEN 'adjustment' ELSE 'grant' END,delta,w.balance,w.reserved,p_reference,jsonb_build_object('reason',left(p_reason,500),'admin',p_admin,'requestedAmount',p_amount,'reset',p_reset));
  INSERT INTO public.admin_audit_logs(admin_user_id,action,target_type,target_user_id,metadata)
    VALUES(p_admin,CASE WHEN p_reset THEN 'resetPilotCredits' ELSE 'grantPilotCredits' END,'ai_wallet',p_user,jsonb_build_object('amount',delta,'reference',p_reference));
  RETURN public.pilot_wallet(p_user);
END $$;

-- Every privileged RPC is service-only, regardless of defaults in the destination project.
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN
 ('pilot_wallet','pilot_credit_cost','pilot_release_generation','pilot_reconcile','pilot_reserve_generation','pilot_claim_step','pilot_complete_step','pilot_apply_model_config','pilot_admin_credits','pilot_admin_usage_metrics') LOOP
  EXECUTE 'REVOKE ALL ON FUNCTION '||f.signature||' FROM PUBLIC,anon,authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION '||f.signature||' TO service_role';
 END LOOP;
END $$;
COMMIT;
