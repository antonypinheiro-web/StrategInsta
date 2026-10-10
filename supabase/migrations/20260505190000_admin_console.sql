-- StrategInsta 2.0 Admin Console MVP
-- Idempotent migration for production Supabase projects.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS blocked_reason text;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email       text NOT NULL,
  role        text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  active      boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_users_user_id_idx ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS admin_users_email_idx ON public.admin_users(lower(email));

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_users'
      AND policyname = 'Admins can view own admin membership'
  ) THEN
    CREATE POLICY "Admins can view own admin membership"
      ON public.admin_users FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action         text NOT NULL,
  target_type    text,
  target_id      text,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata       jsonb DEFAULT '{}'::jsonb,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_user_id_idx ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_target_user_id_idx ON public.admin_audit_logs(target_user_id);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.usage_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name  text NOT NULL,
  event_type  text NOT NULL DEFAULT 'product',
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON public.usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS usage_events_user_id_idx ON public.usage_events(user_id);
CREATE INDEX IF NOT EXISTS usage_events_event_name_idx ON public.usage_events(event_name);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'usage_events'
      AND policyname = 'Users can insert own usage events'
  ) THEN
    CREATE POLICY "Users can insert own usage events"
      ON public.usage_events FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.credit_grants (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount      integer NOT NULL CHECK (amount > 0),
  used_amount integer NOT NULL DEFAULT 0 CHECK (used_amount >= 0),
  reason      text,
  expires_at  timestamptz,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_grants_user_id_idx ON public.credit_grants(user_id);
CREATE INDEX IF NOT EXISTS credit_grants_created_at_idx ON public.credit_grants(created_at DESC);

ALTER TABLE public.credit_grants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'credit_grants'
      AND policyname = 'Users can view own credit grants'
  ) THEN
    CREATE POLICY "Users can view own credit grants"
      ON public.credit_grants FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
