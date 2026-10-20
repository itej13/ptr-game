/**
 * Loop patterns for step counting. `run` literally executes the loop, so every count the game
 * asks about is computed, not hand-typed. `formula` is the closed form we teach; loops.test.ts
 * checks formula === run for n = 1..300 (nested) or 1..5000.
 */
export interface LoopPattern {
  id: string;
  code: string; // C++ fragment; `count++` is the statement being counted
  /** returns the (i, j) values at each execution of count++ */
  run: (n: number) => [number, number?][];
  formula: (n: number) => number;
  formulaText: string;
  big: string; // Θ class
  nested: boolean;
}

const lg = (n: number, b: number) => {
  // floor(log_b n) exactly with integers
  let k = 0;
  for (let p = b; p <= n; p *= b) k++;
  return k;
};
const isqrt = (n: number) => {
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r--;
  while ((r + 1) * (r + 1) <= n) r++;
  return r;
};

export const LOOPS: LoopPattern[] = [
  {
    id: 'linear',
    code: 'for (int i = 1; i <= n; i++)\n    count++;',
    run: (n) => {
      const out: [number][] = [];
      for (let i = 1; i <= n; i++) out.push([i]);
      return out;
    },
    formula: (n) => n,
    formulaText: 'n',
    big: 'Θ(n)',
    nested: false,
  },
  {
    id: 'step3',
    code: 'for (int i = 1; i <= n; i += 3)\n    count++;',
    run: (n) => {
      const out: [number][] = [];
      for (let i = 1; i <= n; i += 3) out.push([i]);
      return out;
    },
    formula: (n) => Math.ceil(n / 3),
    formulaText: '⌈n/3⌉',
    big: 'Θ(n)',
    nested: false,
  },
  {
    id: 'double',
    code: 'for (int i = 1; i <= n; i *= 2)\n    count++;',
    run: (n) => {
      const out: [number][] = [];
      for (let i = 1; i <= n; i *= 2) out.push([i]);
      return out;
    },
    formula: (n) => lg(n, 2) + 1,
    formulaText: '⌊log₂ n⌋ + 1',
    big: 'Θ(log n)',
    nested: false,
  },
  {
    id: 'halve',
    code: 'for (int i = n; i >= 1; i /= 2)\n    count++;',
    run: (n) => {
      const out: [number][] = [];
      for (let i = n; i >= 1; i = Math.floor(i / 2)) out.push([i]);
      return out;
    },
    formula: (n) => lg(n, 2) + 1,
    formulaText: '⌊log₂ n⌋ + 1',
    big: 'Θ(log n)',
    nested: false,
  },
  {
    id: 'triple',
    code: 'for (int i = 1; i <= n; i *= 3)\n    count++;',
    run: (n) => {
      const out: [number][] = [];
      for (let i = 1; i <= n; i *= 3) out.push([i]);
      return out;
    },
    formula: (n) => lg(n, 3) + 1,
    formulaText: '⌊log₃ n⌋ + 1',
    big: 'Θ(log n)',
    nested: false,
  },
  {
    id: 'sqrt',
    code: 'for (int i = 1; i * i <= n; i++)\n    count++;',
    run: (n) => {
      const out: [number][] = [];
      for (let i = 1; i * i <= n; i++) out.push([i]);
      return out;
    },
    formula: (n) => isqrt(n),
    formulaText: '⌊√n⌋',
    big: 'Θ(√n)',
    nested: false,
  },
  {
    id: 'square',
    code: 'for (int i = 1; i <= n; i++)\n    for (int j = 1; j <= n; j++)\n        count++;',
    run: (n) => {
      const out: [number, number][] = [];
      for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) out.push([i, j]);
      return out;
    },
    formula: (n) => n * n,
    formulaText: 'n²',
    big: 'Θ(n²)',
    nested: true,
  },
  {
    id: 'triangle',
    code: 'for (int i = 1; i <= n; i++)\n    for (int j = 1; j <= i; j++)\n        count++;',
    run: (n) => {
      const out: [number, number][] = [];
      for (let i = 1; i <= n; i++) for (let j = 1; j <= i; j++) out.push([i, j]);
      return out;
    },
    formula: (n) => (n * (n + 1)) / 2,
    formulaText: 'n(n+1)/2',
    big: 'Θ(n²)',
    nested: true,
  },
  {
    id: 'nlogn',
    code: 'for (int i = 1; i <= n; i++)\n    for (int j = 1; j <= n; j *= 2)\n        count++;',
    run: (n) => {
      const out: [number, number][] = [];
      for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j *= 2) out.push([i, j]);
      return out;
    },
    formula: (n) => n * (lg(n, 2) + 1),
    formulaText: 'n·(⌊log₂ n⌋ + 1)',
    big: 'Θ(n log n)',
    nested: true,
  },
  {
    id: 'harmonic',
    code: 'for (int i = 1; i <= n; i++)\n    for (int j = i; j <= n; j += i)\n        count++;',
    run: (n) => {
      const out: [number, number][] = [];
      for (let i = 1; i <= n; i++) for (let j = i; j <= n; j += i) out.push([i, j]);
      return out;
    },
    formula: (n) => {
      let s = 0;
      for (let i = 1; i <= n; i++) s += Math.floor(n / i);
      return s;
    },
    formulaText: 'Σᵢ ⌊n/i⌋ ≈ n·Hₙ',
    big: 'Θ(n log n)',
    nested: true,
  },
  {
    id: 'loglog',
    code: 'for (int i = 2; i <= n; i = i * i)\n    count++;',
    run: (n) => {
      const out: [number][] = [];
      for (let i = 2; i <= n; i = i * i) out.push([i]);
      return out;
    },
    formula: (n) => (n < 2 ? 0 : lg(lg(n, 2), 2) + 1),
    formulaText: '⌊log₂ log₂ n⌋ + 1  (n ≥ 2)',
    big: 'Θ(log log n)',
    nested: false,
  },
  {
    id: 'dependent-log',
    code: 'for (int i = 1; i <= n; i++)\n    for (int j = 1; j <= i; j *= 2)\n        count++;',
    run: (n) => {
      const out: [number, number][] = [];
      for (let i = 1; i <= n; i++) for (let j = 1; j <= i; j *= 2) out.push([i, j]);
      return out;
    },
    formula: (n) => {
      let s = 0;
      for (let i = 1; i <= n; i++) s += lg(i, 2) + 1;
      return s;
    },
    formulaText: 'Σᵢ (⌊log₂ i⌋ + 1) = Θ(log n!)',
    big: 'Θ(n log n)',
    nested: true,
  },
];

export const loopById = (id: string) => LOOPS.find((l) => l.id === id)!;
export const countOf = (p: LoopPattern, n: number) => p.run(n).length;
