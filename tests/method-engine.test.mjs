import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateStage, buildPilotPrompt, hasCompleteMatrix, mergeWorkspaceContext, parseMethod, parsePilotOutput, STAGES } from '../supabase/functions/_shared/pilot-content.ts';
import { methodKnowledge, sanitizeMethod } from '../supabase/functions/_shared/knowledge/metodo.ts';
import { applyWorkspaceResult, emptyWorkspace, matrixSchema } from '../src/components/workspace/workspace-model.ts';
import { awarenessLevels, contentPurposes } from '../src/types/workspace.ts';
import { normalizeBriefing } from '../src/lib/briefing.ts';

const awareness = ['unaware', 'problem', 'solution', 'offer', 'decision'];
const purposes = ['growth', 'engagement', 'authority', 'objection', 'sale'];
const idea = (id, extra = {}) => ({ id, title: 'Título', angle: 'Ângulo', briefingBasis: 'Base', cta: 'Convite', ...extra });
const cells = (list = purposes) => awareness.flatMap(a => list.map(p => ({ id: `${a}:${p}`, awareness: a, purpose: p, ideas: [idea(`${a}-${p}`)], rationale: 'Motivo' })));
const calendarDays = () => Array.from({ length: 30 }, (_, index) => ({ day: index + 1, weekday: 'Segunda', contentType: 'reel', topic: 'Tema', caption: 'Legenda', hashtags: [] }));
const plan = () => [1, 2, 3, 4].map(week => ({ week, tasks: [{ task: 'Ação', description: 'Como fazer', priority: 'high' }] }));
const input = { niche: 'Cerâmica artesanal' };
const prompt = (operation, p, prior = {}) => buildPilotPrompt(operation, p, input, prior, []).system;

test('each operation receives only the part of the method it uses', () => {
  assert.match(methodKnowledge('idealCustomerProfile'), /Classifique a fase e a etapa prioritária/);
  assert.match(methodKnowledge('contentTable'), /Finalidade sale/);
  assert.match(methodKnowledge('editorialCalendar'), /menos volume e mais base/);
  assert.match(methodKnowledge('monetizationIdeas'), /revenue .* referral/);
  assert.doesNotMatch(methodKnowledge('editorialCalendar'), /Finalidade sale/);
  for (const kind of ['instagramBio', 'storiesStrategy', 'stories_day', 'stories_week', 'refine_short', 'attachment_ocr']) assert.equal(methodKnowledge(kind), '');
  assert.doesNotMatch(prompt('stories_day', { day: { date: '2026-11-17', requestedCount: 1, routine: '' } }), /MÉTODO:/);
});

test('the method stays internal: prompts forbid naming it and never carry its names', () => {
  const prompts = [
    prompt('full_strategy', { stage: 'idealCustomerProfile' }), prompt('full_strategy', { stage: 'contentMatrix' }),
    prompt('full_strategy', { stage: 'final', finalScope: 'calendarPlan' }), prompt('section', { section: 'contentTable' }),
    prompt('section', { section: 'editorialCalendar' }), prompt('section', { section: 'actionPlan' }),
    prompt('idea', { cell: { awareness: 'offer', purpose: 'sale' } }), prompt('monetization_plan', { selectedMonetizationIds: ['a'] }),
  ];
  for (const system of prompts) {
    assert.match(system, /Não escreva em texto visível as siglas do método, os nomes das fases nem os nomes das etapas do funil/);
    assert.doesNotMatch(system, /3A3R|E\.A\.E|Estruturação|Aceleração|Assimilação|Aquisição|Ativação|Recomendação/);
  }
});

test('the customer profile stage returns the internal reading without failing when it is missing', () => {
  const method = { phase: 'Structure', phaseReason: 'Oferta ainda sem caminho de contato.', bottleneck: 'acquisition', bottleneckReason: 'Poucas pessoas chamam.' };
  const text = JSON.stringify({ text: 'x'.repeat(60), method });
  assert.equal(parsePilotOutput(text, 'full_strategy', { stage: 'idealCustomerProfile' }), 'x'.repeat(60));
  assert.deepEqual(parseMethod(text), { ...method, phase: 'structure' });
  assert.equal(parseMethod(JSON.stringify({ text: 'x'.repeat(60) })), undefined);
  assert.equal(parseMethod(JSON.stringify({ text: 'x', method: { phase: 'growth', bottleneck: 'acquisition' } })), undefined);
  assert.equal(parseMethod('{not json'), undefined);
  assert.equal(sanitizeMethod({ phase: 'scale', bottleneck: 'revenue', phaseReason: 'y'.repeat(900) }).phaseReason.length, 600);
  const aggregate = aggregateStage({}, 'idealCustomerProfile', 'perfil', {}, parseMethod(text));
  assert.equal(aggregate.strategy.idealCustomerProfile, 'perfil');
  assert.equal(aggregate.workspace.method.bottleneck, 'acquisition');
  assert.equal(aggregateStage({}, 'idealCustomerProfile', 'perfil', {}).workspace.method, undefined);
});

test('the internal reading travels with the workspace and an invalid one from the client is dropped', () => {
  const valid = { phase: 'acceleration', phaseReason: '', bottleneck: 'activation', bottleneckReason: '' };
  assert.deepEqual(mergeWorkspaceContext({}, { workspace: { method: valid } }).workspace.method, valid);
  assert.equal(mergeWorkspaceContext({}, { workspace: { method: { phase: 'x', bottleneck: 'activation' } } }).workspace.method, undefined);
  assert.deepEqual(mergeWorkspaceContext({ workspace: { method: valid } }, { workspace: {} }).workspace.method, valid);
});

test('the matrix has 25 cells with the sale column and an internal funnel tag per idea', () => {
  const raw = cells().map(cell => cell.purpose === 'sale' ? { ...cell, purpose: 'Oferta e venda', ideas: [idea(cell.ideas[0].id, { funnelStage: 'Activation' })] } : { ...cell, ideas: [idea(cell.ideas[0].id, { funnelStage: 'topo' })] });
  const parsed = parsePilotOutput(JSON.stringify({ id: 'm', cells: raw }), 'full_strategy', { stage: 'contentMatrix' });
  assert.equal(parsed.cells.length, 25);
  assert.equal(parsed.cells.filter(cell => cell.purpose === 'sale').length, 5);
  assert.equal(parsed.cells.find(cell => cell.id === 'offer:sale').ideas[0].funnelStage, 'activation');
  assert.equal(parsed.cells[0].ideas[0].funnelStage, undefined);
  assert.throws(() => parsePilotOutput(JSON.stringify({ id: 'm', cells: cells(purposes.slice(0, 4)) }), 'section', { section: 'contentTable' }), error => error.reason === 'matrix.cells.length=20');
  assert.match(prompt('section', { section: 'contentTable' }), /EXATAMENTE 25 combinações/);
});

test('the matrix runs in its own stage and the final stage then builds only calendar and plan', () => {
  assert.deepEqual(STAGES.slice(-2), ['contentMatrix', 'final']);
  const matrix = { id: 'm', cells: cells() };
  const afterMatrix = aggregateStage({ strategy: { idealCustomerProfile: 'perfil' } }, 'contentMatrix', matrix, {});
  assert.equal(afterMatrix.workspace.matrix.cells.length, 25);
  assert.equal(afterMatrix.strategy.contentTable.topOfFunnel.length, 10);
  assert.equal(hasCompleteMatrix(afterMatrix), true);
  assert.equal(hasCompleteMatrix({ workspace: { matrix: { id: 'm', cells: cells(purposes.slice(0, 4)) } } }), false);
  assert.equal(hasCompleteMatrix({}), false);
  const system = prompt('full_strategy', { stage: 'final', finalScope: 'calendarPlan' });
  assert.match(system, /Não gere nova matriz/);
  assert.doesNotMatch(system, /EXATAMENTE 25 combinações/);
  const output = parsePilotOutput(JSON.stringify({ editorialCalendar: calendarDays(), actionPlan: plan() }), 'full_strategy', { stage: 'final', finalScope: 'calendarPlan' });
  assert.deepEqual(Object.keys(output), ['editorialCalendar', 'actionPlan']);
  const done = aggregateStage(afterMatrix, 'final', output, {});
  assert.equal(done.workspace.matrix.cells.length, 25);
  assert.equal(done.strategy.editorialCalendar.length, 30);
  assert.equal(done.strategy.contentTable.topOfFunnel.length, 10);
});

test('a generation without the matrix stage still gets the matrix in the final stage', () => {
  assert.match(prompt('full_strategy', { stage: 'final', finalScope: 'all' }), /EXATAMENTE 25 combinações/);
  assert.throws(() => parsePilotOutput(JSON.stringify({ editorialCalendar: calendarDays(), actionPlan: plan() }), 'full_strategy', { stage: 'final', finalScope: 'all' }));
  const output = parsePilotOutput(JSON.stringify({ matrix: { id: 'm', cells: cells() }, editorialCalendar: calendarDays(), actionPlan: plan() }), 'full_strategy', { stage: 'final' });
  assert.equal(aggregateStage({}, 'final', output, {}).workspace.matrix.cells.length, 25);
});

test('a strategy saved with the 5x4 matrix keeps working and gains the sale column idea by idea', () => {
  const legacy = { id: 'matrix-1', cells: awarenessLevels.flatMap(level => contentPurposes.filter(purpose => purpose.id !== 'sale').map(purpose => ({
    id: `${level.id}:${purpose.id}`, awareness: level.id, purpose: purpose.id, ideas: [{ ...idea(`${level.id}:${purpose.id}:1`), format: 'reel' }] }))) };
  assert.equal(matrixSchema.parse(legacy).cells.length, 20);
  const data = { ...emptyWorkspace(), matrix: legacy };
  const cell = { id: 'offer:sale', awareness: 'offer', purpose: 'sale', ideas: [] };
  const next = applyWorkspaceResult(data, 'idea_generate', { workspace: data, userInput: {}, cell }, { output: idea('nova', { funnelStage: 'activation' }), versionId: 'v1' });
  assert.equal(next.matrix.cells.length, 21);
  assert.equal(next.matrix.cells.at(-1).ideas[0].id, 'nova');
  assert.equal(matrixSchema.parse(next.matrix).cells.length, 21);
  assert.equal(data.matrix.cells.length, 20);
  assert.throws(() => applyWorkspaceResult(data, 'idea_generate', { workspace: data, userInput: {}, cell: { ...cell, id: 'other', purpose: 'growth' } }, { output: idea('x') }), /célula de origem/);
});

test('the briefing carries the Direct automation answer used by the keyword invitation rule', () => {
  assert.equal(normalizeBriefing({ directAutomation: 'Quem comenta GUIA recebe o link.' }).directAutomation, 'Quem comenta GUIA recebe o link.');
  assert.equal(normalizeBriefing({}).directAutomation, '');
  assert.match(prompt('script', { format: 'reel', origin: { kind: 'idea', id: 'i' } }), /campo directAutomation do briefing .*campo vazio ou ausente significa que não há automação/);
});
