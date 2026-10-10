-- Compatibility bridge, NOT server-authoritative credit metering.
-- Requires admin_console and a coordinated frontend update using named columns.
BEGIN;

ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
REVOKE ALL ON public.strategies FROM PUBLIC, anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.strategies FROM authenticated;

REVOKE ALL ON public.user_plans FROM PUBLIC, anon, authenticated;
GRANT SELECT(user_id, plan_type, strategies_used, period_start, stripe_customer_id,
  stripe_subscription_id, updated_at, is_blocked) ON public.user_plans TO authenticated;
GRANT INSERT(user_id) ON public.user_plans TO authenticated;
-- Temporary legacy writes. Remove with atomic generation metering in SEC-002.
GRANT UPDATE(strategies_used, period_start) ON public.user_plans TO authenticated;

REVOKE ALL ON public.admin_users, public.admin_audit_logs, public.credit_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT(user_id, email, role, active) ON public.admin_users TO authenticated;
GRANT SELECT(user_id, amount, used_amount, expires_at) ON public.credit_grants TO authenticated;
REVOKE ALL ON public.usage_events FROM PUBLIC, anon, authenticated;
GRANT INSERT(user_id, event_name, event_type, metadata) ON public.usage_events TO authenticated;
GRANT ALL ON public.user_plans, public.admin_users, public.admin_audit_logs,
  public.credit_grants, public.usage_events TO service_role;

-- Restrictive policy composes with the existing ownership policy.
CREATE POLICY "Client events cannot impersonate billing or server generation"
  ON public.usage_events AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND event_name IN ('login', 'onboarding_started', 'onboarding_completed',
      'strategy_saved', 'paywall_viewed', 'checkout_started')
    AND event_type IN ('auth', 'product', 'onboarding', 'generation', 'billing')
    AND NOT (coalesce(metadata, '{}'::jsonb) ? 'stripeEventId')
    AND NOT (coalesce(metadata, '{}'::jsonb) ? 'source')
  );

COMMIT;
