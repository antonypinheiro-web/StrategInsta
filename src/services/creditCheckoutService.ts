import { supabase } from '@/integrations/supabase/client';
import type { CreditPack } from '@/lib/credit-packs';

export type CreditCheckoutResult = { enabled: false } | { enabled: true; url: string };

/** Starts a Stripe Checkout for a credit pack. Returns enabled:false while the pre-sale is manual. */
export async function startCreditCheckout(pack: CreditPack['id'], idempotencyKey: string): Promise<CreditCheckoutResult> {
  const returnUrl = `${window.location.origin}/app`;
  const { data, error } = await supabase.functions.invoke('create-credit-checkout', {
    body: { pack, successUrl: returnUrl, cancelUrl: returnUrl, idempotencyKey },
  });
  if (error || !data || typeof data !== 'object') throw new Error('Não foi possível iniciar a compra. Tente novamente.');
  const result = data as { enabled?: boolean; url?: unknown; error?: string };
  if (result.error) throw new Error(result.error);
  if (result.enabled && typeof result.url === 'string' && result.url.startsWith('https://')) return { enabled: true, url: result.url };
  return { enabled: false };
}
