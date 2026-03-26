// StrategInsta — Hook de Plano e Créditos
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PlanType, UserPlan } from '@/types/plans';
import { PLANS, getPlanLimit } from '@/types/plans';

interface UsePlanReturn {
  planType: PlanType;
  planConfig: typeof PLANS[PlanType];
  strategiesUsed: number;
  strategiesLimit: number;
  strategiesRemaining: number;
  canGenerate: boolean;
  isLoading: boolean;
  // Alerta: 'none' | 'half' | 'last' | 'blocked'
  alertLevel: 'none' | 'half' | 'last' | 'blocked';
  incrementUsage: () => Promise<void>;
  refreshPlan: () => Promise<void>;
}

export function usePlan(userId: string | undefined): UsePlanReturn {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Registro não existe — cria o plano free para o usuário
        const newPlan: Omit<UserPlan, 'updatedAt'> & { updated_at?: string } = {
          userId,
          planType: 'free',
          strategiesUsed: 0,
          periodStart: new Date().toISOString(),
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        };

        const { data: created } = await supabase
          .from('user_plans')
          .insert({
            user_id: userId,
            plan_type: 'free',
            strategies_used: 0,
            period_start: new Date().toISOString(),
            stripe_customer_id: null,
            stripe_subscription_id: null,
          })
          .select()
          .single();

        if (created) {
          setUserPlan(mapRow(created));
        } else {
          // Fallback local se o insert falhar (tabela pode não existir ainda)
          setUserPlan({
            userId,
            planType: 'free',
            strategiesUsed: getLocalUsage(userId),
            periodStart: null,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            updatedAt: new Date().toISOString(),
          });
        }
      } else if (data) {
        // Verifica se precisa resetar o contador mensal (planos pagos)
        const plan = mapRow(data);
        if (plan.planType !== 'free' && plan.periodStart) {
          const periodStart = new Date(plan.periodStart);
          const now = new Date();
          const monthsElapsed =
            (now.getFullYear() - periodStart.getFullYear()) * 12 +
            (now.getMonth() - periodStart.getMonth());

          if (monthsElapsed >= 1) {
            // Resetar contador mensal
            await supabase
              .from('user_plans')
              .update({ strategies_used: 0, period_start: now.toISOString() })
              .eq('user_id', userId);
            plan.strategiesUsed = 0;
            plan.periodStart = now.toISOString();
          }
        }
        setUserPlan(plan);
      }
    } catch {
      // Fallback: usa localStorage se Supabase indisponível
      setUserPlan({
        userId,
        planType: 'free',
        strategiesUsed: getLocalUsage(userId),
        periodStart: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const incrementUsage = useCallback(async () => {
    if (!userId || !userPlan) return;

    const newCount = userPlan.strategiesUsed + 1;

    // Atualiza otimisticamente
    setUserPlan(prev => prev ? { ...prev, strategiesUsed: newCount } : prev);

    // Persiste no Supabase
    try {
      await supabase
        .from('user_plans')
        .update({ strategies_used: newCount })
        .eq('user_id', userId);
    } catch {
      // Fallback: persiste em localStorage
      saveLocalUsage(userId, newCount);
    }

    // Sempre mantém localStorage sincronizado como backup
    saveLocalUsage(userId, newCount);
  }, [userId, userPlan]);

  // ─── Derivações ─────────────────────────────────────────────────────────────

  const planType: PlanType = userPlan?.planType ?? 'free';
  const planConfig = PLANS[planType];
  const limit = getPlanLimit(planType);
  const used = userPlan?.strategiesUsed ?? 0;
  const remaining = Math.max(0, limit - used);
  const canGenerate = remaining > 0;

  let alertLevel: 'none' | 'half' | 'last' | 'blocked' = 'none';
  if (!canGenerate) {
    alertLevel = 'blocked';
  } else if (remaining === 1) {
    alertLevel = 'last';
  } else if (remaining <= Math.floor(limit / 2)) {
    alertLevel = 'half';
  }

  return {
    planType,
    planConfig,
    strategiesUsed: used,
    strategiesLimit: limit,
    strategiesRemaining: remaining,
    canGenerate,
    isLoading,
    alertLevel,
    incrementUsage,
    refreshPlan: fetchPlan,
  };
}

// ─── Helpers localStorage (fallback) ─────────────────────────────────────────

function getLocalKey(userId: string) {
  return `si_usage_${userId}`;
}

function getLocalUsage(userId: string): number {
  try {
    return parseInt(localStorage.getItem(getLocalKey(userId)) ?? '0', 10);
  } catch {
    return 0;
  }
}

function saveLocalUsage(userId: string, count: number) {
  try {
    localStorage.setItem(getLocalKey(userId), String(count));
  } catch {
    // ignore
  }
}

// ─── Mapper Supabase row → UserPlan ──────────────────────────────────────────

function mapRow(row: Record<string, unknown>): UserPlan {
  return {
    userId: row.user_id as string,
    planType: (row.plan_type as PlanType) ?? 'free',
    strategiesUsed: (row.strategies_used as number) ?? 0,
    periodStart: (row.period_start as string) ?? null,
    stripeCustomerId: (row.stripe_customer_id as string) ?? null,
    stripeSubscriptionId: (row.stripe_subscription_id as string) ?? null,
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}
