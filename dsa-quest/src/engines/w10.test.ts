import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as Gr from './greedy';
import { optimalMerge } from './sortx';

describe('greedy algorithms are optimal (vs brute force)', () => {
  it('fractional knapsack: CLRS example and ≥ every 0/1 subset', () => {
    expect(Gr.fractionalKnapsack(50, [{ value: 60, weight: 10 }, { value: 100, weight: 20 }, { value: 120, weight: 30 }]).total).toBe(240);
    const rng = new Rng(81);
    for (let t = 0; t < 1000; t++) {
      const items = Array.from({ length: rng.int(1, 7) }, () => ({ value: rng.int(1, 40), weight: rng.int(1, 20) }));
      const W = rng.int(0, 60);
      const g = Gr.fractionalKnapsack(W, items).total;
      for (let mask = 0; mask < 1 << items.length; mask++) {
        let v = 0;
        let w = 0;
        items.forEach((it, i) => mask & (1 << i) && ((v += it.value), (w += it.weight)));
        if (w <= W) expect(g + 1e-9).toBeGreaterThanOrEqual(v);
      }
    }
  });
  it('activity selection picks a maximum compatible set', () => {
    const rng = new Rng(82);
    for (let t = 0; t < 600; t++) {
      const n = rng.int(1, 9);
      const s = rng.ints(n, 0, 12);
      const f = s.map((x) => x + rng.int(1, 5));
      const ch = Gr.selectActivities(s, f);
      let best = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        const ids = [...Array(n).keys()].filter((i) => mask & (1 << i)).sort((a, b) => s[a] - s[b]);
        if (ids.every((id, k) => k === 0 || s[id] >= f[ids[k - 1]])) best = Math.max(best, ids.length);
      }
      expect(ch.length).toBe(best);
    }
  });
  it('job sequencing achieves the maximum profit', () => {
    const rng = new Rng(83);
    for (let t = 0; t < 600; t++) {
      const n = rng.int(1, 8);
      const d = rng.ints(n, 1, 4);
      const p = rng.ints(n, 1, 50);
      let best = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        const ids = [...Array(n).keys()].filter((i) => mask & (1 << i)).sort((a, b) => d[a] - d[b]);
        if (ids.every((id, k) => d[id] >= k + 1)) best = Math.max(best, ids.reduce((s2, i) => s2 + p[i], 0));
      }
      expect(Gr.jobSequencing(d, p).total).toBe(best);
    }
  });
  it('Huffman: CLRS codes, prefix-free, optimal weighted length', () => {
    expect(Gr.huffmanCodes([...'abcdef'], [45, 13, 12, 16, 9, 5])).toEqual({ a: '0', b: '101', c: '100', d: '111', e: '1101', f: '1100' });
    const rng = new Rng(84);
    for (let t = 0; t < 1000; t++) {
      const n = rng.int(1, 9);
      const cs = [...'abcdefghij'].slice(0, n);
      const fs = rng.ints(n, 1, 40);
      const codes = Object.values(Gr.huffmanCodes(cs, fs));
      for (const a of codes) for (const b of codes) if (a !== b) expect(b.startsWith(a)).toBe(false);
      if (n > 1) expect(Gr.weightedLength(cs, fs)).toBe(optimalMerge(fs).cost);
    }
  });
});
