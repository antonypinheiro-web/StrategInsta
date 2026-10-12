import test from 'node:test';
import assert from 'node:assert/strict';
import { CREDIT_PACKS as SERVER_PACKS, buildPackGrant } from '../supabase/functions/_shared/credit-packs.ts';
import { createWebhookHandler } from '../supabase/functions/_shared/billing.ts';
import { CREDIT_PACKS, brl, creditsInDeliveries, strategyPriceCents } from '../src/lib/credit-packs.ts';

const userId = '00000000-0000-4000-8000-000000000001';
const session = (over = {}) => ({ id: 'cs_test_fixture_123456', mode: 'payment', payment_status: 'paid', currency: 'brl', amount_total: 2900,
  client_reference_id: userId, metadata: { kind: 'credit_pack', pack: 'pack_50', credits: '50', supabase_user_id: userId }, ...over });
const event = (object, type = 'checkout.session.completed') => ({ id: 'evt_fixture', type, created: 1000, data: { object } });

test('screen and server sell the same packs at the approved prices', () => {
  assert.deepEqual(CREDIT_PACKS.map(p => [p.id, p.credits, p.priceCents]), Object.entries(SERVER_PACKS).map(([id, p]) => [id, p.credits, p.amountCents]));
  assert.deepEqual(CREDIT_PACKS.map(p => [p.credits, p.priceCents]), [[50, 2900], [150, 6900]]);
  assert.deepEqual(CREDIT_PACKS.map(p => brl(strategyPriceCents(p)).replace(/\s/g, ' ')), ['R$ 11,60', 'R$ 9,20']);
});

test('balance is shown as deliveries', () => {
  assert.equal(creditsInDeliveries(30), '1 estratégia completa e 10 créditos para ajustes');
  assert.equal(creditsInDeliveries(150), '7 estratégias completas e 10 créditos para ajustes');
  assert.equal(creditsInDeliveries(40), '2 estratégias completas');
  assert.equal(creditsInDeliveries(1), '1 crédito para ajustes');
  assert.equal(creditsInDeliveries(0), 'nenhum crédito disponível');
});

test('a paid pack checkout credits the wallet once per Stripe session', () => {
  assert.deepEqual(buildPackGrant(event(session())), { user_id: userId, credits: 50, reference: 'stripe-checkout:cs_test_fixture_123456',
    metadata: { pack: 'pack_50', amountCents: 2900, currency: 'brl', eventId: 'evt_fixture' } });
  // Pix confirms later through async_payment_succeeded.
  assert.equal(buildPackGrant(event(session({ payment_status: 'unpaid' }))), null);
  assert.equal(buildPackGrant(event(session(), 'checkout.session.async_payment_succeeded')).credits, 50);
});

test('subscriptions and other events are left to the existing billing flow', () => {
  assert.equal(buildPackGrant(event(session({ mode: 'subscription' }))), null);
  assert.equal(buildPackGrant(event(session({ metadata: {} }))), null);
  assert.equal(buildPackGrant({ id: 'evt', type: 'customer.subscription.updated', data: { object: {} } }), null);
});

test('tampered amount, currency, pack or buyer is rejected', () => {
  assert.throws(() => buildPackGrant(event(session({ amount_total: 100 }))), /Valor/);
  assert.throws(() => buildPackGrant(event(session({ currency: 'usd' }))), /Valor/);
  assert.throws(() => buildPackGrant(event(session({ metadata: { ...session().metadata, pack: 'pack_9999' } }))), /Pacote/);
  assert.throws(() => buildPackGrant(event(session({ client_reference_id: '00000000-0000-4000-8000-000000000002' }))), /Identidade/);
});

test('webhook routes pack purchases to the credit grant and never to the subscription flow', async () => {
  const grants = []; let subscriptionCalls = 0;
  const handler = createWebhookHandler({
    verifyEvent: async () => event(session()),
    retrieveSubscription: async () => { subscriptionCalls++; throw new Error('should not run'); },
    findCustomerUser: async () => null, planFromPrice: () => 'free',
    applyEvent: async () => { subscriptionCalls++; },
    grantPack: async grant => { grants.push(grant); return 'credits_granted'; },
  });
  const response = await handler(new Request('https://local.invalid', { method: 'POST', body: '{}' }));
  assert.equal(response.status, 200);
  assert.equal(grants.length, 1);
  assert.equal(subscriptionCalls, 0);
});
