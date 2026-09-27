import test from 'node:test';
import assert from 'node:assert/strict';
import { completeStrategySave } from '../src/lib/complete-strategy-save.ts';

test('failed save never records usage', async () => {
  let charged = false;
  await assert.rejects(completeStrategySave(async () => { throw new Error('storage failed'); },
    async () => { charged = true; }), /storage failed/);
  assert.equal(charged, false);
});

test('usage is recorded only after save resolves', async () => {
  const calls = [];
  await completeStrategySave(async () => { calls.push('save'); }, async () => { calls.push('usage'); });
  assert.deepEqual(calls, ['save', 'usage']);
});

test('usage failure propagates to keep confirmation dialog retryable', async () => {
  await assert.rejects(completeStrategySave(async () => {}, async () => { throw new Error('usage failed'); }), /usage failed/);
});
