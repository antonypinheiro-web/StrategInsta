import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Mapa de price_id → plan_type (preenchido via env ou hardcoded como fallback)
function getPlanFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    [Deno.env.get('STRIPE_PRICE_INDIVIDUAL_MONTHLY') ?? '']: 'individual',
    [Deno.env.get('STRIPE_PRICE_INDIVIDUAL_YEARLY') ?? '']: 'individual',
    [Deno.env.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY') ?? '']: 'professional',
    [Deno.env.get('STRIPE_PRICE_PROFESSIONAL_YEARLY') ?? '']: 'professional',
    [Deno.env.get('STRIPE_PRICE_AGENCY_MONTHLY') ?? '']: 'agency',
    [Deno.env.get('STRIPE_PRICE_AGENCY_YEARLY') ?? '']: 'agency',
  };
  return map[priceId] ?? 'free';
}

async function verifyStripeSignature(body: string, signature: string): Promise<boolean> {
  // Verificação HMAC-SHA256 da assinatura do Stripe
  const parts = signature.split(',');
  const timestamp = parts.find((p) => p.startsWith('t='))?.split('=')[1];
  const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1];
  if (!timestamp || !v1) return false;

  const payload = `${timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === v1;
}

serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  const valid = await verifyStripeSignature(body, signature);
  if (!valid) {
    return new Response('Assinatura inválida', { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        // Buscar subscription para pegar o price_id
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });
        const sub = await subRes.json();
        const priceId = sub.items?.data?.[0]?.price?.id;
        const planType = getPlanFromPriceId(priceId);

        await supabase.from('user_plans').upsert({
          user_id: userId,
          plan_type: planType,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          strategies_used: 0,
          period_start: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        console.log(`✓ Plano ${planType} ativado para ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        const priceId = sub.items?.data?.[0]?.price?.id;
        const planType = getPlanFromPriceId(priceId);
        const isActive = sub.status === 'active' || sub.status === 'trialing';

        await supabase.from('user_plans').update({
          plan_type: isActive ? planType : 'free',
          stripe_subscription_id: sub.id,
        }).eq('user_id', userId);

        console.log(`✓ Subscription atualizada: ${planType} (${sub.status}) para ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        await supabase.from('user_plans').update({
          plan_type: 'free',
          stripe_subscription_id: null,
          strategies_used: 0,
        }).eq('user_id', userId);

        console.log(`✓ Assinatura cancelada — voltou para free: ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: plan } = await supabase
          .from('user_plans')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (plan) {
          console.log(`⚠️ Pagamento falhou para customer ${customerId} (user ${plan.user_id})`);
          // Não rebaixa imediatamente — o Stripe tentará novamente
        }
        break;
      }
    }
  } catch (err) {
    console.error('Erro ao processar webhook:', err);
    return new Response('Erro interno', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
