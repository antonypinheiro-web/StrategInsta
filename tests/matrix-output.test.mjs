import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePilotOutput } from '../supabase/functions/_shared/pilot-content.ts';

const awareness = ['unaware', 'problem', 'solution', 'offer', 'decision'];
const purposes = ['growth', 'engagement', 'authority', 'objection'];
const idea = (id, format = 'reel') => ({ id, title: 'Título', angle: 'Ângulo', format, briefingBasis: 'Base', cta: 'Convite' });
const cells = () => awareness.flatMap(a => purposes.map(p => ({ id: `${a}:${p}`, awareness: a, purpose: p, ideas: [idea(`${a}-${p}`)], rationale: 'Motivo' })));
const parse = value => parsePilotOutput(JSON.stringify(value), 'section', { section: 'contentTable' });
const reasonOf = fn => { try { fn(); } catch (e) { return `${e.code}:${e.reason ?? ''}`; } return 'ok'; };

test('a well-formed matrix passes unchanged', () => {
  const parsed = parse({ id: 'm', cells: cells() });
  assert.equal(parsed.cells.length, 20);
});

test('harmless model deviations are normalized instead of failing the paid stage', () => {
  const raw = cells().map((c, i) => ({ ...c, awareness: c.awareness.toUpperCase(), purpose: ` ${c.purpose} `,
    id: i === 0 ? undefined : c.id, ideas: [idea(`${c.id}-a`, ['Carrossel', 'Reels', 'post', 'story'][i % 4]), idea(`${c.id}-b`)] }));
  raw.push({ ...raw[1] });
  const parsed = parse({ matrix: { cells: raw } });
  assert.equal(parsed.cells.length, 20);
  assert.equal(parsed.id, 'matrix');
  assert.equal(parsed.cells[0].id, 'unaware:growth');
  assert.deepEqual(parsed.cells.slice(0, 4).map(c => c.ideas[0].format), ['carousel', 'reel', 'static', 'stories']);
  assert.ok(parsed.cells.every(c => c.ideas.length === 1));
});

test('real structural failures still fail and report a content-free reason', () => {
  assert.equal(reasonOf(() => parse({ id: 'm', cells: cells().slice(0, 19) })), 'INVALID_OUTPUT:matrix.cells.length=19');
  const badFormat = cells(); badFormat[3].ideas = [idea('x', 'podcast')];
  assert.equal(reasonOf(() => parse({ id: 'm', cells: badFormat })), 'INVALID_OUTPUT:matrix.cells[3].ideas[0].format');
  const noIdea = cells(); noIdea[5].ideas = [];
  assert.equal(reasonOf(() => parse({ id: 'm', cells: noIdea })), 'INVALID_OUTPUT:matrix.cells[5].ideas.length=0');
  assert.equal(reasonOf(() => parsePilotOutput('{not json', 'section', { section: 'contentTable' })), 'INVALID_OUTPUT:json.parse');
});

test('the final full-strategy stage uses the same tolerant matrix validation', () => {
  const day = d => ({ day: d, weekday: 'Segunda', contentType: 'Reel', topic: 'Tema', caption: 'Legenda', hashtags: [] });
  const week = w => ({ week: w, tasks: [{ task: 'Ação', description: 'Como', priority: 'alta' }] });
  const value = { matrix: { matrix: { cells: cells() } }, editorialCalendar: Array.from({ length: 30 }, (_, i) => day(i + 1)), actionPlan: [1, 2, 3, 4].map(week) };
  const reason = reasonOf(() => parsePilotOutput(JSON.stringify(value), 'full_strategy', { stage: 'final' }));
  assert.ok(!reason.includes('matrix'), reason);
});
