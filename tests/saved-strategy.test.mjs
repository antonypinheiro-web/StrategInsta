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
  const row = fixture(); row.generated_strategy.storiesStrategy = [{ unexpected: true }];
  assert.throws(() => parseSavedStrategy(row, 'owner'), /incompletos/);
});
test('invalid historical dates do not break the saved strategy', () => {
  const row = fixture(); row.history[0].createdAt = 'invalid-date';
  assert.equal(parseSavedStrategy(row, 'owner').history.length, 0);
});
