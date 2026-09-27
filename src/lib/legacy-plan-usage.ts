import type { SupabaseClient } from '@supabase/supabase-js';

// Temporary compatibility bridge until SEC-002 moves metering to the server.
// return=representation makes PostgREST include the primary key, which this
// restricted client cannot SELECT. Exact affected-row count preserves the CAS.
export async function incrementLegacyPlanUsage(
  client: SupabaseClient,
  userId: string,
  expectedUsage: number,
): Promise<number> {
  const nextUsage = expectedUsage + 1;
  const { error, count } = await client.from('user_plans')
    .update({ strategies_used: nextUsage }, { count: 'exact' })
    .eq('user_id', userId)
    .eq('strategies_used', expectedUsage);
  if (error) throw error;
  if (count !== 1) throw new Error('Uso alterado em outra sessão. Atualize o plano antes de tentar novamente.');
  return nextUsage;
}
