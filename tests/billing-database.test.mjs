import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const userId = '00000000-0000-4000-8000-000000000001';
let db;
const event = {
  event_id: 'evt_fixture', event_type: 'checkout.session.completed', event_created: 1000,
  user_id: userId, customer_id: 'cus_fixture', subscription_id: 'sub_fixture',
  subscription_created: 900, subscription_status: 'active', plan_type: 'individual', metadata: {},
};
async function apply(change = {}) {
  const result = await db.query('select public.apply_stripe_billing_event($1::jsonb) as result', [JSON.stringify({ ...event, ...change })]);
  return result.rows[0].result;
}
async function row(sql) { return (await db.query(sql)).rows[0]; }

before(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
  `);
  // The existing documented baseline, not a hand-written fake of billing SQL.
  await db.exec(await readFile(new URL('../docs/supabase-schema.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/20260906002606_billing_event_safety.sql', import.meta.url), 'utf8'));
  await db.exec('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated');
  // Restore private billing grants after simulating Supabase defaults on legacy tables.
  await db.exec('REVOKE ALL ON public.stripe_billing_state, public.stripe_webhook_events FROM anon, authenticated');
  await db.exec(await readFile(new URL('../supabase/migrations/20260906003602_protect_plan_fields.sql', import.meta.url), 'utf8'));
  await db.query('INSERT INTO auth.users VALUES ($1)', [userId]);
});
after(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec('TRUNCATE public.stripe_webhook_events, public.stripe_billing_state, public.usage_events, public.user_plans');
  await db.query("INSERT INTO public.user_plans(user_id,strategies_used,period_start) VALUES($1,7,'2026-08-15Z')", [userId]);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
});

test('transaction applies plan and log once without resetting credits or period', async () => {
  assert.equal(await apply(), 'processed');
  assert.equal(await apply(), 'duplicate');
  const plan = await row('SELECT plan_type,strategies_used,period_start FROM public.user_plans');
  assert.equal(plan.plan_type, 'individual');
  assert.equal(plan.strategies_used, 7);
  assert.equal(new Date(plan.period_start).toISOString(), '2026-08-15T00:00:00.000Z');
  assert.equal((await row('SELECT count(*)::int AS n FROM public.usage_events')).n, 1);
});

test('parallel submissions of same event have a single effect', async () => {
  const results = await Promise.all(Array.from({ length: 6 }, () => apply()));
  assert.equal(results.filter((x) => x === 'processed').length, 1);
  assert.equal((await row('SELECT count(*)::int AS n FROM public.stripe_webhook_events')).n, 1);
});

test('out-of-order event cannot undo cancellation, even with same timestamp', async () => {
  await apply();
  await apply({ event_id: 'evt_cancel', event_type: 'customer.subscription.deleted', event_created: 1100,
    subscription_status: 'canceled', plan_type: 'free' });
  assert.equal(await apply({ event_id: 'evt_late', event_created: 1050 }), 'stale');
  assert.equal(await apply({ event_id: 'evt_equal', event_created: 1100 }), 'stale');
  assert.equal((await row('SELECT plan_type FROM public.user_plans')).plan_type, 'free');
});

test('old subscription cancellation cannot replace a newer subscription', async () => {
  await apply();
  await apply({ event_id: 'evt_new', subscription_id: 'sub_new', subscription_created: 1200, event_created: 1300 });
  assert.equal(await apply({ event_id: 'evt_old_cancel', event_type: 'customer.subscription.deleted',
    event_created: 1400, subscription_status: 'canceled', plan_type: 'free' }), 'stale');
  assert.equal((await row('SELECT stripe_subscription_id FROM public.user_plans')).stripe_subscription_id, 'sub_new');
});

test('audit failure rolls back plan and receipt; same event is retryable', async () => {
  await db.exec(`CREATE FUNCTION public.reject_billing_test() RETURNS trigger LANGUAGE plpgsql AS
    $$ BEGIN RAISE EXCEPTION 'simulated storage failure'; END $$;
    CREATE TRIGGER reject_billing_test BEFORE INSERT ON public.usage_events FOR EACH ROW EXECUTE FUNCTION public.reject_billing_test();`);
  try {
    await assert.rejects(apply(), /simulated storage failure/);
    assert.equal((await row('SELECT plan_type FROM public.user_plans')).plan_type, 'free');
    assert.equal((await row('SELECT count(*)::int AS n FROM public.stripe_webhook_events')).n, 0);
    assert.equal((await row('SELECT count(*)::int AS n FROM public.stripe_billing_state')).n, 0);
  } finally {
    await db.exec('DROP TRIGGER reject_billing_test ON public.usage_events; DROP FUNCTION public.reject_billing_test()');
  }
  assert.equal(await apply(), 'processed');
});

test('anonymous and authenticated roles cannot invoke billing RPC or read its private state', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`SET ROLE ${role}`);
    try {
      await assert.rejects(apply(), /permission denied/);
      await assert.rejects(db.query('SELECT * FROM public.stripe_billing_state'), /permission denied/);
      await assert.rejects(db.query('SELECT * FROM public.stripe_webhook_events'), /permission denied/);
    } finally { await db.exec('RESET ROLE'); }
  }
  await db.exec('SET ROLE service_role');
  try { assert.equal(await apply(), 'processed'); }
  finally { await db.exec('RESET ROLE'); }
});

test('payment failure is deduplicated without modifying plan', async () => {
  await apply();
  const failure = { event_id: 'evt_failed', event_type: 'invoice.payment_failed', event_created: 1100 };
  assert.equal(await apply(failure), 'processed');
  assert.equal(await apply(failure), 'duplicate');
  assert.equal((await row('SELECT plan_type FROM public.user_plans')).plan_type, 'individual');
});

test('unreconciled preexisting subscription fails rather than overwriting another contract', async () => {
  await db.exec("UPDATE public.user_plans SET stripe_subscription_id = 'sub_unknown'");
  await assert.rejects(apply(), /requires reconciliation/);
  assert.equal((await row('SELECT count(*)::int AS n FROM public.stripe_webhook_events')).n, 0);
});

test('ordinary user cannot elevate plan, change Stripe IDs, unblock self or read admin notes', async () => {
  await db.exec('SET ROLE authenticated');
  try {
    for (const sql of ["UPDATE public.user_plans SET plan_type='agency'", "UPDATE public.user_plans SET is_blocked=false",
      "UPDATE public.user_plans SET stripe_customer_id='cus_other'", 'SELECT admin_notes FROM public.user_plans',
      "UPDATE public.admin_users SET active=true", "INSERT INTO public.credit_grants(user_id,amount) VALUES ('00000000-0000-4000-8000-000000000001',999)"]) {
      await assert.rejects(db.exec(sql), /permission denied/);
    }
    assert.equal((await row('SELECT plan_type FROM public.user_plans')).plan_type, 'free');
    // Intentionally retained legacy bridge, NOT proof of secure credit metering.
    await db.exec('UPDATE public.user_plans SET strategies_used=8');
  } finally { await db.exec('RESET ROLE'); }
});

test('restricted credit update rejects primary-key returning but preserves exact CAS count', async () => {
  await db.exec('SET ROLE authenticated');
  try {
    await assert.rejects(db.query('UPDATE public.user_plans SET strategies_used=8 WHERE user_id=$1 AND strategies_used=7 RETURNING strategies_used,id', [userId]), /permission denied/);
    const sql = 'WITH changed AS (UPDATE public.user_plans SET strategies_used=8 WHERE user_id=$1 AND strategies_used=7 RETURNING 1) SELECT count(*)::int AS count FROM changed';
    assert.equal((await db.query(sql, [userId])).rows[0].count, 1);
    assert.equal((await db.query(sql, [userId])).rows[0].count, 0);
    assert.equal((await row('SELECT strategies_used FROM public.user_plans')).strategies_used, 8);
    await assert.rejects(db.exec('SELECT admin_notes FROM public.user_plans'), /permission denied/);
  } finally { await db.exec('RESET ROLE'); }
});

test('ordinary user can create only a default plan for self', async () => {
  await db.exec('DELETE FROM public.user_plans');
  await db.exec('SET ROLE authenticated');
  try {
    await assert.rejects(db.query("INSERT INTO public.user_plans(user_id,plan_type) VALUES($1,'agency')", [userId]), /permission denied/);
    await db.query('INSERT INTO public.user_plans(user_id) VALUES($1)', [userId]);
    assert.equal((await row('SELECT plan_type FROM public.user_plans')).plan_type, 'free');
  } finally { await db.exec('RESET ROLE'); }
});

test('row isolation still hides another user plan and admin membership', async () => {
  await db.query("INSERT INTO public.admin_users(user_id,email) VALUES($1,'fixture@example.invalid')", [userId]);
  await db.exec("SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false); SET ROLE authenticated");
  try {
    assert.equal((await db.query('SELECT user_id FROM public.user_plans')).rows.length, 0);
    assert.equal((await db.query('SELECT user_id FROM public.admin_users')).rows.length, 0);
  } finally { await db.exec('RESET ROLE'); }
});

test('client telemetry cannot forge server billing events', async () => {
  await db.exec('SET ROLE authenticated');
  try {
    await db.query("INSERT INTO public.usage_events(user_id,event_name,event_type) VALUES($1,'checkout_started','billing')", [userId]);
    for (const name of ['subscription_created', 'subscription_cancelled', 'payment_failed', 'generation_completed']) {
      await assert.rejects(db.query("INSERT INTO public.usage_events(user_id,event_name,event_type) VALUES($1,$2,'billing')", [userId, name]), /row-level security/);
    }
    await assert.rejects(db.query("INSERT INTO public.usage_events(user_id,event_name,metadata) VALUES($1,'checkout_started','{\"source\":\"stripe_webhook\"}')", [userId]), /row-level security/);
  } finally { await db.exec('RESET ROLE'); }
});

test('admin membership keeps the same user plan and does not bypass app row isolation', async () => {
  const otherId = '00000000-0000-4000-8000-000000000003';
  await db.query('INSERT INTO auth.users VALUES ($1)', [otherId]);
  await db.query('INSERT INTO public.user_plans(user_id) VALUES ($1)', [otherId]);
  await db.query("INSERT INTO public.admin_users(user_id,email) VALUES($1,'fixture@example.invalid') ON CONFLICT(user_id) DO UPDATE SET active=true", [userId]);
  await db.exec('SET ROLE authenticated');
  try {
    const plans = (await db.query('SELECT user_id,plan_type,strategies_used FROM public.user_plans')).rows;
    assert.deepEqual(plans, [{ user_id: userId, plan_type: 'free', strategies_used: 7 }]);
    assert.equal((await db.query('SELECT user_id FROM public.admin_users')).rows[0].user_id, userId);
    assert.equal((await db.query('SELECT amount FROM public.credit_grants')).rows.length, 0);
    await assert.rejects(db.query("UPDATE public.user_plans SET plan_type='agency' WHERE user_id=$1", [userId]), /permission denied/);
  } finally { await db.exec('RESET ROLE'); }
});
