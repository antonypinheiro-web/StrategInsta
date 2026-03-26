import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    const priceId = PRICE_IDS[planType]?.[interval];
    if (!priceId) throw new Error(`Preço não encontrado: ${planType}/${interval}`);

    // Verificar se já tem customer_id no Stripe
    const { data: userPlan } = await supabase
      .from('user_plans')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    // Criar ou reutilizar customer no Stripe
    let customerId = userPlan?.stripe_customer_id;
    if (!customerId) {
      const customerRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user.email!,
          'metadata[supabase_user_id]': user.id,
        }),
      });
      const customer = await customerRes.json();
      if (customer.error) throw new Error(customer.error.message);
      customerId = customer.id;

      // Salvar customer_id
      await supabase.from('user_plans').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan_type: 'free',
      });
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
        success_url: successUrl,
        cancel_url: cancelUrl,
        'metadata[supabase_user_id]': user.id,
        'metadata[plan_type]': planType,
        'subscription_data[metadata][supabase_user_id]': user.id,
        'subscription_data[metadata][plan_type]': planType,
      }),
    });
    const session = await sessionRes.json();
    if (session.error) throw new Error(session.error.message);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
