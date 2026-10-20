import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as D from './dc';

describe('sorting', () => {
  it('merge sort and both quicksorts sort; merge sort comparisons ≤ n⌈log n⌉', () => {
    const rng = new Rng(31);
    for (let t = 0; t < 3000; t++) {
      const a = rng.ints(rng.int(0, 30), 0, rng.pick([3, 100]));
      const want = [...a].sort((x, y) => x - y);
      const m = D.mergeSort(a);
      expect(m.sorted).toEqual(want);
      if (a.length > 1) expect(m.comps).toBeLessThanOrEqual(a.length * Math.ceil(Math.log2(a.length)));
      expect(D.quickSort(a).sorted).toEqual(want);
      expect(D.quickSortLomuto(a).sorted).toEqual(want);
    }
  });
  it('first-pivot partition: left ≤ pivot < right', () => {
    const rng = new Rng(32);
    for (let t = 0; t < 5000; t++) {
      const a = rng.ints(rng.int(1, 20), 0, rng.pick([3, 100]));
      const p = a[0];
      const b = a.slice();
      const j = D.partitionHoareFirst(b, 0, b.length - 1);
      expect(b[j]).toBe(p);
      for (let k = 0; k < j; k++) expect(b[k]).toBeLessThanOrEqual(p);
      for (let k = j + 1; k < b.length; k++) expect(b[k]).toBeGreaterThan(p);
      expect([...b].sort((x, y) => x - y)).toEqual([...a].sort((x, y) => x - y));
    }
  });
  it('frames end sorted', () => {
    for (const a of [[38, 27, 43, 3, 9, 82, 10], [5, 5, 1, 5], [1], [3, 1]]) {
      for (const fr of [D.mergeSortFrames(a), D.quickSortFrames(a)]) {
        const last = fr[fr.length - 1].scene.nodes.filter((n) => n.shape === 'rect' && n.label !== undefined && n.y < 120).map((n) => n.label);
        expect(last).toEqual([...a].sort((x, y) => x - y));
      }
    }
  });
});

describe('master theorems', () => {
  const cases: [number, number, number, number, string][] = [
    [2, 2, 1, 0, 'Θ(n log n)'], // merge sort
    [1, 2, 0, 0, 'Θ(log n)'], // binary search
    [8, 2, 2, 0, 'Θ(n^3)'], // naive D&C matrix multiplication
    [7, 2, 2, 0, 'Θ(n^2.807)'], // Strassen
    [4, 2, 1, 0, 'Θ(n^2)'],
    [4, 2, 2, 0, 'Θ(n^2 log n)'],
    [4, 2, 3, 0, 'Θ(n^3)'],
    [3, 4, 2, 0, 'Θ(n^2)'],
    [2, 2, 1, 1, 'Θ(n log^2 n)'],
    [2, 2, 1, -1, 'Θ(n log log n)'],
    [2, 2, 1, -2, 'Θ(n)'],
    [1, 2, 1, 0, 'Θ(n)'],
    [9, 3, 1, 0, 'Θ(n^2)'],
    [16, 4, 2, 0, 'Θ(n^2 log n)'],
  ];
  for (const [a, b, k, p, want] of cases)
    it(`T(n) = ${a}T(n/${b}) + n^${k} log^${p} n → ${want}`, () => {
      expect(D.masterDividing(a, b, k, p).answer).toBe(want);
    });
  it('exact solutions agree with the theorem for textbook recurrences', () => {
    for (let m = 1; m <= 20; m++) {
      const n = 2 ** m;
      expect(D.evalDividing(2, 2, (x) => x, n)).toBe(n * m + n); // n log n + n
      expect(D.evalDividing(1, 2, () => 1, n)).toBe(m + 1); // log n + 1
      expect(D.evalDividing(4, 2, (x) => x, n)).toBe(2 * n * n - n); // 2n² − n
    }
    for (let n = 1; n <= 30; n++) {
      expect(D.evalDecreasing(1, 1, (x) => x, n)).toBe((n * (n + 1)) / 2); // T(n)=T(n−1)+n
      expect(D.evalDecreasing(2, 1, () => 1, n)).toBe(2 ** n - 1); // T(n)=2T(n−1)+1, T(1)=1
    }
  });
  it('decreasing theorem strings', () => {
    expect(D.masterDecreasing(1, 1, 1)).toBe('O(n^2)');
    expect(D.masterDecreasing(2, 1, 0)).toBe('O(2^n)');
    expect(D.masterDecreasing(2, 1, 1)).toBe('O(n · 2^n)');
    expect(D.masterDecreasing(3, 2, 0)).toBe('O(3^(n/2))');
  });
});

describe('Strassen', () => {
  it('7 products reproduce the ordinary product', () => {
    const rng = new Rng(33);
    for (let t = 0; t < 5000; t++) {
      const m = (): D.M2 => [[rng.int(-9, 9), rng.int(-9, 9)], [rng.int(-9, 9), rng.int(-9, 9)]];
      const A = m();
      const B = m();
      expect(D.strassen(A, B).C).toEqual(D.naiveMul(A, B));
    }
  });
});
