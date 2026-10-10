import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { stripeVerifier, createWebhookHandler, buildBillingEvent } from '../supabase/functions/_shared/billing.ts';
import { requireActiveAdmin, AccessDeniedError } from '../supabase/functions/_shared/admin-auth.ts';
import { validateCheckoutRedirect } from '../supabase/functions/_shared/checkout-policy.ts';

const userId = '00000000-0000-4000-8000-000000000001';
const signingSecret = 'whsec_local_fixture_not_a_real_secret';
const stripe = new Stripe('sk_test_local_fixture');
const verify = stripeVerifier('sk_test_local_fixture', signingSecret);
const event = {
  id: 'evt_fixture', type: 'customer.subscription.updated', created: 1000,
  data: { object: { id: 'sub_fixture' } },
};
const subscription = {
  id: 'sub_fixture', customer: 'cus_fixture', created: 900, status: 'active',
  metadata: { supabase_user_id: userId }, items: { data: [{ price: { id: 'price_fixture' } }] },
};
const dependencies = {
  retrieveSubscription: async () => subscription,
  findCustomerUser: async () => userId,
  planFromPrice: () => 'individual',
};
function signedRequest(payload = event, timestamp = Math.floor(Date.now() / 1000)) {
  const body = JSON.stringify(payload);
  const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret: signingSecret, timestamp });
  return new Request('https://local.invalid/webhook', { method: 'POST', body, headers: { 'stripe-signature': signature } });
}

test('Stripe SDK accepts current signature and rejects missing, modified and expired payloads', async () => {
  const req = signedRequest();
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  assert.equal((await verify(body, signature)).id, event.id);
  await assert.rejects(verify(body, ''));
  await assert.rejects(verify(`${body} `, signature));
  const old = signedRequest(event, Math.floor(Date.now() / 1000) - 301);
  await assert.rejects(verify(await old.text(), old.headers.get('stripe-signature')));
});

test('key rotation accepts any matching v1 signature', async () => {
  const req = signedRequest();
  const result = await verify(await req.text(), `v1=${'0'.repeat(64)},${req.headers.get('stripe-signature')}`);
  assert.equal(result.id, event.id);
});

test('handler never writes for invalid signatures or unsupported methods', async () => {
  let calls = 0;
  const handler = createWebhookHandler({ ...dependencies, verifyEvent: verify, applyEvent: async () => { calls++; } });
  assert.equal((await handler(new Request('https://local.invalid'))).status, 405);
  assert.equal((await handler(new Request('https://local.invalid', { method: 'POST', body: '{}' }))).status, 400);
  assert.equal(calls, 0);
});

test('database failure returns 500 and next delivery can succeed', async () => {
  let fail = true;
  const handler = createWebhookHandler({ ...dependencies, verifyEvent: verify, applyEvent: async () => {
    if (fail) throw new Error('database unavailable');
    return 'processed';
  } });
  assert.equal((await handler(signedRequest())).status, 500);
  fail = false;
  assert.equal((await handler(signedRequest())).status, 200);
});

test('outdated active event uses current cancelled Stripe state', async () => {
  const result = await buildBillingEvent(event, { ...dependencies,
    retrieveSubscription: async () => ({ ...subscription, status: 'canceled' }),
  });
  assert.equal(result.plan_type, 'free');
  assert.equal(result.subscription_status, 'canceled');
  assert.equal(result.strategies_used, undefined);
});

test('unknown active price and conflicting checkout identity fail closed', async () => {
  await assert.rejects(buildBillingEvent(event, { ...dependencies, planFromPrice: () => 'free' }));
  await assert.rejects(buildBillingEvent({ ...event, type: 'checkout.session.completed', data: { object: {
    mode: 'subscription', subscription: 'sub_fixture', customer: 'cus_fixture',
    metadata: { supabase_user_id: 'another-user' },
  } } }, dependencies));
});

test('only an active admin membership belonging to caller grants access', () => {
  const member = { user_id: userId, email: 'fixture@example.invalid', active: true, role: 'admin' };
  assert.equal(requireActiveAdmin(member, userId), member);
  for (const candidate of [null, { ...member, active: false }, { ...member, role: 'support' }, { ...member, user_id: 'other' }]) {
    assert.throws(() => requireActiveAdmin(candidate, userId), AccessDeniedError);
  }
});

test('checkout only redirects to approved origin and app route', () => {
  const allowed = ['https://strateginsta.vercel.app'];
  assert.equal(validateCheckoutRedirect(`${allowed[0]}/app?checkout=success`, allowed), `${allowed[0]}/app?checkout=success`);
  for (const url of ['https://evil.invalid/app', 'https://strateginsta.vercel.app.evil.invalid/app',
    'javascript:alert(1)', `${allowed[0]}/login`, 'https://evil@strateginsta.vercel.app/app', 'http://localhost:8080/app']) {
    assert.throws(() => validateCheckoutRedirect(url, allowed));
  }
  assert.equal(validateCheckoutRedirect('http://localhost:8080/app', ['http://localhost:8080']), 'http://localhost:8080/app');
});
