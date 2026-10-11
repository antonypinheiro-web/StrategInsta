import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateCheckoutRedirect } from '../_shared/checkout-policy.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED_ORIGINS = (Deno.env.get('APP_ALLOWED_ORIGINS') ?? 'https://strateginsta.vercel.app')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

const PRICE_IDS: Record<string, Record<string, string>> = {
  individual: {
    month: Deno.env.get('STRIPE_PRICE_INDIVIDUAL_MONTHLY')!,
    year:  Deno.env.get('STRIPE_PRICE_INDIVIDUAL_YEARLY')!,
  },
  professional: {
    month: Deno.env.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY')!,
    year:  Deno.env.get('STRIPE_PRICE_PROFESSIONAL_YEARLY')!,
  },
  agency: {
    month: Deno.env.get('STRIPE_PRICE_AGENCY_MONTHLY')!,
    year:  Deno.env.get('STRIPE_PRICE_AGENCY_YEARLY')!,
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return new Response('Metodo nao permitido', { status: 405, headers: corsHeaders });

  try {
    // Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Usuário inválido');

    const { planType, interval, successUrl, cancelUrl } = await req.json();
    const safeSuccessUrl = validateCheckoutRedirect(successUrl, ALLOWED_ORIGINS);
    const safeCancelUrl = validateCheckoutRedirect(cancelUrl, ALLOWED_ORIGINS);
    if (new URL(safeSuccessUrl).origin !== new URL(safeCancelUrl).origin) {
      throw new Error('Origens de retorno diferentes');
    }

    const priceId = PRICE_IDS[planType]?.[interval];
    if (!priceId) throw new Error(`Preço não encontrado: ${planType}/${interval}`);

    // Verificar se já tem customer_id no Stripe
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('stripe_customer_id, is_blocked')
      .eq('user_id', user.id)
      .maybeSingle();
    if (planError) throw planError;
    if (userPlan?.is_blocked) throw new Error('Conta bloqueada');

    // Criar ou reutilizar customer no Stripe
    let customerId = userPlan?.stripe_customer_id;
    if (!customerId) {
      const customerRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': `customer-${user.id}`,
        },
        body: new URLSearchParams({
          email: user.email!,
          'metadata[supabase_user_id]': user.id,
        }),
      });
      const customer = await customerRes.json();
      if (!customerRes.ok || customer.error || !customer.id) throw new Error('Falha ao criar cliente de pagamento');
      customerId = customer.id;

      // Salvar customer_id
      const { error: saveError } = await supabase.from('user_plans').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
      }, { onConflict: 'user_id' });
      if (saveError) throw saveError;
    }

    // Criar Checkout Session
    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url: safeSuccessUrl,
        cancel_url: safeCancelUrl,
        'metadata[supabase_user_id]': user.id,
        'metadata[plan_type]': planType,
        'subscription_data[metadata][supabase_user_id]': user.id,
        'subscription_data[metadata][plan_type]': planType,
      }),
    });
    const session = await sessionRes.json();
    if (!sessionRes.ok || session.error || !session.url) throw new Error('Falha ao criar checkout');

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[create-checkout-session]', err instanceof Error ? err.message : 'Operation failed');
    return new Response(JSON.stringify({ error: 'Nao foi possivel iniciar o pagamento. Tente novamente ou contate o suporte.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
