// Mirror of supabase/functions/_shared/credit-packs.ts; tests/credit-packs.test.mjs keeps both in sync.
export const STRATEGY_CREDITS = 20;
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
export function strategyPriceCents(pack: CreditPack) {
  return Math.round(pack.priceCents / pack.credits * STRATEGY_CREDITS);
}
/** Shows credits as deliveries, e.g. "2 estratégias completas e 10 créditos para ajustes". */
export function creditsInDeliveries(credits: number) {
  const safe = Math.max(0, Math.floor(credits));
  const strategies = Math.floor(safe / STRATEGY_CREDITS);
  const rest = safe - strategies * STRATEGY_CREDITS;
  const parts: string[] = [];
  if (strategies) parts.push(`${strategies} ${strategies === 1 ? 'estratégia completa' : 'estratégias completas'}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? 'crédito' : 'créditos'} para ajustes`);
  return parts.length ? parts.join(' e ') : 'nenhum crédito disponível';
}
