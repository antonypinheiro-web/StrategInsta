// StrategInsta — Hook de Plano e Créditos
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PlanType, UserPlan } from '@/types/plans';
import { PLANS, getPlanLimit } from '@/types/plans';
import { incrementLegacyPlanUsage } from '@/lib/legacy-plan-usage';

const PLAN_COLUMNS = 'user_id,plan_type,strategies_used,period_start,stripe_customer_id,stripe_subscription_id,updated_at,is_blocked';

interface UsePlanReturn {
  planType: PlanType;
  planConfig: typeof PLANS[PlanType];
  strategiesUsed: number;
  strategiesLimit: number;
  strategiesRemaining: number;
  extraCredits: number;
  canGenerate: boolean;
  isLoading: boolean;
  error: string | null;
  alertLevel: 'none' | 'half' | 'last' | 'blocked';
  incrementUsage: () => Promise<void>;
  refreshPlan: () => Promise<void>;
}

export function usePlan(userId: string | undefined): UsePlanReturn {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [extraCredits, setExtraCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!userId) {
      setUserPlan(null);
      setExtraCredits(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadFailed(false);
    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select(PLAN_COLUMNS)
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const { error: createError } = await supabase
          .from('user_plans')
          .insert({
            user_id: userId,
          });
        if (createError) throw createError;
        const { data: created, error: readError } = await supabase
          .from('user_plans')
          .select(PLAN_COLUMNS)
          .eq('user_id', userId)
          .single();

        if (readError || !created) throw readError ?? new Error('Plano indisponivel');
        setUserPlan(mapRow(created));
        setIsBlocked(Boolean(created.is_blocked));
      } else if (data) {
        setIsBlocked(Boolean(data.is_blocked));
        const plan = mapRow(data);
        if (plan.planType !== 'free' && plan.periodStart) {
          const periodStart = new Date(plan.periodStart);
          const now = new Date();
          const monthsElapsed =
            (now.getFullYear() - periodStart.getFullYear()) * 12 +
            (now.getMonth() - periodStart.getMonth());

          if (monthsElapsed >= 1) {
            const { error: resetError } = await supabase
              .from('user_plans')
              .update({ strategies_used: 0, period_start: now.toISOString() })
              .eq('user_id', userId);
            if (resetError) throw resetError;
            plan.strategiesUsed = 0;
            plan.periodStart = now.toISOString();
          }
        }
        setUserPlan(plan);
      } else {
        throw error ?? new Error('Plano indisponivel');
      }

      const { data: grants, error: grantsError } = await supabase
        .from('credit_grants')
        .select('amount, used_amount, expires_at')
        .eq('user_id', userId);
      if (grantsError) throw grantsError;

      const now = Date.now();
      const remainingCredits = (grants ?? []).reduce((sum, grant) => {
        const expiresAt = grant.expires_at ? new Date(grant.expires_at as string).getTime() : null;
        if (expiresAt && expiresAt < now) return sum;
        return sum + Math.max(0, Number(grant.amount ?? 0) - Number(grant.used_amount ?? 0));
      }, 0);
      setExtraCredits(remainingCredits);
    } catch {
      setLoadFailed(true);
      setExtraCredits(0);
      setUserPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const incrementUsage = useCallback(async () => {
    if (!userId || !userPlan || userPlan.userId !== userId) throw new Error('Plano indisponivel');

    const newCount = await incrementLegacyPlanUsage(supabase, userId, userPlan.strategiesUsed);
    setUserPlan(prev => prev ? { ...prev, strategiesUsed: newCount } : prev);
  }, [userId, userPlan]);

  const planType: PlanType = userPlan?.planType ?? 'free';
  const planConfig = PLANS[planType];
  const baseLimit = getPlanLimit(planType);
  const limit = baseLimit + extraCredits;
  const used = userPlan?.strategiesUsed ?? 0;
  const remaining = Math.max(0, limit - used);
  const canGenerate = !isLoading && !loadFailed && !isBlocked && userPlan?.userId === userId && remaining > 0;

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
    extraCredits,
    canGenerate,
    isLoading,
    error: loadFailed ? 'Não foi possível consultar seu plano. Atualize a página ou contate o suporte.'
      : isBlocked ? 'Sua conta está bloqueada. Contate o suporte.' : null,
    alertLevel,
    incrementUsage,
    refreshPlan: fetchPlan,
  };
}

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
