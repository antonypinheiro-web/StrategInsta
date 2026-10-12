// Credit packs approved by Antony on 2026-10-12 (council report auditoria/precificacao).
// Keep in sync with src/lib/credit-packs.ts; tests/credit-packs.test.mjs checks both.
export const CREDIT_PACKS = {
  pack_50: { credits: 50, amountCents: 2900, name: 'ThinkPost: 50 créditos' },
  pack_150: { credits: 150, amountCents: 6900, name: 'ThinkPost: 150 créditos' },
} as const;
export type CreditPackId = keyof typeof CREDIT_PACKS;

export function creditPack(id: unknown): { id: CreditPackId; credits: number; amountCents: number; name: string } {
  if (typeof id !== 'string' || !(id in CREDIT_PACKS)) throw new Error('Pacote inválido');
  return { id: id as CreditPackId, ...CREDIT_PACKS[id as CreditPackId] };
}

export interface PackGrant { user_id: string; credits: number; reference: string; metadata: Record<string, unknown>; }

interface CheckoutSessionLike {
  id: string; mode?: string | null; payment_status?: string | null; currency?: string | null;
  amount_total?: number | null; metadata?: Record<string, string> | null; client_reference_id?: string | null;
}

const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/** Returns the credits to add for a paid credit-pack checkout, null for any other event. Throws on tampered data. */
export function buildPackGrant(event: { id: string; type: string; data: { object: unknown } }): PackGrant | null {
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') return null;
  const session = event.data.object as CheckoutSessionLike;
  if (session.mode !== 'payment' || session.metadata?.kind !== 'credit_pack') return null;
  // Pix and boleto confirm later through async_payment_succeeded; credit only when paid.
  if (session.payment_status !== 'paid') return null;
  const pack = creditPack(session.metadata.pack);
  const userId = session.metadata.supabase_user_id;
  if (!userId || !UUID.test(userId) || (session.client_reference_id && session.client_reference_id !== userId)) {
    throw new Error('Identidade da compra nao confere');
  }
  if (session.currency !== 'brl' || session.amount_total !== pack.amountCents) throw new Error('Valor da compra nao confere');
  return {
    user_id: userId, credits: pack.credits, reference: `stripe-checkout:${session.id}`,
    metadata: { pack: pack.id, amountCents: pack.amountCents, currency: 'brl', eventId: event.id },
  };
}
