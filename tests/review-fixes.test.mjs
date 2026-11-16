import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPilotPrompt, parsePilotOutput, promptContext, promptRequest } from '../supabase/functions/_shared/pilot-content.ts';
import { buildPackGrant } from '../supabase/functions/_shared/credit-packs.ts';
import { completeScripts, emptyWorkspace, generationContext } from '../src/components/workspace/workspace-model.ts';

const script = index => ({ id: `s${index}`, title: `Conteúdo ${index}`, format: 'reel', origin: { kind: 'idea', id: `i${index}` }, objective: 'Objetivo',
  cta: '', blocks: [{ id: 'b1', label: 'Cena 1', action: 'x'.repeat(4000) }], caption: 'Legenda' });

test('the generation request does not grow with the storyboards already created', () => {
  const data = { ...emptyWorkspace(), scripts: Array.from({ length: 120 }, (_, index) => script(index)) };
  const context = generationContext(data);
  assert.equal(context.scripts.length, 40);
  assert.deepEqual(context.scripts.at(-1), { title: 'Conteúdo 119', format: 'reel' });
  assert.ok(JSON.stringify(context).length < 10_000);
  assert.equal(data.scripts.length, 120);
});

test('history records opened with summarized storyboards show only complete ones', () => {
  const data = { ...emptyWorkspace(), scripts: [{ title: 'Resumo', format: 'reel' }, script(1)] };
  assert.deepEqual(completeScripts(data).scripts.map(item => item.id), ['s1']);
});

test('the prompt carries the workspace once and storyboards only as titles', () => {
  const workspace = { schemaVersion: 1, scripts: [script(1)], selectedMonetizationIds: [] };
  const p = { section: 'actionPlan', workspace, strategy: { idealCustomerProfile: 'perfil-unico' } };
  assert.deepEqual(promptRequest(p), { section: 'actionPlan' });
  assert.deepEqual(promptContext({ workspace }).workspace.scripts, [{ title: 'Conteúdo 1', format: 'reel' }]);
  const { user } = buildPilotPrompt('section', p, { niche: 'Nicho' }, { strategy: p.strategy, workspace }, []);
  assert.equal(user.split('perfil-unico').length - 1, 1);
  assert.ok(!user.includes('x'.repeat(100)));
});

test('a calendar day without hashtags does not fail the section', () => {
  const items = Array.from({ length: 30 }, (_, index) => ({ day: index + 1, weekday: 'Segunda', contentType: 'Reel curto', topic: 'Tema', caption: 'Legenda',
    hashtags: index === 0 ? undefined : index === 1 ? null : ['#a', '#b', '#c', '#d', '#e', '#f'] }));
  const days = parsePilotOutput(JSON.stringify({ items }), 'section', { section: 'editorialCalendar' });
  assert.deepEqual(days[0].hashtags, []);
  assert.deepEqual(days[1].hashtags, []);
  assert.deepEqual(days[2].hashtags, ['#a', '#b', '#c', '#d', '#e']);
  assert.equal(days[0].contentType, 'reel');
});

test('a Pix created before a price change is credited with the price it was charged', () => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const session = (metadata, amount_total) => ({ id: 'evt', type: 'checkout.session.async_payment_succeeded', data: { object: { id: 'cs_test_old_price_1',
    mode: 'payment', payment_status: 'paid', currency: 'brl', amount_total, client_reference_id: userId,
    metadata: { kind: 'credit_pack', pack: 'pack_50', supabase_user_id: userId, ...metadata } } } });
  const grant = buildPackGrant(session({ credits: '50', amount_cents: '1234' }, 1234));
  assert.equal(grant.credits, 50);
  assert.equal(grant.metadata.amountCents, 1234);
  assert.throws(() => buildPackGrant(session({ credits: '50', amount_cents: '1234' }, 999)), /Valor/);
  assert.throws(() => buildPackGrant(session({ credits: '0', amount_cents: '1234' }, 1234)), /Valor/);
});

test('a reservation that was never claimed is released, and the admin search covers every account', () => {
  const callAi = readFileSync(new URL('../supabase/functions/call-ai/index.ts', import.meta.url), 'utf8');
  const reserve = callAi.indexOf("'pilot_reserve_generation'"); const claim = callAi.indexOf("'pilot_claim_step'");
  const guarded = callAi.slice(reserve, callAi.indexOf('if(claim.cached'));
  assert.ok(reserve > 0 && claim > reserve);
  assert.match(guarded, /generation\.status==='reserved'/);
  assert.match(guarded, /pilot_release_generation/);
  const admin = readFileSync(new URL('../supabase/functions/admin-api/index.ts', import.meta.url), 'utf8');
  assert.match(admin, /\(await listAllAuthUsers\(supabase\)\)\.filter/);
  assert.match(admin, /accounts\.filter\(isBanned\)/);
});
