import { supabase } from '@/integrations/supabase/client';

export type BillingInterval = 'month' | 'year';

export async function createCheckoutSession(
  planType: 'individual' | 'professional' | 'agency',
  interval: BillingInterval
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Usuário não autenticado');

  await supabase.from('usage_events').insert({
    user_id: session.user.id,
    event_name: 'checkout_started',
    event_type: 'billing',
    metadata: { planType, interval },
  });

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      planType,
      interval,
      successUrl: `${window.location.origin}/app?checkout=success`,
      cancelUrl: `${window.location.origin}/app?checkout=cancelled`,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error('URL de checkout não retornada');

  window.location.href = data.url;
}