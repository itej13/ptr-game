import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as T from './trees';

describe('binary tree facts', () => {
  it('n0 = n2 + 1 and E = I + 2n', () => {
    const rng = new Rng(41);
    for (let t = 0; t < 3000; t++) {
      const tr = T.randomTree(rng, rng.int(0, 25));
      const [n0, , n2] = T.degrees(tr);
      if (tr) expect(n0).toBe(n2 + 1);
      const { I, E, n } = T.pathLengths(tr);
      expect(E).toBe(I + 2 * n);
      expect(n).toBe(T.countNodes(tr));
    }
  });
  it('rebuild from inorder + preorder / postorder', () => {
    const rng = new Rng(42);
    for (let t = 0; t < 2000; t++) {
      const vals = rng.shuffle([...Array(rng.int(0, 14)).keys()].map((x) => x + 1));
      let k = 0;
      const tr = T.randomTree({ int: rng.int.bind(rng), chance: rng.chance.bind(rng) }, vals.length);
      const relabel = (x: T.TN | null): void => {
        if (!x) return;
        x.v = vals[k++];
        relabel(x.left);
        relabel(x.right);
      };
      relabel(tr);
      expect(T.serialise(T.fromInPre(T.inorder(tr), T.preorder(tr)))).toBe(T.serialise(tr));
      expect(T.serialise(T.fromInPost(T.inorder(tr), T.postorder(tr)))).toBe(T.serialise(tr));
    }
  });
});

describe('BST', () => {
  it('insert/delete keep the BST property and the key set', () => {
    const rng = new Rng(43);
    for (let t = 0; t < 2000; t++) {
      const keys = rng.ints(rng.int(1, 20), 1, 50);
      let r = T.bstFrom(keys);
      const set = new Set(keys);
      for (const d of rng.ints(rng.int(1, 8), 1, 50)) {
        r = T.bstDelete(r, d);
        set.delete(d);
        expect(T.bstInorder(r)).toEqual([...set].sort((a, b) => a - b));
      }
    }
  });
});

describe('heaps', () => {
  it('build gives a heap, heap sort sorts, PQ returns maxima', () => {
    const rng = new Rng(44);
    for (let t = 0; t < 2000; t++) {
      const a = rng.ints(rng.int(0, 20), 0, 50);
      expect(T.isMaxHeap(T.buildHeap(a))).toBe(true);
      expect(T.heapSort(a)).toEqual([...a].sort((x, y) => x - y));
      const h: number[] = [];
      const ref: number[] = [];
      for (let k = 0; k < 20; k++) {
        if (rng.chance(0.6)) {
          const x = rng.int(0, 50);
          T.heapInsert(h, x);
          ref.push(x);
          expect(T.isMaxHeap(h)).toBe(true);
        } else if (h.length) {
          const m = Math.max(...ref);
          ref.splice(ref.indexOf(m), 1);
          expect(T.heapDeleteMax(h)).toBe(m);
          expect(T.isMaxHeap(h)).toBe(true);
        }
      }
    }
  });
  it('bottom-up build does at most 2n swaps-worth of work (O(n))', () => {
    for (let n = 1; n <= 512; n *= 2) {
      const log: [number, number][] = [];
      T.buildHeap([...Array(n).keys()], log); // ascending input = worst case for a max-heap
      expect(log.length).toBeLessThanOrEqual(2 * n);
    }
  });
});

describe('AVL', () => {
  it('stays balanced with correct heights after random inserts and deletes', () => {
    const rng = new Rng(45);
    for (let t = 0; t < 1500; t++) {
      let r: T.AVL | null = null;
      const set = new Set<number>();
      for (let k = 0; k < 30; k++) {
        const x = rng.int(1, 40);
        if (rng.chance(0.65)) {
          r = T.avlInsert(r, x);
          set.add(x);
        } else {
          r = T.avlDelete(r, x);
          set.delete(x);
        }
        expect(T.avlValid(r)).toBe(true);
        expect(T.avlIn(r)).toEqual([...set].sort((a, b) => a - b));
      }
    }
  });
  it('classic example 10,20,30,40,50,25', () => {
    const r = [10, 20, 30, 40, 50, 25].reduce<T.AVL | null>((x, k) => T.avlInsert(x, k), null);
    expect(T.avlPre(r)).toEqual([30, 20, 10, 25, 40, 50]);
  });
});

describe('B-tree', () => {
  for (const m of [3, 4, 5, 6]) {
    it(`order ${m}: invariants after random inserts and deletes`, () => {
      const rng = new Rng(46 + m);
      for (let t = 0; t < 600; t++) {
        let r = T.btFrom([], m);
        const set = new Set<number>();
        for (let k = 0; k < 40; k++) {
          const x = rng.int(1, 60);
          if (rng.chance(0.65)) {
            r = T.btInsert(r, x, m);
            set.add(x);
          } else {
            r = T.btDelete(r, x, m);
            set.delete(x);
          }
          expect(T.btValid(r, m).ok, T.btDump(r)).toBe(true);
          expect(T.btKeys(r)).toEqual([...set].sort((a, b) => a - b));
        }
      }
    });
  }
  it('textbook-style order-5 example', () => {
    expect(T.btDump(T.btFrom([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 5))).toBe('[30 60]([10 20][40 50][70 80 90 100])');
  });
});
