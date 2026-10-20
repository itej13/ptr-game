import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as NP from './np';
import { randomGraph } from './graphs';

describe('NP examples', () => {
  it('circuits: C2 unsatisfiable, others satisfiable; frames end with the right output', () => {
    expect(NP.satisfyingAssignments(NP.CIRCUITS[1]).length).toBe(0);
    expect(NP.satisfyingAssignments(NP.CIRCUITS[0]).length).toBeGreaterThan(0);
    // C3 = (x1 xor x2) and x3
    expect(NP.satisfyingAssignments(NP.CIRCUITS[2])).toEqual([[0, 1, 1], [1, 0, 1]]);
    for (const c of NP.CIRCUITS)
      for (let m = 0; m < 1 << c.inputs.length; m++) {
        const bits = c.inputs.map((_, i) => (m >> i) & 1);
        const fr = NP.circuitFrames(c, bits);
        expect(fr.at(-1)!.say.startsWith(`Output = ${NP.circuitOut(c, bits)}`)).toBe(true);
      }
  });
  it('vertex cover: brute-force minimum ≤ 2-approx ≤ 2·minimum; complement is independent', () => {
    const rng = new Rng(111);
    for (let t = 0; t < 500; t++) {
      const g = randomGraph(rng, rng.int(2, 8), rng.int(1, 12));
      const min = NP.minVertexCover(g);
      const apx = NP.approxVertexCover(g);
      expect(NP.isVertexCover(g, min)).toBe(true);
      expect(NP.isVertexCover(g, apx)).toBe(true);
      expect(apx.length).toBeLessThanOrEqual(2 * min.length);
      expect(NP.isIndependent(g, [...Array(g.n).keys()].filter((v) => !min.includes(v)))).toBe(true);
    }
  });
  it('subset sum DP == brute force', () => {
    const rng = new Rng(112);
    for (let t = 0; t < 1500; t++) {
      const a = rng.ints(rng.int(1, 9), 1, 20);
      const target = rng.int(0, 60);
      expect(NP.subsetSumDP(a, target)).toBe(NP.subsetSumCount(a, target) > 0);
    }
  });
});
