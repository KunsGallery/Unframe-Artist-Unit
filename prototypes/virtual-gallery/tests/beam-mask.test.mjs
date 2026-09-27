import test from 'node:test';
import assert from 'node:assert/strict';
import { beamAlphaAt } from '../src/beam-mask.js';

test('both beams illuminate their center without a rectangular cutout', () => {
  assert.equal(beamAlphaAt('circle', 0, 0), 165);
  assert.equal(beamAlphaAt('square', 0, 0), 165);
});

test('square corners remain lit where a circular beam has faded out', () => {
  assert.ok(beamAlphaAt('square', 0.7, 0.7) > 100);
  assert.ok(beamAlphaAt('circle', 0.7, 0.7) < 1);
  assert.equal(beamAlphaAt('square', 1, 0), 0);
  assert.equal(beamAlphaAt('circle', 1, 0), 0);
});
