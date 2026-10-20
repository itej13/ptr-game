import { describe, it, expect } from 'vitest';
import { LOOPS } from './loops';

describe('loop pattern formulas match literal execution', () => {
  for (const p of LOOPS) {
    it(p.id, () => {
      for (let n = 1; n <= (p.nested ? 300 : 5000); n++) expect(p.formula(n), `n=${n}`).toBe(p.run(n).length);
    });
  }
});
