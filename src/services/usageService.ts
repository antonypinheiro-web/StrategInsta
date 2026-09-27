import { supabase } from '@/integrations/supabase/client';

export async function trackUsageEvent(
  eventName: string,
  eventType = 'product',
  metadata: Record<string, unknown> = {},
  explicitUserId?: string
) {
  let userId = explicitUserId;

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) return;

  await supabase.from('usage_events').insert({
    user_id: userId,
    event_name: eventName,
    event_type: eventType,
    metadata,
  });
}
