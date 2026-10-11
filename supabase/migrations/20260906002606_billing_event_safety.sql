-- Additive migration. Requires existing user_plans and usage_events.
-- Deploy the new webhook only after this transaction has been applied.
BEGIN;

CREATE TABLE public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  event_created bigint NOT NULL CHECK (event_created > 0),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  result text NOT NULL DEFAULT 'processed' CHECK (result IN ('processed', 'stale')),
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stripe_billing_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id text NOT NULL,
  subscription_created bigint NOT NULL,
  event_created bigint NOT NULL,
  subscription_status text NOT NULL
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_billing_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events, public.stripe_billing_state FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.stripe_webhook_events, public.stripe_billing_state TO service_role;

CREATE FUNCTION public.apply_stripe_billing_event(p_event jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid := (p_event->>'user_id')::uuid;
  v_event_id text := p_event->>'event_id';
  v_event_type text := p_event->>'event_type';
  v_event_created bigint := (p_event->>'event_created')::bigint;
  v_customer text := p_event->>'customer_id';
  v_sub text := p_event->>'subscription_id';
  v_sub_created bigint := (p_event->>'subscription_created')::bigint;
  v_status text := p_event->>'subscription_status';
  v_plan text := p_event->>'plan_type';
  v_existing public.user_plans%ROWTYPE;
  v_state public.stripe_billing_state%ROWTYPE;
  v_stale boolean := false;
  v_event_name text;
BEGIN
  IF v_event_id IS NULL OR v_event_id !~ '^evt_[A-Za-z0-9_]+$'
     OR v_user IS NULL OR v_customer IS NULL OR v_customer = ''
     OR v_event_created IS NULL OR v_event_created <= 0
     OR v_event_type IS NULL OR v_event_type NOT IN (
       'checkout.session.completed', 'customer.subscription.created',
       'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.payment_failed') THEN
    RAISE EXCEPTION 'Invalid billing event';
  END IF;

  INSERT INTO public.user_plans(user_id) VALUES(v_user) ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO STRICT v_existing FROM public.user_plans WHERE user_id = v_user FOR UPDATE;

  INSERT INTO public.stripe_webhook_events(event_id, event_type, event_created, user_id)
    VALUES(v_event_id, v_event_type, v_event_created, v_user)
    ON CONFLICT(event_id) DO NOTHING;
  IF NOT FOUND THEN RETURN 'duplicate'; END IF;

  IF v_event_type = 'invoice.payment_failed' THEN
    IF v_existing.stripe_customer_id IS DISTINCT FROM v_customer THEN
      RAISE EXCEPTION 'Invoice customer ownership mismatch';
    END IF;
    v_event_name := 'payment_failed';
  ELSE
    IF v_sub IS NULL OR v_sub = '' OR v_sub_created IS NULL OR v_sub_created <= 0
       OR v_plan IS NULL OR v_plan NOT IN ('free', 'individual', 'professional', 'agency')
       OR v_status IS NULL OR v_status NOT IN ('active', 'trialing', 'past_due', 'unpaid',
         'incomplete', 'incomplete_expired', 'canceled', 'paused')
       OR (v_status IN ('active', 'trialing')) <> (v_plan <> 'free') THEN
      RAISE EXCEPTION 'Invalid subscription state';
    END IF;

    SELECT * INTO v_state FROM public.stripe_billing_state WHERE user_id = v_user;
    IF FOUND THEN
      IF v_sub = v_state.subscription_id THEN
        v_stale := v_event_created < v_state.event_created
          OR (v_state.subscription_status IN ('canceled', 'incomplete_expired')
              AND v_status NOT IN ('canceled', 'incomplete_expired'));
      ELSIF v_sub_created = v_state.subscription_created THEN
        RAISE EXCEPTION 'Ambiguous subscription order; reconciliation required';
      ELSE
        v_stale := v_sub_created < v_state.subscription_created;
      END IF;
    ELSIF v_existing.stripe_subscription_id IS NOT NULL AND v_existing.stripe_subscription_id <> v_sub THEN
      RAISE EXCEPTION 'Existing subscription requires reconciliation';
    END IF;

    IF v_stale THEN
      UPDATE public.stripe_webhook_events SET result = 'stale' WHERE event_id = v_event_id;
      RETURN 'stale';
    END IF;
    IF v_existing.stripe_customer_id IS NOT NULL AND v_existing.stripe_customer_id <> v_customer THEN
      RAISE EXCEPTION 'Customer ownership mismatch';
    END IF;

    UPDATE public.user_plans SET
      plan_type = v_plan,
      stripe_customer_id = v_customer,
      stripe_subscription_id = CASE WHEN v_status IN ('canceled', 'incomplete_expired') THEN NULL ELSE v_sub END
      WHERE user_id = v_user;
    -- Preserve usage and period: delivery retries never grant new credits.
    INSERT INTO public.stripe_billing_state VALUES(v_user, v_sub, v_sub_created, v_event_created, v_status)
      ON CONFLICT(user_id) DO UPDATE SET subscription_id = EXCLUDED.subscription_id,
        subscription_created = EXCLUDED.subscription_created, event_created = EXCLUDED.event_created,
        subscription_status = EXCLUDED.subscription_status;
    v_event_name := CASE
      WHEN v_status IN ('canceled', 'incomplete_expired') THEN 'subscription_cancelled'
      WHEN v_event_type IN ('checkout.session.completed', 'customer.subscription.created') THEN 'subscription_created'
      ELSE 'subscription_updated' END;
  END IF;

  INSERT INTO public.usage_events(user_id, event_name, event_type, metadata)
    VALUES(v_user, v_event_name, 'billing', coalesce(p_event->'metadata', '{}'::jsonb)
      || jsonb_build_object('stripeEventId', v_event_id, 'source', 'stripe_webhook'));
  RETURN 'processed';
END;
$$;

REVOKE ALL ON FUNCTION public.apply_stripe_billing_event(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_billing_event(jsonb) TO service_role;

COMMIT;
