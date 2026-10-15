import test from 'node:test';
import assert from 'node:assert/strict';
import { blockToText, scriptToText, scriptsToText, storiesDayToText, storyToText } from '../src/lib/content-text.ts';
import { applyWorkspaceResult, emptyWorkspace, scriptSchema } from '../src/components/workspace/workspace-model.ts';

const script = (over = {}) => ({ id: 's1', title: 'Bastidores da consultoria', format: 'reel', origin: { kind: 'idea', id: 'i1' }, objective: 'Mostrar o processo',
  cta: 'Chame no Direct', caption: 'Legenda pronta #marketing', blocks: [
    { id: 'b1', label: 'Cena 1 (5s)', action: 'Close nas mãos', speech: 'Tudo começa aqui', onScreen: 'Estrutura antes de acelerar' },
    { id: 'b2', label: 'Cena 2', text: 'Texto do slide' },
  ], ...over });

test('a content copies as clean text for other creation tools', () => {
  const text = scriptToText(script());
  assert.match(text, /^Bastidores da consultoria\nFormato: Reel\nObjetivo: Mostrar o processo/);
  assert.match(text, /1\. Cena 1 \(5s\)\nO que fazer: Close nas mãos\nFala: Tudo começa aqui\nTexto na tela: Estrutura antes de acelerar/);
  assert.match(text, /Legenda:\nLegenda pronta #marketing/);
  assert.match(text, /Próximo passo: Chame no Direct$/);
  assert.equal(blockToText(script().blocks[1], 1), '2. Cena 2\nTexto: Texto do slide');
  assert.equal(scriptsToText([script(), script({ id: 's2', title: 'Outro' })]).split('-'.repeat(24)).length, 2);
});

test('stories copy one by one or the whole day, skipping "nenhum" as a feature', () => {
  const story = { id: 'f', position: 2, goal: 'engage', format: 'photo', narrative: 'Pergunta do dia', scene: 'Foto do escritório', speech: '', onScreen: 'Qual seu maior desafio?', tool: 'caixa de perguntas' };
  assert.match(storyToText(story), /^Story 2 \(Engajar\)\nFormato: Foto\nPergunta do dia/);
  assert.match(storyToText(story), /Recursos do Instagram: caixa de perguntas/);
  assert.doesNotMatch(storyToText({ ...story, tool: 'nenhum' }), /Recursos/);
  const day = { id: 'd', date: '2026-10-13', routine: '', requestedCount: 1, stories: [story] };
  assert.match(storiesDayToText(day), /^Stories de terça-feira, 13\/10\n\nStory 2/);
});

test('new content starts as "gerado" and the status survives validation', () => {
  const output = JSON.stringify(script());
  const next = applyWorkspaceResult(emptyWorkspace(), 'content_script', { workspace: emptyWorkspace(), origin: { kind: 'idea', id: 'i1' } }, { output, versionId: 'v1' });
  assert.equal(next.scripts[0].status, 'generated');
  assert.ok(next.scripts[0].createdAt);
  assert.equal(scriptSchema.safeParse({ ...script(), status: 'posted', postedAt: '2026-10-15T12:00:00Z' }).success, true);
  assert.equal(scriptSchema.safeParse({ ...script(), status: 'archived' }).success, false);
});
