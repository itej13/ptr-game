import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as H from './hash';

describe('hash functions', () => {
  it('textbook examples', () => {
    // Lipschutz: mid-square on 3205, 7148, 2345 → 72, 93, 99
    expect([3205, 7148, 2345].map((k) => H.hMidSquare(k).addr)).toEqual([72, 93, 99]);
    // Horowitz–Sahni folding example: 12320324111220 in 3-digit parts
    expect(H.foldShift('12320324111220', 3)).toBe(699);
    expect(H.foldBoundary('12320324111220', 3)).toBe(897);
    expect(H.hDivision(1234, 13)).toBe(1234 % 13);
  });
  it('multiplication method matches floating point away from boundaries', () => {
    for (let k = 1; k < 5000; k++) {
      const m = 100;
      const x = k * 0.618034;
      const f = Math.floor(m * (x - Math.floor(x)) + 1e-9);
      expect(H.hMultiplication(k, m)).toBe(f);
    }
  });
});

describe('open addressing', () => {
  it('every stored key is found; table full when n > M', () => {
    const rng = new Rng(51);
    for (const scheme of ['linear', 'quadratic', 'double'] as const) {
      for (let t = 0; t < 800; t++) {
        const m = rng.pick([7, 11, 13]);
        const keys = rng.distinct(rng.int(1, m + 3), 0, 200);
        const r = H.openAddress(keys, m, scheme, 5);
        keys.forEach((k, i) => {
          if (r.placed[i]) expect(r.table[H.probeSearch(r.table, k, scheme, 5).slot]).toBe(k);
        });
        if (scheme === 'linear') expect(r.placed.filter(Boolean).length).toBe(Math.min(keys.length, m));
      }
    }
  });
  it('linear probing: first probe is k mod M', () => {
    expect(H.openAddress([22, 33, 44, 10, 11, 21, 32], 11, 'linear').table).toEqual([22, 33, 44, 11, 21, 32, null, null, null, null, 10]);
  });
});
