/**
 * Runs the compiled C++ harnesses (build/cpp, from scripts/verify-cpp.sh) on random inputs and checks
 * their output equals what the TypeScript engines — the ones that drive the animations and grade the
 * quizzes — produce. If these agree, the code you memorise is the code you watch.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { Rng } from './core/rng';
import { DRIVERS } from './crosscheck.drivers';

const CASES = 400;

describe('C++ snippets ≡ TypeScript engines', () => {
  for (const d of DRIVERS) {
    it(`${d.bin}: ${d.name}`, () => {
      const bin = `build/cpp/${d.bin}`;
      expect(existsSync(bin), `${bin} missing — run npm run verify:cpp`).toBe(true);
      const rng = new Rng(0xc0ffee ^ d.name.length * 977);
      const cases = Array.from({ length: CASES }, () => d.make(rng));
      const input = cases.map((c) => c.input).join('\n') + '\n';
      const out = execFileSync(bin, { input, encoding: 'utf8', maxBuffer: 64 << 20 }).split('\n');
      if (out[out.length - 1] === '') out.pop(); // keep empty answer lines, drop only the final newline
      expect(out.length).toBe(cases.length);
      cases.forEach((c, i) => expect(out[i].trim(), `input: ${c.input}`).toBe(c.expect.trim()));
    });
  }
});
