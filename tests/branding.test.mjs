import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url));
test('app and preview documents declare the versioned StrategInsta favicon', () => {
  for (const path of ['index.html', 'tests/ui/briefing.html', 'tests/ui/briefing-responsive.html', 'tests/ui/briefing-comparison.html']) {
    const html = read(path).toString();
    assert.match(html, /lang="pt-BR"/);
    assert.match(html, /href="\/favicon\.svg\?v=2"/);
    assert.match(html, /href="\/favicon\.ico\?v=2"/);
  }
});
test('ICO fallback embeds the same PNG as the StrategInsta raster asset', () => {
  const ico = read('public/favicon.ico');
  const png = read('public/favicon.png');
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 1);
  assert.equal(ico[6], 64);
  assert.equal(ico[7], 64);
  assert.equal(ico.readUInt32LE(14), png.length);
  assert.deepEqual(ico.subarray(ico.readUInt32LE(18)), png);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.match(read('public/favicon.svg').toString(), />SI<\/text>/);
});
test('current instructions and dependencies do not direct work through the former builder', () => {
  assert.doesNotMatch(read('README.md').toString(), /lovable\.dev|Use Lovable|Share -> Publish/i);
  assert.doesNotMatch(read('package.json').toString(), /lovable-tagger/);
  assert.doesNotMatch(read('vite.config.ts').toString(), /lovable-tagger/);
});
