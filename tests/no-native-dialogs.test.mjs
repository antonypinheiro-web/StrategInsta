import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Embedded browsers (the desktop app pane) throw on window.prompt and silently aborted admin credit grants.
const files = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : /\.(tsx?|jsx?)$/.test(name) ? [path] : [];
});

test('the app uses the in-page dialog instead of window.prompt/confirm/alert', () => {
  const offenders = files('src').filter(path => /window\.(prompt|confirm|alert)\s*\(/.test(readFileSync(path, 'utf8')));
  assert.deepEqual(offenders, []);
});
