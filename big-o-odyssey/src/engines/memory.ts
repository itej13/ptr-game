/**
 * Array address calculation (Level 4). `order` enumerates elements in the order they are laid
 * out in memory — the ground truth. `formula` is what students write; memory.test.ts proves they agree.
 */
export type Bounds = [number, number][]; // [lower, upper] per dimension
export type Major = 'row' | 'col';

export function memoryOrder(b: Bounds, major: Major): number[][] {
  const out: number[][] = [];
  const dims = b.length;
  const idx = b.map(([l]) => l);
  // row-major: last index varies fastest; column-major: first index varies fastest
  const fastest = major === 'row' ? [...Array(dims).keys()].reverse() : [...Array(dims).keys()];
  const total = b.reduce((p, [l, u]) => p * (u - l + 1), 1);
  for (let t = 0; t < total; t++) {
    out.push(idx.slice());
    for (const d of fastest) {
      if (idx[d] < b[d][1]) {
        idx[d]++;
        break;
      }
      idx[d] = b[d][0];
    }
  }
  return out;
}

export function addressByEnumeration(b: Bounds, major: Major, base: number, w: number, at: number[]): number {
  const k = memoryOrder(b, major).findIndex((ix) => ix.every((v, d) => v === at[d]));
  if (k < 0) throw new Error('index out of bounds');
  return base + w * k;
}

/** Textbook formula: offset = Σ (i_d − l_d) · Π (sizes of the dimensions that vary faster). */
export function addressByFormula(b: Bounds, major: Major, base: number, w: number, at: number[]): number {
  const size = b.map(([l, u]) => u - l + 1);
  const order = major === 'row' ? [...b.keys()] : [...b.keys()].reverse(); // slowest → fastest
  let off = 0;
  for (const d of order) off = off * size[d] + (at[d] - b[d][0]);
  return base + w * off;
}

export const count = (b: Bounds) => b.reduce((p, [l, u]) => p * (u - l + 1), 1);
