import test from 'node:test';
import assert from 'node:assert/strict';
import { awarenessLevels, contentPurposes } from '../src/types/workspace.ts';
import { applyWorkspaceResult, emptyWorkspace, matrixSchema, biosSchema, weekSchema, replaceWorkspaceItem, visibleIdeas, storiesCredits, draftWeek, bioLength } from '../src/components/workspace/workspace-model.ts';

function idea(id) { return { id, title: 'Por que comparar os materiais antes de comprar?', angle: 'Explique a diferença usando a oferta real do briefing.', format: 'carousel', briefingBasis: 'O briefing informou dúvidas sobre durabilidade.' }; }
function matrix() { return { id: 'matrix-1', cells: awarenessLevels.flatMap(level => contentPurposes.map(purpose => ({ id: `${level.id}:${purpose.id}`, awareness: level.id, purpose: purpose.id, ideas: [idea(`${level.id}:${purpose.id}:1`)] }))) }; }
function story(id, position = 1) { return { id, position, goal: 'retain', narrative: 'Começo da rotina', scene: 'Mostre a preparação real.', speech: 'Hoje vou mostrar o processo.', onScreen: 'A preparação', tool: 'Vídeo com legenda' }; }
function week() { const draft = draftWeek('2026-09-28'); return { ...draft, days: draft.days.map((day, index) => ({ ...day, routine: 'Preparar pedidos reais.', requestedCount: index === 1 ? 0 : 1, stories: index === 1 ? [] : [story(`day-${index}-story`)] })) }; }
function payload(data, fields = {}) { return { workspace: data, userInput: {}, ...fields }; }

test('matrix requires each awareness-purpose pair and preserves all alternatives beyond visible three', () => {
  const valid = matrix();
  assert.equal(matrixSchema.parse(valid).cells.length, 20);
  const duplicate = structuredClone(valid);
  duplicate.cells[1] = duplicate.cells[0];
  assert.throws(() => matrixSchema.parse(duplicate));
  assert.throws(() => matrixSchema.parse({ ...valid, cells: valid.cells.slice(1) }));
  const empty = structuredClone(valid); empty.cells[0].ideas = [];
  assert.throws(() => matrixSchema.parse(empty));
  empty.cells[0].rationale = 'Esta abordagem depende de uma prova ainda não disponível.';
  assert.equal(matrixSchema.parse(empty).cells[0].ideas.length, 0);
  const alternatives = ['old-1', 'old-2', 'new-1', 'new-2', 'new-3'];
  assert.deepEqual(visibleIdeas(alternatives), ['new-1', 'new-2', 'new-3']);
  assert.equal(alternatives.length, 5);
});

test('bio counts Unicode characters, enforces 150 and rejects missing/duplicate options', () => {
  assert.equal(bioLength('A🙂B'), 3);
  const bios = ['a', 'b', 'c'].map(id => ({ id, name: 'Marca', text: '🙂'.repeat(150) }));
  assert.equal(biosSchema.parse(bios).length, 3);
  assert.throws(() => biosSchema.parse([{ ...bios[0], text: '🙂'.repeat(151) }, ...bios.slice(1)]));
  assert.throws(() => biosSchema.parse(bios.slice(0, 2)));
  assert.throws(() => biosSchema.parse([bios[0], bios[0], bios[2]]));
});

test('Stories quotes use day/week blocks and zero publication does not create consumption', () => {
  for (const [quantity, credits] of [[0, 0], [1, 2], [5, 2], [6, 4], [10, 4], [11, 6], [15, 6]]) assert.equal(storiesCredits([{ requestedCount: quantity }], 'day'), credits);
  for (const [quantity, credits] of [[0, 0], [35, 10], [36, 20], [70, 20], [71, 30], [105, 30]]) assert.equal(storiesCredits([{ requestedCount: quantity }], 'week'), credits);
});

test('Stories validates exact requested counts, zero days, chronology, sequence and real dates', () => {
  const valid = week();
  assert.equal(weekSchema.parse(valid).days[1].stories.length, 0);
  const excess = structuredClone(valid); excess.days[1].stories = [story('unexpected')];
  assert.throws(() => weekSchema.parse(excess));
  const wrongCount = structuredClone(valid); wrongCount.days[0].requestedCount = 2;
  assert.throws(() => weekSchema.parse(wrongCount));
  const wrongOrder = structuredClone(valid); wrongOrder.days[0].stories[0].position = 3;
  assert.throws(() => weekSchema.parse(wrongOrder));
  const wrongDate = structuredClone(valid); wrongDate.days[0].date = '2026-02-31';
  assert.throws(() => weekSchema.parse(wrongDate));
  const repeated = structuredClone(valid); repeated.days[1] = repeated.days[0];
  assert.throws(() => weekSchema.parse(repeated));
});

test('refining one story preserves all other days, narrative neighbours and the original workspace', () => {
  const originalWeek = week();
  originalWeek.days[0].requestedCount = 2;
  originalWeek.days[0].stories.push(story('neighbour', 2));
  const data = { ...emptyWorkspace(), storiesWeek: originalWeek };
  const day = originalWeek.days[0]; const target = day.stories[0];
  const origin = { kind: 'story', id: target.id, dayId: day.id, weekId: originalWeek.id };
  const result = applyWorkspaceResult(data, 'item_refine', payload(data, { origin }), { output: { ...target, id: 'provider-generated-id', speech: 'Fala revisada', position: 15 }, versionId: 'revision-2' });
  assert.equal(result.storiesWeek.days[0].stories[0].speech, 'Fala revisada');
  assert.equal(result.storiesWeek.days[0].stories[0].id, target.id);
  assert.equal(result.storiesWeek.days[0].stories[0].position, 1);
  assert.equal(result.storiesWeek.days[0].stories[0].versionId, 'revision-2');
  assert.deepEqual(result.storiesWeek.days[0].stories[1], day.stories[1]);
  assert.deepEqual(result.storiesWeek.days.slice(1), originalWeek.days.slice(1));
  assert.equal(data.storiesWeek.days[0].stories[0].speech, 'Hoje vou mostrar o processo.');
});

test('day regeneration is constrained to its date and count, preserving the other six days', () => {
  const existing = week(); const data = { ...emptyWorkspace(), storiesWeek: existing };
  const day = existing.days[0]; const options = payload(data, { week: existing, day });
  const result = applyWorkspaceResult(data, 'stories_day', options, { output: { ...day, stories: [{ ...day.stories[0], scene: 'Outra cena real' }] }, versionId: 'day-revision' });
  assert.equal(result.storiesWeek.days[0].stories[0].scene, 'Outra cena real');
  assert.deepEqual(result.storiesWeek.days.slice(1), existing.days.slice(1));
  assert.throws(() => applyWorkspaceResult(data, 'stories_day', options, { output: { ...day, date: '2026-10-20' } }));
  assert.throws(() => applyWorkspaceResult(data, 'stories_day', options, { output: { ...day, requestedCount: 0, stories: [] } }));
});

test('regenerating a day cannot restore old stories from an outdated agenda', () => {
  const agenda = week();
  const current = structuredClone(agenda);
  current.days[2].stories[0].speech = 'Edição manual mais recente, preservada';
  agenda.days[3].routine = 'Rotina futura editada e ainda não gerada';
  const data = { ...emptyWorkspace(), storiesWeek: current, storiesAgenda: agenda };
  const target = agenda.days[0];
  const result = applyWorkspaceResult(data, 'stories_day', payload(data, { week: agenda, day: target }), { output: { ...target, stories: [{ ...target.stories[0], speech: 'Dia solicitado atualizado' }] } });
  assert.equal(result.storiesWeek.days[2].stories[0].speech, 'Edição manual mais recente, preservada');
  assert.equal(result.storiesAgenda.days[3].routine, 'Rotina futura editada e ainda não gerada');
  assert.equal(result.storiesWeek.days[3].routine, current.days[3].routine);
});

test('new week preserves previous week lineage and rejects altered requested daily amounts', () => {
  const previous = week(); const expected = draftWeek('2026-10-05', previous);
  const output = { ...expected, id: 'provider-week', days: expected.days.map((day, dayIndex) => ({ ...day, stories: Array.from({ length: day.requestedCount }, (_, i) => story(`${dayIndex}-${i}`, i + 1)) })) };
  const data = { ...emptyWorkspace(), storiesWeek: previous };
  const result = applyWorkspaceResult(data, 'stories_week', payload(data, { week: expected, previousWeek: previous }), { output, versionId: 'week-revision' });
  assert.equal(result.storiesWeek.previousWeekId, previous.id);
  assert.equal(result.storiesWeek.days[0].stories[0].versionId, 'week-revision');
  assert.equal(result.storiesAgenda.id, result.storiesWeek.id);
  const wrong = structuredClone(output); wrong.days[0].stories.pop(); wrong.days[0].requestedCount--;
  assert.throws(() => applyWorkspaceResult(data, 'stories_week', payload(data, { week: expected }), { output: wrong }));
});

test('manual edits clear the old publication version; new ideas preserve cell origin and history', () => {
  const data = { ...emptyWorkspace(), matrix: matrix() }; const cell = data.matrix.cells[0];
  cell.ideas[0].versionId = 'original-version';
  const origin = { kind: 'idea', id: cell.ideas[0].id, cellId: cell.id };
  const changed = replaceWorkspaceItem(data, origin, { ...cell.ideas[0], title: 'Título editado' });
  assert.equal(changed.matrix.cells[0].ideas[0].versionId, undefined);
  assert.equal(data.matrix.cells[0].ideas[0].versionId, 'original-version');
  const added = applyWorkspaceResult(data, 'idea_generate', payload(data, { cell, origin }), { output: idea('another-idea'), versionId: 'new-version' });
  assert.equal(added.matrix.cells[0].ideas.length, 2);
  assert.equal(added.matrix.cells[0].ideas[1].versionId, 'new-version');
  assert.deepEqual(added.matrix.cells.slice(1), data.matrix.cells.slice(1));
  assert.throws(() => replaceWorkspaceItem(data, { ...origin, id: 'not-found' }, idea('not-found')));
});

test('monetization plan requires valid explicit choices and a new analysis does not change them silently', () => {
  const analysis = { id: 'analysis', potential: 'Potencial a validar', basis: ['Oferta informada no briefing'], ideas: ['a', 'b', 'c'].map(id => ({ id, title: `Oferta ${id}`, offer: 'Oferta baseada no negócio', audience: 'Compradores descritos', basis: 'Oferta fornecida', resources: 'Equipe informada', risks: 'Validar demanda', hypothesis: 'Testar com clientes reais' })) };
  const data = { ...emptyWorkspace(), monetization: analysis, selectedMonetizationIds: ['a'] };
  const refreshed = applyWorkspaceResult(data, 'monetization_analyze', payload(data), { output: { ...analysis, ideas: analysis.ideas.map(idea => ({ ...idea, id: `new-${idea.id}` })) } });
  assert.deepEqual(refreshed.selectedMonetizationIds, ['a']);
  assert.ok(refreshed.staleSections.includes('monetizationSelection'));
  assert.throws(() => applyWorkspaceResult(refreshed, 'monetization_plan', payload(refreshed), { output: 'Um plano' }));
  const completed = applyWorkspaceResult(data, 'monetization_plan', payload(data), { output: 'Plano amplo com validação e operação' });
  assert.equal(completed.monetizationPlan, 'Plano amplo com validação e operação');
  assert.throws(() => applyWorkspaceResult({ ...data, selectedMonetizationIds: [] }, 'monetization_plan', payload({ ...data, selectedMonetizationIds: [] }), { output: 'Um plano' }));
});
