import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'stripe';
import { createWebhookHandler, stripeVerifier } from '../_shared/billing.ts';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const stripe = new Stripe(stripeKey, { maxNetworkRetries: 2, timeout: 20000 });
const prices = new Map<string, string>();
for (const plan of ['individual', 'professional', 'agency']) {
  for (const interval of ['MONTHLY', 'YEARLY']) {
    const price = Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}_${interval}`);
    if (price) prices.set(price, plan);
  }
}

serve(createWebhookHandler({
  verifyEvent: stripeVerifier(stripeKey, webhookSecret),
  retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
  planFromPrice: (priceId) => {
    const plan = prices.get(priceId);
    if (!plan) throw new Error('Preco Stripe nao configurado');
    return plan;
  },
  findCustomerUser: async (customerId) => {
    const { data, error } = await supabase.from('user_plans').select('user_id')
      .eq('stripe_customer_id', customerId).maybeSingle();
    if (error) throw error;
    return data?.user_id ?? null;
  },
  applyEvent: async (event) => {
    const { data, error } = await supabase.rpc('apply_stripe_billing_event', { p_event: event });
    if (error) throw error;
    return data;
  },
  grantPack: async (grant) => {
    const { error } = await supabase.rpc('pilot_purchase_credits', {
      p_user: grant.user_id, p_amount: grant.credits, p_reference: grant.reference, p_metadata: grant.metadata,
    });
    if (error) throw error;
    return 'credits_granted';
  },
  onError: (error) => console.error('[stripe-webhook] Processing failed:',
    error instanceof Error ? error.message : 'Database operation failed'),
}));
