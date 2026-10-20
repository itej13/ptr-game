/** Seeded PRNG (mulberry32) so a test attempt is reproducible and a retry gets a fresh seed. */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 0x9e3779b9;
  }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** integer in [a, b] inclusive */
  int(a: number, b: number): number {
    return a + Math.floor(this.next() * (b - a + 1));
  }
  pick<T>(xs: readonly T[]): T {
    return xs[Math.floor(this.next() * xs.length)];
  }
  shuffle<T>(xs: readonly T[]): T[] {
    const a = xs.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** k distinct integers from [a, b] */
  distinct(k: number, a: number, b: number): number[] {
    const set = new Set<number>();
    while (set.size < k) set.add(this.int(a, b));
    return [...set];
  }
  ints(k: number, a: number, b: number): number[] {
    return Array.from({ length: k }, () => this.int(a, b));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
}

export const newSeed = () => (Math.random() * 2 ** 32) >>> 0;
