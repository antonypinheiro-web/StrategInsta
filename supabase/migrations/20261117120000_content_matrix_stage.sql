-- The content matrix (25 ideas) gets its own step in the full strategy, between the Stories week and the final step.
-- 'final' keeps depending on 'storiesStrategy', so generations started before this change still finish.
CREATE OR REPLACE FUNCTION public.pilot_claim_step(p_user uuid,p_generation uuid,p_stage text,p_hash text,p_execution uuid,p_parameters jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE g public.ai_generations%ROWTYPE; s public.ai_generation_steps%ROWTYPE; previous text;
BEGIN
  PERFORM 1 FROM public.ai_wallets WHERE user_id=p_user FOR UPDATE;
  SELECT * INTO STRICT g FROM public.ai_generations WHERE id=p_generation AND user_id=p_user FOR UPDATE;
  SELECT * INTO s FROM public.ai_generation_steps WHERE generation_id=g.id AND stage=p_stage;
  IF FOUND AND s.status='completed' THEN RETURN jsonb_build_object('cached',true,'output',s.output,'versionId',s.metadata->>'versionId'); END IF;
  IF g.status NOT IN ('reserved','awaiting_input') THEN RETURN jsonb_build_object('busy',g.status='processing','status',g.status); END IF;
  IF g.operation='full_strategy' THEN
    previous:=CASE p_stage WHEN 'idealCustomerProfile' THEN NULL WHEN 'monetizationIdeas' THEN 'idealCustomerProfile' WHEN 'instagramBio' THEN 'monetizationIdeas' WHEN 'storiesStrategy' THEN 'instagramBio' WHEN 'contentMatrix' THEN 'storiesStrategy' WHEN 'final' THEN 'storiesStrategy' ELSE 'INVALID' END;
    IF previous='INVALID' OR (previous IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ai_generation_steps WHERE generation_id=g.id AND stage=previous AND status='completed')) THEN RAISE EXCEPTION 'STAGE_ORDER'; END IF;
  ELSIF p_stage<>'result' THEN RAISE EXCEPTION 'INVALID_STAGE'; END IF;
  INSERT INTO public.ai_generation_steps(generation_id,stage,input_hash,status,execution_id,lease_until)
    VALUES(g.id,p_stage,p_hash,'processing',p_execution,now()+interval '6 minutes')
    ON CONFLICT(generation_id,stage) DO UPDATE SET input_hash=EXCLUDED.input_hash,status='processing',execution_id=EXCLUDED.execution_id,lease_until=EXCLUDED.lease_until;
  UPDATE public.ai_generations SET status='processing',parameters=coalesce(p_parameters,parameters),updated_at=now() WHERE id=g.id;
  RETURN jsonb_build_object('claimed',true,'executionId',p_execution);
END $$;
