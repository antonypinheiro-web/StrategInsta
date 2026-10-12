import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPilotPrompt, normalizeFormat, parsePilotOutput } from '../supabase/functions/_shared/pilot-content.ts';

const awareness = ['unaware', 'problem', 'solution', 'offer', 'decision'];
const purposes = ['growth', 'engagement', 'authority', 'objection'];
const reasonOf = fn => { try { fn(); } catch (e) { return `${e.code}:${e.reason ?? ''}`; } return 'ok'; };

test('descriptive formats from the models map to the allowed enum (matrix failure of 12/10)', () => {
  assert.equal(normalizeFormat('Reel curto'), 'reel');
  assert.equal(normalizeFormat('Vídeo'), 'reel');
  assert.equal(normalizeFormat('Carrossel educativo'), 'carousel');
  assert.equal(normalizeFormat('Post estático'), 'static');
  assert.equal(normalizeFormat('Sequência de Stories'), 'stories');
  assert.equal(normalizeFormat('podcast'), 'podcast');
  const formats = ['Reel curto', 'Carrossel educativo', 'Post único', 'Stories'];
  const cells = awareness.flatMap(a => purposes.map((p, i) => ({ id: `${a}:${p}`, awareness: a, purpose: p, rationale: 'Motivo',
    ideas: [{ id: `${a}-${p}`, title: 'Título', angle: 'Ângulo', format: formats[i], briefingBasis: 'Base', cta: 'Convite' }] })));
  const parsed = parsePilotOutput(JSON.stringify({ id: 'm', cells }), 'section', { section: 'contentTable' });
  assert.deepEqual(parsed.cells.slice(0, 4).map(c => c.ideas[0].format), ['reel', 'carousel', 'static', 'stories']);
});

test('the matrix prompt now lists the allowed formats', () => {
  const { user, system } = buildPilotPrompt('section', { section: 'contentTable' }, {}, {}, []);
  assert.match(system + user, /exatamente reel, carousel, static ou stories/);
});

const expectedDay = { id: 'd1', date: '2026-10-13', routine: 'Rotina', requestedCount: 3, stories: [] };
const frame = (over = {}) => ({ id: 'f', position: 1, goal: 'retain', narrative: 'N', scene: 'S', speech: 'F', onScreen: 'T', tool: 'enquete', cta: 'C', feedConnection: 'X', effort: 'E', ...over });

test('stories day tolerates empty tool, null texts, Portuguese goals, bad positions and missing ids (stories failure of 12/10)', () => {
  const raw = { day: { id: 'd1', date: '2026-10-14', routine: null, requestedCount: '3', stories: [
    frame({ id: '', position: 7, tool: '', goal: 'Reter', onScreen: null }),
    frame({ id: 'x', position: 'dois', tool: null, goal: 'engajar', speech: null }),
    frame({ id: 'x', position: 3, goal: 'Converter' }),
    frame({ id: 'extra' }),
  ] } };
  const parsed = parsePilotOutput(JSON.stringify(raw), 'stories_day', { day: expectedDay });
  assert.equal(parsed.date, '2026-10-13');
  assert.equal(parsed.requestedCount, 3);
  assert.equal(parsed.stories.length, 3);
  assert.deepEqual(parsed.stories.map(s => s.position), [1, 2, 3]);
  assert.deepEqual(parsed.stories.map(s => s.goal), ['retain', 'engage', 'convert']);
  assert.deepEqual(parsed.stories.map(s => s.tool), ['nenhum', 'nenhum', 'enquete']);
  assert.equal(new Set(parsed.stories.map(s => s.id)).size, 3);
  assert.equal(parsed.stories[0].onScreen, '');
});

test('stories day still fails on real gaps and reports a content-free reason', () => {
  const short = { id: 'd1', date: '2026-10-13', routine: 'R', requestedCount: 3, stories: [frame(), frame({ id: 'g' })] };
  assert.equal(reasonOf(() => parsePilotOutput(JSON.stringify(short), 'stories_day', { day: expectedDay })), 'INVALID_OUTPUT:day.stories.length=2/3');
  const noScene = { ...short, stories: [frame(), frame({ id: 'g', scene: '' }), frame({ id: 'h' })] };
  assert.equal(reasonOf(() => parsePilotOutput(JSON.stringify(noScene), 'stories_day', { day: expectedDay })), 'INVALID_OUTPUT:day.stories[1].scene');
});
