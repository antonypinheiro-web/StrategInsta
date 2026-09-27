import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { incrementLegacyPlanUsage } from '../src/lib/legacy-plan-usage.ts';

function clientFor(response, inspect = () => {}) {
  return createClient('https://fixture.supabase.co', 'fixture-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (url, init) => { inspect(new URL(url), init); return response(); } },
  });
}

test('credit update uses exact count without requesting protected return columns', async () => {
  const client = clientFor(() => new Response(null, { status: 204, headers: { 'content-range': '0-0/1' } }), (url, init) => {
    assert.equal(init.method, 'PATCH');
    assert.equal(url.searchParams.get('user_id'), 'eq.fixture-user');
    assert.equal(url.searchParams.get('strategies_used'), 'eq.1');
    assert.equal(url.searchParams.has('select'), false);
    const prefer = new Headers(init.headers).get('prefer');
    assert.match(prefer, /count=exact/);
    assert.doesNotMatch(prefer, /return=representation/);
    assert.deepEqual(JSON.parse(init.body), { strategies_used: 2 });
  });
  assert.equal(await incrementLegacyPlanUsage(client, 'fixture-user', 1), 2);
});

test('zero affected rows and absent counts never report a recorded credit', async () => {
  for (const headers of [{ 'content-range': '*/0' }, {}]) {
    const client = clientFor(() => new Response(null, { status: 204, headers }));
    await assert.rejects(incrementLegacyPlanUsage(client, 'fixture-user', 1), /Uso alterado/);
  }
});

test('permission failure remains an error instead of bypassing accounting', async () => {
  const client = clientFor(() => new Response(JSON.stringify({ code: '42501', message: 'permission denied for table user_plans' }), { status: 403 }));
  await assert.rejects(incrementLegacyPlanUsage(client, 'fixture-user', 1), { code: '42501' });
});
