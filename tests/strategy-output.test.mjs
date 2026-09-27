import test from 'node:test';
import assert from 'node:assert/strict';
import { outputSchemas, parseStrategyOutput } from '../src/lib/strategy-output.ts';
import { generateFinalStrategyAssets } from '../src/lib/final-strategy-assets.ts';

test('JSON parser accepts fenced output and ignores brackets and escaped quotes inside content', () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: `Dia ${i}`, objective: 'Objetivo', contentType: 'Vídeo', example: 'Diga "olá" e mostre [produto] com } no rótulo.', tips: 'Enquete' }));
  const parsed = parseStrategyOutput('```json\n' + JSON.stringify(rows) + '\n```', outputSchemas.storiesStrategy);
  assert.deepEqual(parsed, rows);
});

test('invalid, incomplete and duplicate-day output fails instead of returning generic content', () => {
  for (const raw of ['Texto genérico sem JSON', '[]', '[{"dayOfWeek":"Dia"}]', '[}']) {
    assert.throws(() => parseStrategyOutput(raw, outputSchemas.storiesStrategy), /incompleta ou inválida/);
  }
  const duplicate = Array.from({ length: 30 }, () => ({ day: 1, weekday: 'Dia', contentType: 'Foto', topic: 'Tópico', caption: 'Legenda', hashtags: [] }));
  assert.throws(() => parseStrategyOutput(JSON.stringify(duplicate), outputSchemas.editorialCalendar), /inválida/);
});

test('final assets receive reviewed context, preserve progress, and retry only unfinished work', async () => {
  const input = { niche: 'Negócio fictício de teste' };
  let latest = { idealCustomerProfile: 'ICP revisado', monetizationIdeas: 'Análise revisada', instagramBio: 'Bio revisada', storiesStrategy: [] };
  const calls = [];
  let fail = true;
  const generators = {
    contentTable: async (_, context) => { calls.push('matrix'); assert.equal(context.idealCustomerProfile, 'ICP revisado'); return { topOfFunnel: [], middleOfFunnel: [], bottomOfFunnel: [] }; },
    editorialCalendar: async (_, context) => { calls.push('calendar'); assert.ok(context.contentTable); if (fail) throw Error('timeout'); return []; },
    actionPlan: async (_, context) => { calls.push('action'); assert.ok(context.editorialCalendar); assert.equal(context.monetizationIdeas, 'Análise revisada'); return []; },
  };
  await assert.rejects(generateFinalStrategyAssets(input, latest, generators, value => { latest = value; }, () => false), /timeout/);
  assert.ok(latest.contentTable);
  fail = false;
  const result = await generateFinalStrategyAssets(input, latest, generators, value => { latest = value; }, () => false);
  assert.deepEqual(calls, ['matrix', 'calendar', 'calendar', 'action']);
  assert.equal(Object.keys(result).length, 7);
});

test('cancelling a final generation prevents late results from replacing another strategy', async () => {
  let cancelled = false;
  let progress = false;
  const generators = { contentTable: async () => { cancelled = true; return {}; }, editorialCalendar: async () => assert.fail('must not generate'), actionPlan: async () => assert.fail('must not generate') };
  await assert.rejects(generateFinalStrategyAssets({}, {}, generators, () => { progress = true; }, () => cancelled), /interrompida/);
  assert.equal(progress, false);
});
