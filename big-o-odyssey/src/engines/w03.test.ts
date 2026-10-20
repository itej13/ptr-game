import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as E from './expr';
import { randomTree, toInfix } from './exprgen';
import { hanoiMoves, factorial, hanoiFrames, factorialFrames } from './recursion';
import * as Q from './stackq';

describe('Polish notation', () => {
  it('stack conversions == expression-tree traversals', () => {
    const rng = new Rng(11);
    for (let t = 0; t < 4000; t++) {
      const tree = randomTree(rng, rng.int(1, 5), () => rng.pick([...'abcdefgh']));
      const s = toInfix(tree, rng);
      if (s.length <= 32) expect(E.validateInfix(s), s).toBeNull();
      const parsed = E.parseInfix(s);
      expect(E.postorder(parsed), s).toBe(E.postorder(tree));
      expect(E.toPostfix(s), s).toBe(E.postorder(tree));
      expect(E.toPrefix(s), s).toBe(E.preorder(tree));
    }
  });
  it('textbook examples', () => {
    expect(E.toPostfix('a+b*c-(d/e^f^g)*h')).toBe('abc*+defg^^/h*-');
    expect(E.toPrefix('a+b*c-(d/e^f^g)*h')).toBe('-+a*bc*/d^e^fgh');
    expect(E.toPostfix('a-b-c')).toBe('ab-c-');
    expect(E.toPrefix('a-b-c')).toBe('--abc');
    expect(E.toPostfix('a^b^c')).toBe('abc^^');
    expect(E.toPrefix('a^b^c')).toBe('^a^bc');
    expect(E.evalPostfix('23*54*+9-')).toBe(17);
    expect(E.evalPostfix('93/')).toBe(3);
    expect(E.evalPostfix('73-2/')).toBe(2);
  });
  it('postfix and prefix of the same tree evaluate equally', () => {
    const rng = new Rng(12);
    for (let t = 0; t < 2000; t++) {
      const tree = randomTree(rng, 3, () => String(rng.int(1, 9)));
      const strip = (n: E.ENode): E.ENode => (n.l ? { v: n.v === '^' ? '*' : n.v, l: strip(n.l), r: strip(n.r!) } : n);
      const tr = strip(tree);
      const a = E.evalPostfix(E.postorder(tr));
      const b = E.evalPrefix(E.preorder(tr));
      expect(a).toBe(b);
    }
  });
  it('validateInfix rejects malformed input', () => {
    for (const bad of ['', 'a+', '+a', 'ab', '(a+b', 'a+b)', '()', 'a+(-b)', 'a b']) expect(E.validateInfix(bad), bad).not.toBeNull();
  });
});

describe('recursion', () => {
  it('hanoi makes 2^n − 1 legal moves', () => {
    for (let n = 0; n <= 10; n++) {
      const mv = hanoiMoves(n);
      expect(mv.length).toBe(2 ** n - 1);
      const pegs: Record<string, number[]> = { A: Array.from({ length: n }, (_, i) => n - i), B: [], C: [] };
      for (const [d, f, t] of mv) {
        expect(pegs[f].pop()).toBe(d);
        if (pegs[t].length) expect(pegs[t][pegs[t].length - 1]).toBeGreaterThan(d);
        pegs[t].push(d);
      }
      expect(pegs.C.length).toBe(n);
    }
    expect(hanoiFrames(3).filter((f) => f.line === 'move').length).toBe(7);
  });
  it('factorial', () => {
    expect(factorial(5)).toBe(120);
    expect(factorialFrames(4).at(-1)!.vars!.result).toBe(24);
  });
});

describe('queues', () => {
  it('circular queue holds MAX − 1 and wraps', () => {
    const ops: Q.Op[] = [...Array(9)].map((_, i) => ({ op: 'enq', x: i }) as Q.Op);
    const r = Q.runCircular(ops, 8);
    expect(r.full).toBe(2);
    expect(r.contents).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it('circular queue == reference FIFO when not full', () => {
    const rng = new Rng(13);
    for (let t = 0; t < 2000; t++) {
      const ops: Q.Op[] = Array.from({ length: rng.int(1, 30) }, () => (rng.chance(0.55) ? { op: 'enq', x: rng.int(0, 99) } : { op: 'deq' }));
      const ref: number[] = [];
      const outs: number[] = [];
      for (const o of ops) {
        if (o.op === 'enq') {
          if (ref.length < 7) ref.push(o.x);
        } else outs.push(ref.length ? ref.shift()! : -1);
      }
      const r = Q.runCircular(ops, 8);
      expect(r.outputs).toEqual(outs);
      expect(r.contents).toEqual(ref);
    }
  });
  it('array PQ deleteMax returns the maximum', () => {
    const rng = new Rng(14);
    for (let t = 0; t < 2000; t++) {
      const ops: Q.Op[] = Array.from({ length: rng.int(1, 20) }, () => (rng.chance(0.6) ? { op: 'ins', x: rng.int(0, 50) } : { op: 'del' }));
      const ref: number[] = [];
      const outs: number[] = [];
      for (const o of ops) {
        if (o.op === 'ins') ref.push(o.x);
        else if (!ref.length) outs.push(-1);
        else {
          const m = Math.max(...ref);
          ref.splice(ref.indexOf(m), 1);
          outs.push(m);
        }
      }
      expect(Q.runPQ(ops, 100).outputs).toEqual(outs);
    }
  });
});
