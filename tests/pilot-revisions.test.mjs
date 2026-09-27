import test from 'node:test';
import assert from 'node:assert/strict';
import { stampEditedVersion } from '../src/lib/pilot-revisions.ts';

test('reopening a manual revision attributes feedback only to the edited version', () => {
  const original = { schemaVersion: 1, selectedMonetizationIds: [], scripts: [{ id: 'script-a', versionId: 'old-a' }, { id: 'script-b', versionId: 'old-b' }], overrides: {} };
  const next = stampEditedVersion(original, { kind: 'section', id: 'script-a' }, 'manual-revision');
  assert.equal(next.scripts[0].versionId, 'manual-revision');
  assert.equal(next.scripts[1].versionId, 'old-b');
  assert.equal(original.scripts[0].versionId, 'old-a');
});

test('restoring a story revision does not restamp the whole week', () => {
  const original = { schemaVersion: 1, selectedMonetizationIds: [], scripts: [], overrides: {}, storiesWeek: { days: [{ id: 'day-a', stories: [{ id: 'story-a', versionId: 'week-v1' }, { id: 'story-b', versionId: 'week-v1' }] }] } };
  const next = stampEditedVersion(original, { kind: 'story', id: 'story-a' }, 'story-v2');
  assert.equal(next.storiesWeek.days[0].stories[0].versionId, 'story-v2');
  assert.equal(next.storiesWeek.days[0].stories[1].versionId, 'week-v1');
  assert.equal(original.storiesWeek.days[0].stories[0].versionId, 'week-v1');
});
