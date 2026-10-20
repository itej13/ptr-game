import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import { memoryOrder, addressByEnumeration, addressByFormula, count } from './memory';
import * as A from './arrays';
import * as S from './strings';

describe('memory addressing', () => {
  it('formula == enumeration for random 1-D..4-D arrays, both orders', () => {
    const rng = new Rng(1);
    for (let t = 0; t < 2000; t++) {
      const d = rng.int(1, 4);
      const b = Array.from({ length: d }, () => {
        const l = rng.int(-5, 5);
        return [l, l + rng.int(0, 4)] as [number, number];
      });
      const at = b.map(([l, u]) => rng.int(l, u));
      const major = rng.pick(['row', 'col'] as const);
      const base = rng.int(0, 5000);
      const w = rng.int(1, 8);
      expect(addressByFormula(b, major, base, w, at)).toBe(addressByEnumeration(b, major, base, w, at));
    }
  });
  it('row-major 2x3 order', () => {
    expect(memoryOrder([[0, 1], [0, 2]], 'row')).toEqual([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]);
    expect(memoryOrder([[0, 1], [0, 2]], 'col')).toEqual([[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]]);
    expect(count([[1, 10], [1, 15]])).toBe(150);
  });
});

describe('searches', () => {
  it('binary / interpolation agree with indexOf semantics', () => {
    const rng = new Rng(2);
    for (let t = 0; t < 3000; t++) {
      const a = rng.ints(rng.int(1, 25), 0, rng.pick([10, 100])).sort((x, y) => x - y);
      const key = rng.int(-3, 103);
      for (const r of [A.binarySearch(a, key).idx, A.interpolationSearch(a, key).idx]) {
        if (a.includes(key)) expect(a[r]).toBe(key);
        else expect(r).toBe(-1);
      }
      expect(A.linearSearch(a, key).idx).toBe(a.indexOf(key));
    }
  });
  it('binary search never probes more than floor(log2 n) + 1 times, and that bound is reached', () => {
    for (let n = 1; n <= 200; n++) {
      const a = Array.from({ length: n }, (_, i) => 2 * i);
      let worst = 0;
      for (let key = -1; key <= 2 * n; key++) worst = Math.max(worst, A.binarySearch(a, key).probes.length);
      expect(worst).toBe(Math.floor(Math.log2(n)) + 1);
    }
  });
});

describe('simple sorts', () => {
  it('sort correctly; counts follow the textbook formulas', () => {
    const rng = new Rng(3);
    for (let t = 0; t < 2000; t++) {
      const a = rng.ints(rng.int(1, 15), 0, rng.pick([5, 100]));
      const want = [...a].sort((x, y) => x - y);
      const inv = a.reduce((s, x, i) => s + a.slice(i + 1).filter((y) => y < x).length, 0);
      const b = A.bubbleSort(a);
      const s = A.selectionSort(a);
      const ins = A.insertionSort(a);
      expect(b.sorted).toEqual(want);
      expect(s.sorted).toEqual(want);
      expect(ins.sorted).toEqual(want);
      expect(b.swaps.length).toBe(inv); // bubble sort swaps = inversions
      expect(ins.shifts).toBe(inv); // so do insertion-sort shifts
      expect(s.comps).toBe((a.length * (a.length - 1)) / 2); // selection: always n(n-1)/2
      expect(s.swaps.length).toBe(Math.max(0, a.length - 1));
    }
  });
  it('frames end sorted', () => {
    const a = [5, 1, 4, 2, 8];
    for (const fr of [A.bubbleFrames(a), A.selectionFrames(a), A.insertionFrames(a)]) {
      const last = fr[fr.length - 1].scene.nodes.filter((n) => n.shape === 'rect' && n.label !== undefined).map((n) => n.label);
      expect(last).toEqual([1, 2, 4, 5, 8]);
    }
  });
});

describe('strings', () => {
  it('naive and KMP agree with indexOf', () => {
    const rng = new Rng(4);
    const w = (k: number) => Array.from({ length: k }, () => 'ab'[rng.int(0, 1)]).join('');
    for (let t = 0; t < 5000; t++) {
      const text = w(rng.int(0, 20));
      const pat = w(rng.int(1, 5));
      expect(S.naiveMatch(text, pat).idx).toBe(text.indexOf(pat));
      expect(S.kmpSearch(text, pat)).toBe(text.indexOf(pat));
    }
  });
  it('lps matches brute force', () => {
    const rng = new Rng(5);
    for (let t = 0; t < 2000; t++) {
      const p = Array.from({ length: rng.int(1, 12) }, () => 'abc'[rng.int(0, 2)]).join('');
      const brute = [...p].map((_, i) => {
        const s = p.slice(0, i + 1);
        for (let L = i; L > 0; L--) if (s.slice(0, L) === s.slice(s.length - L)) return L;
        return 0;
      });
      expect(S.lps(p)).toEqual(brute);
    }
  });
});
