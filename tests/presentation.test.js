import assert from 'node:assert/strict';
import { fitLabel, fitDelta, isTopTie } from '../dist/presentation.js';

assert.equal(fitLabel(96), 'Excellent');
assert.equal(fitLabel(90), 'Very strong');
assert.equal(fitLabel(84), 'Strong');
assert.equal(fitLabel(75), 'Good');
assert.equal(fitLabel(60), 'Fair');

assert.equal(fitDelta(6), 'Stronger');
assert.equal(fitDelta(2), 'Similar');
assert.equal(fitDelta(-5), 'Weaker');

const top = { rank: .812, quality: 91 };
assert.equal(isTopTie(top, top), true);
assert.equal(isTopTie({ rank: .810, quality: 90 }, top), true);
assert.equal(isTopTie({ rank: .805, quality: 91 }, top), false);
assert.equal(isTopTie({ rank: .811, quality: 88 }, top), false);

console.log('Presentation rules passed.');
