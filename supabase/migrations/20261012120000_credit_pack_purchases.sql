-- Credit packs bought through Stripe Checkout (one-time payment).
-- Called only by the stripe-webhook function with the service role. The ledger reference
-- ("stripe-checkout:<session id>") is unique, so a resent webhook never credits twice.
CREATE OR REPLACE FUNCTION public.pilot_purchase_credits(p_user uuid, p_amount integer, p_reference text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE w public.ai_wallets%ROWTYPE; receipt public.ai_credit_ledger%ROWTYPE;
BEGIN
  IF p_amount<1 OR p_amount>100000 OR p_reference IS NULL OR p_reference NOT LIKE 'stripe-checkout:%' OR length(p_reference)<20 THEN
    RAISE EXCEPTION 'INVALID_PURCHASE';
  END IF;
  PERFORM public.pilot_wallet(p_user);
  SELECT * INTO STRICT w FROM public.ai_wallets WHERE user_id=p_user FOR UPDATE;
  SELECT * INTO receipt FROM public.ai_credit_ledger WHERE reference=p_reference;
  IF FOUND THEN
    IF receipt.user_id<>p_user OR receipt.amount<>p_amount THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
    RETURN public.pilot_wallet(p_user);
  END IF;
  UPDATE public.ai_wallets SET balance=balance+p_amount,updated_at=now() WHERE user_id=p_user RETURNING * INTO w;
  INSERT INTO public.ai_credit_ledger(user_id,kind,amount,balance_after,reserved_after,reference,metadata)
    VALUES(p_user,'grant',p_amount,w.balance,w.reserved,p_reference,jsonb_build_object('source','stripe')||coalesce(p_metadata,'{}'::jsonb));
  RETURN public.pilot_wallet(p_user);
END $function$;

REVOKE ALL ON FUNCTION public.pilot_purchase_credits(uuid,integer,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pilot_purchase_credits(uuid,integer,text,jsonb) TO service_role;
