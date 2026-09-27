import { supabase } from '@/integrations/supabase/client';
import type { AdminOverview, AdminRange, AdminAiWallet, AdminCreditGrant, AdminCreditReset } from '@/types/admin';

export async function invokeAdmin<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action, payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    let code = 'SERVICE_UNAVAILABLE';
    if ('context' in error && error.context instanceof Response) {
      try { const body = await error.context.json(); if (typeof body.code === 'string') code = body.code; } catch { /* Safe category only. */ }
    }
    throw new Error(`Não foi possível concluir a ação (${code}).`);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const adminService = {
  me: () => invokeAdmin<{ admin: { user_id: string; email: string; role: string; active: boolean } }>('me'),
  overview: (range: AdminRange) => invokeAdmin<AdminOverview>('overview', { range }),
  listUsers: (payload: { search?: string; page?: number; perPage?: number }) =>
    invokeAdmin<{ users: import('@/types/admin').AdminUserRow[]; page: number; perPage: number; totalApprox?: number }>('listUsers', payload),
  createUser: (payload: { email: string; password: string; planType: string }) =>
    invokeAdmin<{ user: { id: string; email?: string } }>('createUser', payload),
  setUserBlocked: (payload: { userId: string; blocked: boolean; reason?: string }) =>
    invokeAdmin<{ ok: true }>('setUserBlocked', payload),
  setPlan: (payload: { userId: string; planType: string }) =>
    invokeAdmin<{ ok: true }>('setPlan', payload),
  grantCredits: (payload: AdminCreditGrant, idempotencyKey: string = crypto.randomUUID()) =>
    invokeAdmin<{ wallet: AdminAiWallet }>('grantCredits', { ...payload, idempotencyKey }),
  resetUsage: (payload: AdminCreditReset, idempotencyKey: string = crypto.randomUUID()) =>
    invokeAdmin<{ ok: true; wallet: AdminAiWallet }>('resetUsage', { ...payload, idempotencyKey }),
  updateAdminNotes: (payload: { userId: string; notes: string }) =>
    invokeAdmin<{ ok: true }>('updateAdminNotes', payload),
  listStrategies: (payload: { search?: string; range?: AdminRange; planType?: string; status?: string }) =>
    invokeAdmin<{ strategies: import('@/types/admin').AdminStrategyRow[] }>('listStrategies', payload),
  archiveStrategy: (payload: { strategyId: string; archived: boolean }) =>
    invokeAdmin<{ ok: true }>('archiveStrategy', payload),
  listEvents: (payload: { range?: AdminRange; eventName?: string }) =>
    invokeAdmin<{ events: import('@/types/admin').UsageEventRow[] }>('listEvents', payload),
  listAuditLogs: () => invokeAdmin<{ logs: import('@/types/admin').AdminAuditLogRow[] }>('listAuditLogs'),
};
