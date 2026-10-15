-- Feedback and bug reports sent from the account menu. Users insert and read only their own rows;
-- active admins read all of them in the admin panel.
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND active) $$;
REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  kind text NOT NULL CHECK (kind IN ('bug', 'idea', 'other')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 5 AND 4000),
  page text CHECK (page IS NULL OR char_length(page) <= 200),
  app_version text CHECK (app_version IS NULL OR char_length(app_version) <= 40),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_feedback_created ON public.user_feedback (created_at DESC);
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_feedback_insert_own ON public.user_feedback FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY user_feedback_select_own_or_admin ON public.user_feedback FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_active_admin());
GRANT SELECT, INSERT ON public.user_feedback TO authenticated;
