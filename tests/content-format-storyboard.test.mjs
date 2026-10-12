import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPilotPrompt, parsePilotOutput } from '../supabase/functions/_shared/pilot-content.ts';
import { calendarFormat, ideaSchema, storySchema } from '../src/components/workspace/workspace-model.ts';

const frame = (over = {}) => ({ id: 'f', position: 1, goal: 'retain', narrative: 'N', scene: 'S', speech: 'F', onScreen: 'T', tool: 'enquete', ...over });
const day = { id: 'd1', date: '2026-10-13', routine: 'R', requestedCount: 3, stories: [] };

test('matrix ideas are valid without a format, on the engine and on the screen', () => {
  const parsed = parsePilotOutput(JSON.stringify({ id: 'i', title: 'T', angle: 'A', briefingBasis: 'B', cta: 'C' }), 'idea', { cell: { awareness: 'problem', purpose: 'growth' } });
  assert.equal(parsed.format, undefined);
  assert.equal(ideaSchema.safeParse({ id: 'i', title: 'T', angle: 'A', briefingBasis: 'B' }).success, true);
});

test('stories suggest a format: video by default, Portuguese names accepted', () => {
  const raw = { ...day, stories: [frame({ format: undefined }), frame({ id: 'g', format: 'Foto' }), frame({ id: 'h', format: 'texto' })] };
  const parsed = parsePilotOutput(JSON.stringify(raw), 'stories_day', { day });
  assert.deepEqual(parsed.stories.map(s => s.format), ['video', 'photo', 'text']);
  assert.equal(storySchema.safeParse(parsed.stories[1]).success, true);
});

test('calendar keeps a usable format for each day', () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, weekday: 'Segunda', contentType: ['Reel curto', 'Carrossel', 'post', 'stories'][i % 4], topic: 'Ideia', caption: 'Orientação', hashtags: [] }));
  const parsed = parsePilotOutput(JSON.stringify({ items }), 'section', { section: 'editorialCalendar' });
  assert.deepEqual(parsed.slice(0, 4).map(d => d.contentType), ['reel', 'carousel', 'static', 'stories']);
  assert.equal(calendarFormat('Carrossel educativo'), 'carousel');
  assert.equal(calendarFormat('Live'), undefined);
});

test('content from a calendar day keeps its origin and the storyboard instructions apply to every format', () => {
  const origin = { kind: 'calendar', id: 'calendar-day-4' };
  const script = { id: 's', title: 'T', format: 'carousel', origin, objective: 'O', cta: 'C', caption: 'Legenda', blocks: [{ id: 'b1', label: 'Slide 1', action: 'Visual', onScreen: 'Texto' }] };
  const parsed = parsePilotOutput(JSON.stringify(script), 'script', { format: 'carousel', origin });
  assert.equal(parsed.origin.kind, 'calendar');
  const { system } = buildPilotPrompt('script', { format: 'reel', origin }, {}, {}, []);
  assert.match(system, /Storyboard pronto para produzir/);
  assert.match(system, /legenda pronta para publicar/);
});
