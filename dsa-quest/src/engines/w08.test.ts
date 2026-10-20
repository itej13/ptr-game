import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as X from './sortx';

describe('radix sort', () => {
  it('CLRS example passes', () => {
    expect(X.radixPasses([170, 45, 75, 90, 802, 24, 2, 66])).toEqual([
      [170, 90, 802, 2, 24, 45, 75, 66],
      [802, 2, 24, 45, 66, 170, 75, 90],
      [2, 24, 45, 66, 75, 90, 170, 802],
    ]);
  });
  it('sorts', () => {
    const rng = new Rng(61);
    for (let t = 0; t < 2000; t++) {
      const a = rng.ints(rng.int(1, 20), 0, 9999);
      expect(X.radixPasses(a).at(-1) ?? a).toEqual([...a].sort((x, y) => x - y));
    }
  });
});

describe('replacement selection', () => {
  it('runs are sorted and partition the input', () => {
    const rng = new Rng(62);
    for (let t = 0; t < 3000; t++) {
      const inp = rng.ints(rng.int(0, 30), 0, 99);
      const m = rng.int(1, 5);
      const runs = X.replacementSelection(inp, m);
      for (const r of runs) for (let i = 1; i < r.length; i++) expect(r[i]).toBeGreaterThanOrEqual(r[i - 1]);
      expect(runs.flat().sort((a, b) => a - b)).toEqual([...inp].sort((a, b) => a - b));
      for (const r of runs.slice(0, -1)) expect(r.length).toBeGreaterThanOrEqual(m); // every run but the last is at least m long
    }
    expect(X.replacementSelection([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3, 4, 5, 6, 7]]);
    expect(X.replacementSelection([9, 8, 7, 6, 5, 4], 2)).toEqual([[8, 9], [6, 7], [4, 5]]);
  });
});

describe('optimal merge pattern', () => {
  const brute = (s: number[]): number => {
    if (s.length <= 1) return 0;
    let best = Infinity;
    for (let i = 0; i < s.length; i++)
      for (let j = i + 1; j < s.length; j++) {
        const rest = s.filter((_, k) => k !== i && k !== j);
        best = Math.min(best, s[i] + s[j] + brute([...rest, s[i] + s[j]]));
      }
    return best;
  };
  it('greedy == brute force', () => {
    const rng = new Rng(63);
    for (let t = 0; t < 300; t++) {
      const s = rng.ints(rng.int(1, 6), 1, 40);
      expect(X.optimalMerge(s).cost).toBe(brute(s));
    }
  });
  it('k-way passes', () => {
    expect(X.kWayPasses(16, 2)).toBe(4);
    expect(X.kWayPasses(16, 4)).toBe(2);
    expect(X.kWayPasses(100, 10)).toBe(2);
    expect(X.kWayPasses(1, 4)).toBe(0);
  });
});

describe('decision tree', () => {
  it('insertion sort on 3 items: 6 leaves, height 3, every leaf correct', () => {
    const t = X.insertionDecisionTree();
    expect(X.dtLeaves(t)).toBe(6);
    expect(X.dtHeight(t)).toBe(3);
    const perms: [number, number, number][] = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]];
    for (const p of perms) {
      const fr = X.decisionFrames(p);
      const leaf = /Leaf reached: (.*)\. Every/.exec(fr.at(-1)!.say)![1];
      const order = leaf.split(' ≤ ');
      const val: Record<string, number> = { a: p[0], b: p[1], c: p[2] };
      for (let i = 1; i < 3; i++) expect(val[order[i]]).toBeGreaterThan(val[order[i - 1]]);
    }
    expect(X.minCompLowerBound(5)).toBe(7);
    expect(X.minCompLowerBound(3)).toBe(3);
    expect(X.minCompLowerBound(4)).toBe(5);
  });
});
