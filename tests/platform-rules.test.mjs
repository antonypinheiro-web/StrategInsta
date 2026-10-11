import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_HASHTAGS, buildPilotPrompt, parsePilotOutput } from '../supabase/functions/_shared/pilot-content.ts';

const calendarDay = (day, hashtags) => ({ day, weekday: 'Segunda', contentType: 'Reel', topic: 'Tema', caption: 'Legenda', hashtags });

test('calendar keeps at most five hashtags per post instead of failing the stage', () => {
  const items = Array.from({ length: 30 }, (_, i) => calendarDay(i + 1, ['#a', '#b', '#c', '#d', '#e', '#f', '#g']));
  const parsed = parsePilotOutput(JSON.stringify({ items }), 'section', { section: 'editorialCalendar' });
  assert.equal(MAX_HASHTAGS, 5);
  for (const day of parsed) assert.equal(day.hashtags.length, 5);
  assert.deepEqual(parsed[0].hashtags, ['#a', '#b', '#c', '#d', '#e']);
});

test('calendar still rejects hashtags that are not strings', () => {
  const items = Array.from({ length: 30 }, (_, i) => calendarDay(i + 1, [123]));
  assert.throws(() => parsePilotOutput(JSON.stringify({ items }), 'section', { section: 'editorialCalendar' }));
});

test('system prompt carries the platform rules for every operation', () => {
  const { system } = buildPilotPrompt('idea', { cell: { awareness: 'problem', purpose: 'growth' } }, { niche: 'Organização' }, {}, []);
  assert.match(system, /REGRAS DA PLATAFORMA/);
  assert.match(system, /no máximo 5 por post/);
  assert.match(system, /engagement bait/);
  assert.match(system, /até 3 minutos/);
  assert.match(system, /uma a cada seis peças/);
});

test('monetization plan no longer promotes third-party consulting', () => {
  const { system } = buildPilotPrompt('monetization_plan', { selectedMonetizationIds: ['a'] }, { niche: 'Organização' }, {}, []);
  assert.doesNotMatch(system, /Antony/);
  assert.match(system, /Não promova serviços de terceiros/);
});
