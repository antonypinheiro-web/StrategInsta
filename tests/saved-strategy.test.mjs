import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSavedStrategy } from '../src/lib/saved-strategy.ts';

const fixture = () => ({
  id: 'saved-fixture', user_id: 'owner', name: 'Estratégia de teste', user_input: { niche: 'fixture', audience: 'fixture' },
  generated_strategy: { idealCustomerProfile: 'Perfil', monetizationIdeas: 'Ideias', instagramBio: 'Bio', storiesStrategy: [], contentTable: { topOfFunnel: [], middleOfFunnel: [], bottomOfFunnel: [] }, editorialCalendar: [], actionPlan: [] },
  history: [{ id: 'revision', title: 'Perfil', type: 'idealCustomerProfile', content: 'Perfil', createdAt: '2026-09-10T00:00:00Z' }],
});
test('reopens saved strategy and restores revision dates for history', () => {
  const restored = parseSavedStrategy(fixture(), 'owner');
  assert.equal(restored.name, 'Estratégia de teste');
  assert.equal(Object.keys(restored.strategy).length, 7);
  assert.ok(restored.history[0].createdAt instanceof Date);
  assert.equal(restored.history[0].createdAt.toISOString(), '2026-09-10T00:00:00.000Z');
});
test('foreign account and malformed saved content are rejected before rendering', () => {
  assert.throws(() => parseSavedStrategy(fixture(), 'other'), /conta/);
  // A malformed section never reaches the screen, but it no longer blocks the rest of the strategy.
  const row = fixture(); row.generated_strategy.storiesStrategy = [{ unexpected: true }];
  const parsed = parseSavedStrategy(row, 'owner');
  assert.equal(parsed.strategy.storiesStrategy, undefined);
  assert.equal(typeof parsed.strategy.idealCustomerProfile, 'string');
  const empty = fixture(); empty.generated_strategy = null;
  assert.throws(() => parseSavedStrategy(empty, 'owner'), /incompletos/);
});
test('a strategy saved part-way opens with its workspace (bug of 12/10)', () => {
  const row = fixture();
  row.generated_strategy = { idealCustomerProfile: 'Perfil', monetizationIdeas: 'Ideias', businessId: 'b1', generationId: 'g1',
    pilotWorkspace: { schemaVersion: 1, selectedMonetizationIds: [], scripts: [] } };
  const parsed = parseSavedStrategy(row, 'owner');
  assert.deepEqual(Object.keys(parsed.strategy).sort(), ['idealCustomerProfile', 'monetizationIdeas']);
  assert.equal(parsed.workspace.schemaVersion, 1);
  assert.equal(parsed.businessId, 'b1');
});
test('invalid historical dates do not break the saved strategy', () => {
  const row = fixture(); row.history[0].createdAt = 'invalid-date';
  assert.equal(parseSavedStrategy(row, 'owner').history.length, 0);
});
