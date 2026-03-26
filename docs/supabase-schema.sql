-- StrategInsta — Schema Supabase
-- Execute este SQL no painel do Supabase: SQL Editor → New Query → Run

-- ─── Tabela de planos dos usuários ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_plans (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type       text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'individual', 'professional', 'agency')),
  strategies_used integer NOT NULL DEFAULT 0,
  period_start    timestamptz DEFAULT now(),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS user_plans_user_id_idx ON public.user_plans(user_id);

-- RLS: Cada usuário só acessa seu próprio plano
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan"
  ON public.user_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plan"
  ON public.user_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plan"
  ON public.user_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─── Tabela de estratégias (já deve existir, mas garante a estrutura) ────────

CREATE TABLE IF NOT EXISTS public.strategies (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name             text NOT NULL DEFAULT 'Minha Estratégia',
  user_input       jsonb,
  generated_strategy jsonb,
  history          jsonb,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS strategies_user_id_idx ON public.strategies(user_id);

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own strategies"
  ON public.strategies FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
