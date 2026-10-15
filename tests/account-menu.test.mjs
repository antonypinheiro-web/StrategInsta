import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_BRAND_PROFILE, hasBrandProfile, parseBrandProfile, withBrandProfile } from '../src/lib/brand-profile.ts';
import { summarizeUsage } from '../src/lib/usage.ts';
import { APP_VERSION, CHANGELOG } from '../src/lib/changelog.ts';
import { BRAND_PROFILE_RULE, buildPilotPrompt } from '../supabase/functions/_shared/pilot-content.ts';

test('brand profile from account metadata keeps only known fields within limits', () => {
  const parsed = parseBrandProfile({ voice: 'x'.repeat(900), wordsToAvoid: 'garantido', emojis: 'muitos', role: 'admin' });
  assert.equal(parsed.voice.length, 500);
  assert.equal(parsed.wordsToAvoid, 'garantido');
  assert.equal(parsed.emojis, 'few');
  assert.equal('role' in parsed, false);
  assert.deepEqual(parseBrandProfile(null), EMPTY_BRAND_PROFILE);
  assert.equal(hasBrandProfile(EMPTY_BRAND_PROFILE), false);
});

test('every generation carries the profile; the briefing voice wins when filled', () => {
  const profile = { ...EMPTY_BRAND_PROFILE, voice: 'Direto e próximo', emojis: 'none' };
  const empty = withBrandProfile({ niche: 'Consultoria', brandVoice: '' }, profile);
  assert.equal(empty.brandVoice, 'Direto e próximo');
  assert.deepEqual(empty.brandProfile, profile);
  assert.equal(withBrandProfile({ niche: 'Consultoria', brandVoice: 'Técnico' }, profile).brandVoice, 'Técnico');
  const untouched = { niche: 'Consultoria' };
  assert.equal(withBrandProfile(untouched, EMPTY_BRAND_PROFILE), untouched);
});

test('the engine treats the brand profile as a style preference for all texts', () => {
  const { system } = buildPilotPrompt('script', { format: 'reel', origin: { kind: 'idea', id: 'i' } }, {}, {}, []);
  assert.ok(system.includes(BRAND_PROFILE_RULE));
  assert.match(BRAND_PROFILE_RULE, /nunca use/);
  assert.match(BRAND_PROFILE_RULE, /não altera fatos, regras da plataforma/);
});

test('usage counts only completed generations of the month, grouped by kind', () => {
  const generations = [
    { operation: 'script', status: 'completed', credits: 2, created_at: '2026-10-10T12:00:00Z' },
    { operation: 'script', status: 'completed', credits: 2, created_at: '2026-10-11T12:00:00Z' },
    { operation: 'full_strategy', status: 'completed', credits: 20, created_at: '2026-10-12T12:00:00Z' },
    { operation: 'section', status: 'failed', credits: 5, created_at: '2026-10-12T12:00:00Z' },
    { operation: 'script', status: 'completed', credits: 2, created_at: '2026-09-20T12:00:00Z' },
  ];
  const october = summarizeUsage(generations, new Date(2026, 9, 15));
  assert.equal(october.total, 24);
  assert.equal(october.count, 3);
  assert.deepEqual(october.byOperation.map(item => [item.name, item.credits, item.count]), [['Estratégia completa', 20, 1], ['Conteúdos (storyboard)', 4, 2]]);
  assert.equal(summarizeUsage(generations, new Date(2026, 8, 15)).total, 2);
});

test('the changelog starts at the current app version', () => {
  assert.equal(CHANGELOG[0].version, APP_VERSION);
  assert.ok(CHANGELOG.every(entry => entry.items.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)));
});
