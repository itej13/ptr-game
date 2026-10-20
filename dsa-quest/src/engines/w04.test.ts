import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as Li from './lists';

describe('linked list frame builders end in the model state', () => {
  const labels = (f: { scene: { nodes: { id: string; shape?: string; label?: string | number; y: number }[] } }) =>
    f.scene.nodes.filter((n) => n.shape === 'rect' && n.y === 110).sort((a, b) => (a as never as { x: number }).x - (b as never as { x: number }).x).map((n) => n.label);
  it('singly', () => {
    const rng = new Rng(21);
    for (let t = 0; t < 400; t++) {
      const init = rng.ints(rng.int(0, 4), 0, 9);
      const ops: Li.SllOp[] = Array.from({ length: rng.int(1, 6) }, () => {
        const r = rng.int(0, 4);
        const x = rng.int(0, 9);
        return r === 0 ? { k: 'b', x } : r === 1 ? { k: 'e', x } : r === 2 ? { k: 'a', pos: rng.int(0, 6), x } : r === 3 ? { k: 'd', x } : { k: 's', x };
      });
      const want = Li.runSLL([...init.map((x) => ({ k: 'e', x }) as Li.SllOp), ...ops]).list;
      const fr = Li.sllFrames(init, ops);
      expect(labels(fr[fr.length - 1] as never)).toEqual(want);
    }
  });
  it('circular and doubly', () => {
    const rng = new Rng(22);
    for (let t = 0; t < 400; t++) {
      const init = rng.ints(rng.int(0, 4), 0, 9);
      const cops: Li.CllOp[] = Array.from({ length: rng.int(1, 6) }, () => (rng.chance(0.3) ? { k: 'd' } : { k: rng.pick(['f', 'e'] as const), x: rng.int(0, 9) }));
      const cf = Li.cllFrames(init, cops);
      expect(labels(cf[cf.length - 1] as never)).toEqual(Li.runCLL([...init.map((x) => ({ k: 'e', x }) as Li.CllOp), ...cops]).list);
      const dops: Li.DllOp[] = Array.from({ length: rng.int(1, 6) }, () => {
        const r = rng.int(0, 3);
        return r === 0 ? { k: 'b', x: rng.int(0, 9) } : r === 1 ? { k: 'e', x: rng.int(0, 9) } : r === 2 ? { k: 'a', pos: rng.int(0, 5), x: rng.int(0, 9) } : { k: 'd', pos: rng.int(0, 5) };
      });
      const df = Li.dllFrames(init, dops);
      expect(labels(df[df.length - 1] as never)).toEqual(Li.runDLL([...init.map((x) => ({ k: 'e', x }) as Li.DllOp), ...dops]));
    }
  });
  it('polynomial addition == coefficient-map reference', () => {
    const rng = new Rng(23);
    for (let t = 0; t < 2000; t++) {
      const poly = (): Li.Poly => rng.distinct(rng.int(0, 6), 0, 8).sort((x, y) => y - x).map((e) => [rng.int(-4, 4) || 1, e]);
      const a = poly();
      const b = poly();
      const m = new Map<number, number>();
      for (const [c, e] of [...a, ...b]) m.set(e, (m.get(e) ?? 0) + c);
      const ref = [...m.entries()].filter(([, c]) => c !== 0).sort((x, y) => y[0] - x[0]).map(([e, c]) => [c, e]);
      expect(Li.addPoly(a, b)).toEqual(ref);
    }
    expect(Li.polyStr([[3, 4], [-2, 1], [5, 0]])).toBe('3x^4 − 2x + 5');
  });
});
