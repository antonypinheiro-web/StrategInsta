export type AdminPlanType = 'free' | 'individual' | 'professional' | 'agency';
export type AdminRange = '7d' | '30d' | '90d';
export interface AdminAiWallet { balance: number; reserved: number; available: number; }
export interface AdminCreditGrant { userId: string; amount: number; reason?: string; expiresAt?: string | null; }
export interface AdminCreditReset { userId: string; }

export interface AdminUserRow {
  id: string;
  email?: string;
  createdAt?: string;
  lastSignInAt?: string;
  bannedUntil?: string;
  planType: AdminPlanType;
  strategiesUsed: number;
  periodStart: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  adminNotes: string;
  extraCredits: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  aiWallet?: AdminAiWallet | null;
}

export interface AdminMetrics {
  totalUsers: number;
  newUsers: number;
  totalStrategies: number;
  strategiesInRange: number;
  creditsUsed: number;
  extraCreditsGranted: number;
  extraCreditsUsed: number | null;
  freeToPaidRate: number;
  estimatedMrr: number | null;
  estimatedAiCost: number | null;
  estimatedAiCostUsd?: number | null;
  aiCostMeasuredOperations?: number;
  aiCostUnpricedOperations?: number;
  mostUsedPlan: string;
  blockedByLimit: number;
}

export interface UsageEventRow {
  id: string;
  user_id: string | null;
  event_name: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminAuditLogRow {
  id: string;
  admin_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminStrategyRow {
  id: string;
  user_id: string;
  name: string;
  user_input: Record<string, unknown> | null;
  generated_strategy: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  planType: AdminPlanType;
}

export interface AdminOverview {
  metrics: AdminMetrics;
  planCounts: Record<string, number>;
  eventCounts: Record<string, number>;
  recentEvents: UsageEventRow[];
  recentStrategies: AdminStrategyRow[];
}
