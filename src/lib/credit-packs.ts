// Mirror of supabase/functions/_shared/credit-packs.ts; tests/credit-packs.test.mjs keeps both in sync.
export const CREDIT_PACKS = [
  { id: 'pack_50', credits: 50, priceCents: 2900 },
  { id: 'pack_150', credits: 150, priceCents: 6900 },
] as const;
export type CreditPack = typeof CREDIT_PACKS[number];
/** Pre-sale: purchases are handled by the team through Instagram Direct until Stripe checkout is enabled. */
export const PRESALE_CONTACT_URL = 'https://ig.me/m/thinkpost.app';

export function brl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
/** The app currency is the TP. Balances show volume only, never converted into deliveries or money. */
export function formatTps(value: number) {
  const safe = Math.max(0, Math.floor(value));
  return `${safe.toLocaleString('pt-BR')} ${safe === 1 ? 'TP' : 'TPs'}`;
}
