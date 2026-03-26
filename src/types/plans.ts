// StrategInsta — Tipos de Planos e Assinaturas

export type PlanType = 'free' | 'individual' | 'professional' | 'agency';

export interface PlanConfig {
  id: PlanType;
  name: string;
  description: string;
  price: number;        // R$/mês
  yearlyPrice: number;  // R$/ano
  strategiesPerMonth: number; // -1 = ilimitado
  refinementsPerStrategy: number; // -1 = ilimitado
  profileSlots: number;          // -1 = ilimitado
  historyDays: number;           // -1 = ilimitado
  apiAccess: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  premiumModel: boolean;
  badge?: string;
}

export interface UserPlan {
  userId: string;
  planType: PlanType;
  strategiesUsed: number;      // total (free) ou no mês atual (pago)
  periodStart: string | null;  // início do período de cobrança (ISO string)
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  updatedAt: string;
}

// ─── Configuração dos planos ─────────────────────────────────────────────────

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Grátis',
    description: 'Experimente o StrategInsta sem compromisso',
    price: 0,
    yearlyPrice: 0,
    strategiesPerMonth: 2, // total vitalício para free
    refinementsPerStrategy: 1,
    profileSlots: 1,
    historyDays: 30,
    apiAccess: false,
    whiteLabel: false,
    prioritySupport: false,
    premiumModel: false,
  },
  individual: {
    id: 'individual',
    name: 'Individual',
    description: 'Para criadores e empreendedores solos',
    price: 47,
    yearlyPrice: 397,
    strategiesPerMonth: 15,
    refinementsPerStrategy: 5,
    profileSlots: 1,
    historyDays: 180,
    apiAccess: false,
    whiteLabel: false,
    prioritySupport: false,
    premiumModel: false,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Para social media managers e consultores',
    price: 97,
    yearlyPrice: 797,
    strategiesPerMonth: 60,
    refinementsPerStrategy: -1,
    profileSlots: 10,
    historyDays: 365,
    apiAccess: true,
    whiteLabel: true,
    prioritySupport: true,
    premiumModel: false,
    badge: 'Mais popular',
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    description: 'Para agências de marketing digital',
    price: 247,
    yearlyPrice: 1997,
    strategiesPerMonth: 250,
    refinementsPerStrategy: -1,
    profileSlots: -1,
    historyDays: -1,
    apiAccess: true,
    whiteLabel: true,
    prioritySupport: true,
    premiumModel: true,
  },
};

export const PLAN_ORDER: PlanType[] = ['free', 'individual', 'professional', 'agency'];

export function getPlanLimit(plan: PlanType): number {
  return PLANS[plan].strategiesPerMonth;
}

export function isUnlimited(plan: PlanType): boolean {
  return PLANS[plan].strategiesPerMonth === -1;
}
