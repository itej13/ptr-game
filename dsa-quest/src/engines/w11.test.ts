import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as DP from './dp';

const perms = (a: number[]): number[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));

describe('DP == brute force', () => {
  it('rod cutting: CLRS table and exhaustive cut patterns', () => {
    const clrs = [0, 1, 5, 8, 9, 10, 17, 17, 20, 24, 30];
    expect(DP.rodCut(clrs, 10).r).toEqual([0, 1, 5, 8, 10, 13, 17, 18, 22, 25, 30]);
    const rng = new Rng(91);
    for (let t = 0; t < 300; t++) {
      const n = rng.int(1, 10);
      const price = [0, ...rng.ints(n, 1, 25)];
      const brute = (len: number): number => (len === 0 ? 0 : Math.max(...Array.from({ length: len }, (_, i) => price[i + 1] + brute(len - i - 1))));
      const r = DP.rodCut(price, n);
      expect(r.r[n]).toBe(brute(n));
      expect(DP.rodPieces(r.s, n).reduce((s, p) => s + price[p], 0)).toBe(r.r[n]);
    }
  });
  it('matrix chain: CLRS example and brute force over parenthesisations', () => {
    expect(DP.matrixChain([30, 35, 15, 5, 10, 20, 25])).toMatchObject({ cost: 15125, parens: '((A1(A2A3))((A4A5)A6))' });
    const rng = new Rng(92);
    for (let t = 0; t < 300; t++) {
      const p = rng.ints(rng.int(2, 7), 1, 20);
      const best = (i: number, j: number): number => (i === j ? 0 : Math.min(...Array.from({ length: j - i }, (_, k) => best(i, i + k) + best(i + k + 1, j) + p[i - 1] * p[i + k] * p[j])));
      expect(DP.matrixChain(p).cost).toBe(best(1, p.length - 1));
    }
  });
  it('LCS: CLRS example; traced sequence is common and of maximal length', () => {
    expect(DP.lcs('ABCBDAB', 'BDCABA')).toMatchObject({ len: 4, seq: 'BCBA' });
    const isSub = (s: string, t: string) => {
      let i = 0;
      for (const c of t) if (c === s[i]) i++;
      return i === s.length;
    };
    const rng = new Rng(93);
    for (let t = 0; t < 400; t++) {
      const w = () => Array.from({ length: rng.int(0, 8) }, () => 'ABC'[rng.int(0, 2)]).join('');
      const a = w();
      const b = w();
      const r = DP.lcs(a, b);
      expect(isSub(r.seq, a) && isSub(r.seq, b)).toBe(true);
      let best = 0;
      for (let mask = 0; mask < 1 << a.length; mask++) {
        const s = [...a].filter((_, i) => mask & (1 << i)).join('');
        if (s.length > best && isSub(s, b)) best = s.length;
      }
      expect(r.len).toBe(best);
    }
  });
  it('edit distance: classic examples and a recursive reference', () => {
    expect(DP.editDistance('kitten', 'sitting').dist).toBe(3);
    expect(DP.editDistance('sunday', 'saturday').dist).toBe(3);
    const rng = new Rng(94);
    for (let t = 0; t < 400; t++) {
      const w = () => Array.from({ length: rng.int(0, 6) }, () => 'AB'[rng.int(0, 1)]).join('');
      const a = w();
      const b = w();
      const memo = new Map<string, number>();
      const rec = (i: number, j: number): number => {
        const k = `${i},${j}`;
        if (memo.has(k)) return memo.get(k)!;
        const v = i === 0 ? j : j === 0 ? i : a[i - 1] === b[j - 1] ? rec(i - 1, j - 1) : 1 + Math.min(rec(i - 1, j), rec(i, j - 1), rec(i - 1, j - 1));
        memo.set(k, v);
        return v;
      };
      expect(DP.editDistance(a, b).dist).toBe(rec(a.length, b.length));
    }
  });
  it('0/1 knapsack == subset brute force; traced items are feasible and optimal', () => {
    const rng = new Rng(95);
    for (let t = 0; t < 500; t++) {
      const n = rng.int(1, 8);
      const wt = rng.ints(n, 1, 12);
      const val = rng.ints(n, 1, 30);
      const W = rng.int(0, 30);
      let best = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        let w = 0;
        let v = 0;
        for (let i = 0; i < n; i++) if (mask & (1 << i)) ((w += wt[i]), (v += val[i]));
        if (w <= W) best = Math.max(best, v);
      }
      const r = DP.knapsack01(W, wt, val);
      expect(r.best).toBe(best);
      expect(r.chosen.reduce((s, i) => s + wt[i], 0)).toBeLessThanOrEqual(W);
      expect(r.chosen.reduce((s, i) => s + val[i], 0)).toBe(best);
    }
  });
  it('Held–Karp TSP == permutation brute force; tour cost matches', () => {
    const rng = new Rng(96);
    for (let t = 0; t < 300; t++) {
      const n = rng.int(2, 6);
      const d = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) d[i][j] = rng.int(1, 20);
      const best = Math.min(...perms([...Array(n).keys()].slice(1)).map((p) => [0, ...p, 0].reduce((s, v, k, arr) => (k ? s + d[arr[k - 1]][v] : 0), 0)));
      const r = DP.tsp(d);
      expect(r.cost).toBe(best);
      expect(r.tour.reduce((s, v, k, arr) => (k ? s + d[arr[k - 1]][v] : 0), 0)).toBe(best);
    }
  });
  it('Floyd–Warshall == repeated Bellman–Ford style relaxation', () => {
    const rng = new Rng(97);
    for (let t = 0; t < 300; t++) {
      const n = rng.int(1, 6);
      const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 0 : rng.chance(0.5) ? rng.int(0, 9) : Infinity)));
      const D = DP.floydWarshall(M);
      for (let s = 0; s < n; s++) {
        const dist = M[s].slice();
        for (let r = 0; r < n; r++) for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) if (dist[u] + M[u][v] < dist[v]) dist[v] = dist[u] + M[u][v];
        expect(D[s]).toEqual(dist);
      }
    }
  });
});
