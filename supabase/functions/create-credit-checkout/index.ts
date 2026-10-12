import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'stripe';
import { validateCheckoutRedirect } from '../_shared/checkout-policy.ts';
import { creditPack } from '../_shared/credit-packs.ts';

// Automatic billing stays off (pre-sale mode) until CREDIT_CHECKOUT_ENABLED is set to "true".
const ENABLED = Deno.env.get('CREDIT_CHECKOUT_ENABLED') === 'true';
const ALLOWED_ORIGINS = (Deno.env.get('APP_ALLOWED_ORIGINS') ?? 'https://strateginsta.vercel.app')
  .split(',').map(origin => origin.trim()).filter(Boolean);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: corsHeaders });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: 'Faça login para comprar créditos.' }, 401);

    const body = await req.json();
    const pack = creditPack(body.pack);
    if (!ENABLED) return json({ enabled: false });

    const successUrl = validateCheckoutRedirect(body.successUrl, ALLOWED_ORIGINS);
    const cancelUrl = validateCheckoutRedirect(body.cancelUrl, ALLOWED_ORIGINS);
    if (new URL(successUrl).origin !== new URL(cancelUrl).origin) throw new Error('Origens de retorno diferentes');

    const { data: plan } = await supabase.from('user_plans').select('is_blocked').eq('user_id', user.id).maybeSingle();
    if (plan?.is_blocked) return json({ error: 'Conta bloqueada.' }, 403);

    const metadata = { kind: 'credit_pack', pack: pack.id, credits: String(pack.credits), supabase_user_id: user.id };
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { maxNetworkRetries: 2, timeout: 20000 });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'pt-BR',
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      line_items: [{ quantity: 1, price_data: { currency: 'brl', unit_amount: pack.amountCents, product_data: { name: pack.name } } }],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${successUrl}?compra=ok`,
      cancel_url: `${cancelUrl}?compra=cancelada`,
    }, { idempotencyKey: typeof body.idempotencyKey === 'string' && /^[0-9a-f-]{36}$/i.test(body.idempotencyKey) ? `credit-pack:${user.id}:${body.idempotencyKey}` : undefined });
    return json({ enabled: true, url: session.url });
  } catch (error) {
    console.error('[create-credit-checkout] failed:', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'Não foi possível iniciar a compra. Tente novamente.' }, 400);
  }
});
