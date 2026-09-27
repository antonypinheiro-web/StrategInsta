import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyBriefing, normalizeBaseline, normalizeAttachmentReferences, normalizeBriefing, selectObjective, validateBriefingStep, toStrategyInput, readBriefingDraft, saveBriefingDraft } from '../src/lib/briefing.ts';

const complete = { ...emptyBriefing, brandName: 'Marca de teste', niche: 'Cerâmica', audience: 'Pessoas que decoram a casa', productsAndServices: 'Vasos', desiredPostingFrequency: '2x_semana', instagramProficiencyLevel: 'iniciante',
  differentiators: 'Feitos à mão, com argila local', customerProblem: 'Decorar com peças artesanais', mainObstacle: 'Pouco tempo', conversionDestination: 'Conversar pelo Direct', weeklyTime: '1 a 3 horas' };
test('required data is validated across all steps, without inventing a posting capacity', () => {
  assert.ok(validateBriefingStep(emptyBriefing, 0).niche);
  assert.ok(validateBriefingStep(emptyBriefing, 3).desiredPostingFrequency);
  assert.throws(() => toStrategyInput(emptyBriefing));
  assert.equal(toStrategyInput(selectObjective(complete, 'leads')).goals, 'Gerar pedidos de orçamento');
});
test('unknown objective is explicit; old custom goals and optional fields survive normalization', () => {
  const legacy = normalizeBriefing({ ...complete, goals: 'Lançar meu serviço', funnelFocus: 'bottom', brandVoice: 'Direto' });
  assert.equal(legacy.primaryObjective, 'custom');
  assert.equal(toStrategyInput(legacy).brandVoice, 'Direto');
  assert.match(toStrategyInput(selectObjective(complete, 'undecided')).goals, /hipótese/);
});
test('optional username, known username cleanup and new strategy context survive conversion', () => {
  assert.ok(validateBriefingStep({ ...complete, brandName: '', username: ' @ ' }, 0).brandName);
  assert.equal(toStrategyInput(selectObjective(complete, 'sales')).username, '');
  const input = toStrategyInput(selectObjective({ ...complete, username: ' @teste ', successSignal: 'Orçamentos', mainObstacle: 'Pouco tempo' }, 'leads'));
  assert.equal(input.username, 'teste');
  assert.equal(input.successSignal, 'Orçamentos');
  assert.equal(input.mainObstacle, 'Pouco tempo');
});
test('draft is account-scoped, restores step, and never stores attachments or unknown properties', () => {
  const map = new Map();
  const storage = { getItem: (k) => map.get(k), setItem: (k, v) => map.set(k, v) };
  saveBriefingDraft(storage, 'alice', { ...complete, files: ['private.pdf'], injected: true }, 2);
  assert.equal(readBriefingDraft(storage, 'alice').step, 2);
  assert.equal(readBriefingDraft(storage, 'bob'), null);
  assert.equal(readBriefingDraft(storage), null);
  assert.equal(readBriefingDraft(storage, 'alice').data.files, undefined);
  assert.equal(readBriefingDraft(storage, 'alice').data.injected, undefined);
});
test('malformed drafts fail safely and failed storage never reports success', () => {
  assert.equal(readBriefingDraft({ getItem: () => '{invalid' }, 'alice'), null);
  assert.equal(readBriefingDraft({ getItem: () => { throw Error('blocked'); } }, 'alice'), null);
  assert.equal(normalizeBriefing({ desiredPostingFrequency: 'invented' }).desiredPostingFrequency, '');
  assert.throws(() => saveBriefingDraft({ setItem: () => { throw Error('full'); } }, 'alice', complete, 0), /full/);
});

test('business facts and explicit unknowns survive normalization without inventing proof', () => {
  const input = toStrategyInput(selectObjective({ ...complete, differentiators: 'Preciso descobrir meu diferencial.', availableProof: '',
    serviceArea: 'Curitiba e região', recordingComfort: 'Prefiro narrar', capacityToServe: '10 pedidos por semana', currentBio: 'Cerâmica artesanal' }, 'sales'));
  assert.equal(input.availableProof, '');
  assert.equal(input.serviceArea, 'Curitiba e região');
  assert.equal(input.capacityToServe, '10 pedidos por semana');
  assert.ok(validateBriefingStep({ ...complete, differentiators: '' }, 0).differentiators);
  assert.ok(validateBriefingStep({ ...complete, customerProblem: '' }, 1).customerProblem);
  assert.ok(validateBriefingStep({ ...complete, conversionDestination: '' }, 2).conversionDestination);
});

test('manual baseline preserves missing metrics and rejects forged automatic sources or inverted periods', () => {
  const value = { source: 'manual', sourceDescription: 'Insights do Instagram', capturedAt: '2026-09-10', periodStart: '2026-08-01', periodEnd: '2026-08-31',
    timezone: 'America/Sao_Paulo', metrics: { followers: 0, reach: 450, sales: -1, leads: '8', websiteClicks: null } };
  const normalized = normalizeBaseline(value);
  assert.deepEqual(normalized.metrics, { followers: 0, reach: 450 });
  assert.equal(normalizeBaseline({ ...value, source: 'meta_api' }), undefined);
  assert.equal(normalizeBaseline({ ...value, periodStart: '2026-09-01' }), undefined);
  assert.equal(normalizeBaseline({ ...value, sourceDescription: '' }), undefined);
  assert.equal(normalizeBaseline({ ...value, capturedAt: '2026-02-30' }), undefined);
  assert.equal(normalizeBaseline({ ...value, periodEnd: undefined }), undefined);
  assert.equal(normalizeBaseline({ ...value, periodStart: undefined, periodEnd: undefined }), undefined);
  assert.deepEqual(normalizeBaseline({ ...value, periodStart: undefined, periodEnd: undefined, metrics: { followers: 12 } }).metrics, { followers: 12 });
});

test('only reviewed private attachment references enter the briefing; originals and raw text never enter the draft', () => {
  const attachment = { id: 'document-1', name: 'briefing.txt', kind: 'txt', size: 100, sha256: 'a'.repeat(64), storagePath: 'alice/business/doc.txt',
    summary: 'Oferta artesanal confirmada pelo usuário.', reviewedAt: '2026-09-10T12:00:00Z', extraction: 'text', limited: false, rawText: 'Not for prompts', file: 'binary' };
  assert.equal(normalizeAttachmentReferences([attachment, attachment]).length, 1);
  assert.equal(normalizeAttachmentReferences([{ ...attachment, storagePath: '' }]).length, 0);
  assert.equal(normalizeAttachmentReferences([{ ...attachment, reviewedAt: '' }]).length, 0);
  const map = new Map();
  saveBriefingDraft({ setItem: (key, value) => map.set(key, value) }, 'alice', { ...complete, attachments: [attachment] }, 4);
  const stored = readBriefingDraft({ getItem: (key) => map.get(key) }, 'alice').data.attachments[0];
  assert.equal(stored.summary, attachment.summary);
  assert.equal(stored.rawText, undefined);
  assert.equal(stored.file, undefined);
});
