import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as BT from './bt';
import { knapsack01 } from './dp';

describe('backtracking and branch & bound', () => {
  it('N-Queens counts 1, 0, 0, 2, 10, 4, 40, 92 and every solution is valid', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((n) => BT.nQueens(n).length)).toEqual([1, 0, 0, 2, 10, 4, 40, 92]);
    for (const s of BT.nQueens(8))
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) expect(s[i] !== s[j] && Math.abs(s[i] - s[j]) !== j - i).toBe(true);
    expect(BT.nQueens(8)[0]).toEqual([0, 4, 7, 5, 2, 6, 1, 3]);
  });
  it("sum of subsets: Sahni's example and brute force", () => {
    expect(BT.sumOfSubsets([5, 10, 12, 13, 15, 18], 30).map((s) => s.join(''))).toEqual(['110010', '101100', '001001']);
    const rng = new Rng(101);
    for (let t = 0; t < 1500; t++) {
      const n = rng.int(1, 9);
      const w = rng.ints(n, 1, 15).sort((a, b) => a - b);
      const m = rng.int(1, 40);
      const got = BT.sumOfSubsets(w, m).map((s) => s.join('')).sort();
      const want: string[] = [];
      for (let mask = 0; mask < 1 << n; mask++) {
        const bits = [...Array(n).keys()].map((i) => (mask >> i) & 1);
        if (bits.reduce((s, b, i) => s + b * w[i], 0) === m) want.push(bits.join(''));
      }
      expect(got).toEqual(want.sort());
    }
  });
  it('backtracking knapsack and FIFO / LIFO / LC branch-and-bound all equal the DP optimum', () => {
    const rng = new Rng(102);
    for (let t = 0; t < 1200; t++) {
      const n = rng.int(1, 8);
      const wt = rng.ints(n, 1, 15);
      const val = rng.ints(n, 1, 40);
      const W = rng.int(0, 40);
      const opt = knapsack01(W, wt, val).best;
      const s = BT.sortByRatio(wt, val);
      expect(BT.bknap(W, s.wt, s.val).best).toBe(opt);
      for (const st of ['FIFO', 'LIFO', 'LC'] as const) expect(BT.branchAndBound(W, s.wt, s.val, st, false).best).toBe(opt);
    }
  });
  it('bounds: ub ≥ optimum ≥ lb at the root', () => {
    const rng = new Rng(103);
    for (let t = 0; t < 1000; t++) {
      const n = rng.int(1, 8);
      const wt = rng.ints(n, 1, 15);
      const val = rng.ints(n, 1, 40);
      const W = rng.int(0, 40);
      const s = BT.sortByRatio(wt, val);
      const opt = knapsack01(W, wt, val).best;
      expect(BT.fracBound(0, 0, 0, W, s.wt, s.val) + 1e-9).toBeGreaterThanOrEqual(opt);
      expect(BT.greedyFill(0, 0, 0, W, s.wt, s.val)).toBeLessThanOrEqual(opt);
    }
  });
});
