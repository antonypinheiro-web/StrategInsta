import Stripe from 'stripe';
import { buildPackGrant } from './credit-packs.ts';
import type { PackGrant } from './credit-packs.ts';

export interface BillingEvent {
  event_id: string;
  event_type: string;
  event_created: number;
  user_id: string;
  customer_id: string;
  subscription_id?: string;
  subscription_created?: number;
  subscription_status?: string;
  plan_type?: string;
  metadata: Record<string, unknown>;
}

export interface BillingDependencies {
  verifyEvent: (body: string, signature: string) => Promise<Stripe.Event>;
  retrieveSubscription: (id: string) => Promise<Stripe.Subscription>;
  findCustomerUser: (customerId: string) => Promise<string | null>;
  planFromPrice: (priceId: string) => string;
  applyEvent: (event: BillingEvent) => Promise<unknown>;
  /** Credits a paid credit-pack checkout; idempotent by reference. */
  grantPack?: (grant: PackGrant) => Promise<unknown>;
  onError?: (error: unknown) => void;
}

export function stripeVerifier(secret: string, webhookSecret: string) {
  const stripe = new Stripe(secret, { maxNetworkRetries: 2, timeout: 20000 });
  const cryptoProvider = Stripe.createSubtleCryptoProvider();
  return (body: string, signature: string) =>
    stripe.webhooks.constructEventAsync(body, signature, webhookSecret, 300, cryptoProvider);
}

function objectId(value: string | { id: string } | null): string {
  const id = typeof value === 'string' ? value : value?.id;
  if (!id) throw new Error('Identificador Stripe ausente');
  return id;
}

export async function buildBillingEvent(
  event: Stripe.Event,
  deps: Pick<BillingDependencies, 'retrieveSubscription' | 'findCustomerUser' | 'planFromPrice'>,
): Promise<BillingEvent | null> {
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const customerId = objectId(invoice.customer);
    const userId = await deps.findCustomerUser(customerId);
    if (!userId) throw new Error('Cliente da fatura ainda nao reconciliado');
    return {
      event_id: event.id, event_type: event.type, event_created: event.created,
      user_id: userId, customer_id: customerId,
      metadata: { invoiceId: invoice.id, amountDue: invoice.amount_due, currency: invoice.currency },
    };
  }

  let subscriptionId: string;
  let checkoutUserId: string | undefined;
  let checkoutCustomerId: string | undefined;
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode !== 'subscription') return null;
    subscriptionId = objectId(session.subscription);
    checkoutUserId = session.metadata?.supabase_user_id;
    checkoutCustomerId = objectId(session.customer);
  } else if (event.type === 'customer.subscription.created' ||
             event.type === 'customer.subscription.updated' ||
             event.type === 'customer.subscription.deleted') {
    subscriptionId = event.data.object.id;
  } else {
    return null;
  }

  // Re-read Stripe instead of applying a potentially stale webhook snapshot.
  const sub = await deps.retrieveSubscription(subscriptionId);
  if (sub.id !== subscriptionId) throw new Error('Assinatura Stripe divergente');
  const userId = sub.metadata.supabase_user_id;
  const customerId = objectId(sub.customer);
  if (!userId || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(userId) ||
      (checkoutUserId && checkoutUserId !== userId) ||
      (checkoutCustomerId && checkoutCustomerId !== customerId)) {
    throw new Error('Identidade da assinatura nao confere');
  }
  const active = sub.status === 'active' || sub.status === 'trialing';
  if (active && sub.items.data.length !== 1) throw new Error('Itens de assinatura nao suportados');
  const priceId = sub.items.data[0]?.price.id;
  const planType = active ? deps.planFromPrice(priceId ?? '') : 'free';
  if (active && !['individual', 'professional', 'agency'].includes(planType)) {
    throw new Error('Preco Stripe sem plano configurado');
  }
  return {
    event_id: event.id, event_type: event.type, event_created: event.created,
    user_id: userId, customer_id: customerId, subscription_id: sub.id,
    subscription_created: sub.created, subscription_status: sub.status, plan_type: planType,
    metadata: { priceId, planType, status: sub.status, stripeSubscriptionId: sub.id },
  };
}

export function createWebhookHandler(deps: BillingDependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') return new Response('Metodo nao permitido', { status: 405 });
    let event: Stripe.Event;
    try {
      event = await deps.verifyEvent(await req.text(), req.headers.get('stripe-signature') ?? '');
    } catch {
      return new Response('Assinatura ou payload invalido', { status: 400 });
    }
    try {
      const grant = buildPackGrant(event as unknown as { id: string; type: string; data: { object: unknown } });
      if (grant) {
        if (!deps.grantPack) throw new Error('Compra de creditos sem processador configurado');
        return Response.json({ received: true, result: await deps.grantPack(grant) });
      }
      const change = await buildBillingEvent(event, deps);
      const result = change ? await deps.applyEvent(change) : 'ignored';
      return Response.json({ received: true, result });
    } catch (error) {
      deps.onError?.(error);
      return new Response('Falha temporaria ao processar pagamento', { status: 500 });
    }
  };
}
