import type { Frame, Scene, SNode, Tone, Ask } from '../core/types';
import { row, items, rowWidth, type Item } from '../core/layouts';

/* =====================================================================
   Merge sort (mirrors cpp/merge_sort.cpp)
   ===================================================================== */

export function mergeSort(input: number[]): { sorted: number[]; comps: number; merges: [number, number, number][] } {
  const a = input.slice();
  let comps = 0;
  const merges: [number, number, number][] = [];
  const ms = (l: number, r: number) => {
    if (l >= r) return;
    const m = l + Math.floor((r - l) / 2);
    ms(l, m);
    ms(m + 1, r);
    merges.push([l, m, r]);
    const L = a.slice(l, m + 1);
    const R = a.slice(m + 1, r + 1);
    let i = 0;
    let j = 0;
    let k = l;
    while (i < L.length && j < R.length) {
      comps++;
      a[k++] = L[i] <= R[j] ? L[i++] : R[j++];
    }
    while (i < L.length) a[k++] = L[i++];
    while (j < R.length) a[k++] = R[j++];
  };
  ms(0, a.length - 1);
  return { sorted: a, comps, merges };
}

export function mergeSortIterative(input: number[]): number[] {
  const a = input.slice();
  const n = a.length;
  for (let w = 1; w < n; w *= 2)
    for (let l = 0; l < n - w; l += 2 * w) {
      const m = l + w - 1;
      const r = Math.min(l + 2 * w - 1, n - 1);
      const L = a.slice(l, m + 1);
      const R = a.slice(m + 1, r + 1);
      let i = 0;
      let j = 0;
      let k = l;
      while (i < L.length && j < R.length) a[k++] = L[i] <= R[j] ? L[i++] : R[j++];
      while (i < L.length) a[k++] = L[i++];
      while (j < R.length) a[k++] = R[j++];
    }
  return a;
}

export function mergeOnly(a: number[]): number[] {
  const m = Math.floor((a.length - 1) / 2);
  const L = a.slice(0, m + 1);
  const R = a.slice(m + 1);
  const out: number[] = [];
  let i = 0;
  let j = 0;
  while (i < L.length && j < R.length) out.push(L[i] <= R[j] ? L[i++] : R[j++]);
  return [...out, ...L.slice(i), ...R.slice(j)];
}

export function mergeSortFrames(vals: number[]): Frame[] {
  const a: (Item | null)[] = items(vals);
  const n = a.length;
  const F: Frame[] = [];
  const depthOf: number[] = Array(n).fill(0);
  const sc = (l: number, r: number, extra: SNode[] = [], tone?: (i: number) => Tone | undefined, ptr?: Record<string, number | undefined>): Scene => {
    const nodes = row(a, { index: true, slots: n, key: 'm', tone: (i) => tone?.(i) ?? (i < l || i > r ? 'muted' : undefined), pointers: ptr });
    return { w: Math.max(rowWidth(n), 420), h: 300, nodes: [...nodes, ...extra] };
  };
  const tmpRow = (L: (Item | null)[], x0: number, label: string, at: number): SNode[] => [
    { id: `lbl-${label}`, x: x0 - 8, y: 220, shape: 'text', label, anchor: 'end', tone: 'muted', fontSize: 12 },
    ...L.map((it, k) =>
      it
        ? { id: it.id, x: x0 + k * 50 + 24, y: 220, w: 46, h: 40, shape: 'rect' as const, label: it.v, tone: k === at ? ('compare' as const) : ('base' as const) }
        : { id: `${label}-gap${k}`, x: x0 + k * 50 + 24, y: 220, w: 46, h: 40, shape: 'rect' as const, tone: 'ghost' as const },
    ),
  ];
  const ms = (l: number, r: number, d: number) => {
    for (let i = l; i <= r; i++) depthOf[i] = d;
    if (l >= r) {
      F.push({ scene: sc(l, r), line: 'base', say: `mergeSort(${l}, ${r}): one element — already sorted.`, vars: { l, r } });
      return;
    }
    const m = l + Math.floor((r - l) / 2);
    F.push({ scene: sc(l, r, [], undefined, { l, m, r }), line: 'mid', say: `mergeSort(${l}, ${r}): split at m = ${m} into [${l}..${m}] and [${m + 1}..${r}].`, vars: { l, m, r, depth: d } });
    ms(l, m, d + 1);
    ms(m + 1, r, d + 1);
    // merge
    const L = a.slice(l, m + 1) as (Item | null)[];
    const R = a.slice(m + 1, r + 1) as (Item | null)[];
    for (let k = l; k <= r; k++) a[k] = null;
    let i = 0;
    let j = 0;
    let k = l;
    const lx = 80;
    const rx = lx + L.length * 50 + 60;
    const show = (say: string, line: string, hi?: number) => F.push({ scene: sc(l, r, [...tmpRow(L, lx, 'L', i), ...tmpRow(R, rx, 'R', j)], (x) => (x === hi ? 'active' : x < l || x > r ? 'muted' : undefined), { k }), line, say, vars: { i, j, k } });
    show(`merge(${l}, ${m}, ${r}): copy both sorted halves into L and R.`, 'copy');
    while (i < L.length && j < R.length) {
      const takeL = (L[i]!.v as number) <= (R[j]!.v as number);
      const it = takeL ? L[i]! : R[j]!;
      F.push({ scene: sc(l, r, [...tmpRow(L, lx, 'L', i), ...tmpRow(R, rx, 'R', j)], undefined, { k }), line: 'cmp', say: `L[${i}] = ${L[i]!.v} ${takeL ? '≤' : '>'} R[${j}] = ${R[j]!.v}: take ${it.v}${takeL && L[i]!.v === R[j]!.v ? ' (ties go left — that keeps merge sort stable)' : ''}.`, vars: { i, j, k }, sfx: 'compare' });
      if (takeL) L[i++] = null;
      else R[j++] = null;
      a[k] = it;
      k++;
      show(`a[${k - 1}] = ${it.v}.`, takeL ? 'takeL' : 'takeR', k - 1);
    }
    while (i < L.length) {
      const it = L[i]!;
      L[i++] = null;
      a[k++] = it;
      show(`R is exhausted: copy the rest of L (${it.v}).`, 'restL', k - 1);
    }
    while (j < R.length) {
      const it = R[j]!;
      R[j++] = null;
      a[k++] = it;
      show(`L is exhausted: copy the rest of R (${it.v}).`, 'restR', k - 1);
    }
    F.push({ scene: sc(l, r, [], (x) => (x >= l && x <= r ? 'done' : 'muted')), line: 'merge', say: `[${l}..${r}] is now sorted: ${a.slice(l, r + 1).map((x) => x!.v).join(', ')}.`, vars: { l, r }, sfx: 'found' });
  };
  ms(0, n - 1, 0);
  F.push({ scene: sc(0, n - 1, [], () => 'done'), say: `Sorted. ${Math.ceil(Math.log2(Math.max(2, n)))} levels of splitting, Θ(n) merge work per level ⇒ Θ(n log n).`, sfx: 'found' });
  return F;
}

/* =====================================================================
   Quick sort — the DAA deck's first-element-pivot partition
   ===================================================================== */

export function partitionHoareFirst(a: number[], low: number, high: number, log?: [number, number][]): number {
  const p = a[low];
  let i = low;
  let j = high;
  const sw = (x: number, y: number) => {
    [a[x], a[y]] = [a[y], a[x]];
    log?.push([x, y]);
  };
  while (i < j) {
    while (a[i] <= p && i <= high - 1) i++;
    while (a[j] > p && j >= low + 1) j--;
    if (i < j) sw(i, j);
  }
  sw(low, j);
  return j;
}
export function quickSort(input: number[]): { sorted: number[]; swaps: [number, number][]; pivots: number[] } {
  const a = input.slice();
  const swaps: [number, number][] = [];
  const pivots: number[] = [];
  const qs = (lo: number, hi: number) => {
    if (lo < hi) {
      const pi = partitionHoareFirst(a, lo, hi, swaps);
      pivots.push(pi);
      qs(lo, pi - 1);
      qs(pi + 1, hi);
    }
  };
  qs(0, a.length - 1);
  return { sorted: a, swaps, pivots };
}
export function partitionLomuto(a: number[], low: number, high: number, log?: [number, number][]): number {
  const p = a[high];
  let i = low - 1;
  const sw = (x: number, y: number) => {
    [a[x], a[y]] = [a[y], a[x]];
    log?.push([x, y]);
  };
  for (let j = low; j < high; j++) if (a[j] <= p) sw(++i, j);
  sw(i + 1, high);
  return i + 1;
}
export function quickSortLomuto(input: number[]): { sorted: number[]; swaps: [number, number][] } {
  const a = input.slice();
  const swaps: [number, number][] = [];
  const qs = (lo: number, hi: number) => {
    if (lo < hi) {
      const pi = partitionLomuto(a, lo, hi, swaps);
      qs(lo, pi - 1);
      qs(pi + 1, hi);
    }
  };
  qs(0, a.length - 1);
  return { sorted: a, swaps };
}

export function quickSortFrames(vals: number[], predict = false, onlyFirstPartition = false): Frame[] {
  const a: Item[] = items(vals);
  const n = a.length;
  const F: Frame[] = [];
  const fixed = new Set<number>();
  const sc = (lo: number, hi: number, hl: Record<number, Tone>, ptr: Record<string, number | undefined>): Scene => ({
    w: Math.max(rowWidth(n), 420),
    h: 190,
    nodes: row(a.slice(), { index: true, key: 'q', pointers: ptr, tone: (k) => hl[k] ?? (fixed.has(k) ? 'done' : k < lo || k > hi ? 'muted' : undefined) }),
  });
  const v = (k: number) => a[k].v as number;
  const swap = (x: number, y: number) => ([a[x], a[y]] = [a[y], a[x]]);
  const part = (low: number, high: number): number => {
    const p = v(low);
    let i = low;
    let j = high;
    F.push({ scene: sc(low, high, { [low]: 'path' }, { i, j }), line: 'pivot', say: `partition(${low}, ${high}): pivot p = a[low] = ${p}. i = ${low}, j = ${high}.`, vars: { low, high, p, i, j } });
    while (i < j) {
      const i0 = i;
      while (v(i) <= p && i <= high - 1) i++;
      F.push({
        scene: sc(low, high, { [low]: 'path', [i]: 'compare' }, { i, j }),
        line: 'scani',
        say: v(i) > p ? `i moves right while a[i] ≤ ${p}; stops at ${i} because a[${i}] = ${v(i)} > ${p}.` : `i moves right while a[i] ≤ ${p}; stops at ${i} = high (no element > ${p} found).`,
        vars: { p, i, j },
        sfx: 'tick',
        ask: predict ? { prompt: `Pivot ${p}, i starts at ${i0}. Where does i stop?`, options: [...new Set([i, Math.min(high, i + 1), Math.max(low, i - 1), high])].map(String), answer: 0, hint: 'i advances while a[i] ≤ p and i ≤ high − 1.' } : undefined,
      });
      const j0 = j;
      while (v(j) > p && j >= low + 1) j--;
      F.push({
        scene: sc(low, high, { [low]: 'path', [i]: 'compare', [j]: 'compare' }, { i, j }),
        line: 'scanj',
        say: `j moves left past elements > ${p}; stops at ${j} (a[${j}] = ${v(j)}).`,
        vars: { p, i, j },
        sfx: 'tick',
        ask: predict ? { prompt: `Where does j stop (moving left from ${j0} past elements > ${p})?`, options: [...new Set([j, Math.max(low, j - 1), Math.min(high, j + 1), low])].map(String), answer: 0, hint: 'j retreats while a[j] > p and j ≥ low + 1.' } : undefined,
      });
      if (i < j) {
        swap(i, j);
        F.push({ scene: sc(low, high, { [low]: 'path', [i]: 'active', [j]: 'active' }, { i, j }), line: 'swap', say: `i < j: swap a[${i}] and a[${j}] — the big one goes right, the small one left.`, vars: { p, i, j }, sfx: 'swap' });
      } else F.push({ scene: sc(low, high, { [low]: 'path' }, { i, j }), line: 'check', say: `i (${i}) ≥ j (${j}): pointers crossed — stop scanning.`, vars: { p, i, j } });
    }
    const ask: Ask | undefined = predict ? { prompt: `Final step: which index does the pivot ${p} land in?`, options: [...new Set([j, i, low, Math.min(high, j + 1)])].map(String), answer: 0, hint: 'swap(a[low], a[j]) — j stopped on an element ≤ p.' } : undefined;
    swap(low, j);
    fixed.add(j);
    F.push({ scene: sc(low, high, { [j]: 'done' }, { j }), line: 'place', say: `swap(a[low], a[j]): pivot ${p} lands at index ${j}. Everything left of it ≤ ${p}, everything right > ${p}.`, vars: { pivot: p, index: j }, sfx: 'found', ask });
    return j;
  };
  const qs = (lo: number, hi: number) => {
    if (lo < hi) {
      F.push({ scene: sc(lo, hi, {}, { low: lo, high: hi }), line: 'base', say: `quickSort(${lo}, ${hi}).`, vars: { low: lo, high: hi } });
      const pi = part(lo, hi);
      if (onlyFirstPartition) return;
      qs(lo, pi - 1);
      qs(pi + 1, hi);
    } else if (lo === hi) fixed.add(lo);
  };
  qs(0, n - 1);
  if (!onlyFirstPartition) {
    for (let k = 0; k < n; k++) fixed.add(k);
    F.push({ scene: sc(0, n - 1, {}, {}), say: 'Sorted. Each pivot was fixed in its final position by one partition.', sfx: 'found' });
  }
  return F;
}

/* =====================================================================
   Recurrences
   ===================================================================== */

/** Exact value of T(n) = a·T(n/b) + f(n), T(1) = t1, for n a power of b. */
export function evalDividing(a: number, b: number, f: (n: number) => number, n: number, t1 = 1): number {
  if (n <= 1) return t1;
  return a * evalDividing(a, b, f, n / b, t1) + f(n);
}
/** Exact value of T(n) = a·T(n − b) + f(n), T(n) = t0 for n ≤ 0 (or base). */
export function evalDecreasing(a: number, b: number, f: (n: number) => number, n: number, base = 1): number {
  if (n <= 1) return base;
  return a * evalDecreasing(a, b, f, n - b, base) + f(n);
}

const fmtPow = (e0: number) => {
  const e = Math.abs(e0 - Math.round(e0)) < 1e-9 ? Math.round(e0) : e0;
  return e === 1 ? 'n' : e === 0 ? '1' : `n^${Number.isInteger(e) ? e : e.toFixed(3).replace(/0+$/, '')}`;
};
const fmtLog = (p: number) => (p === 0 ? '' : p === 1 ? 'log n' : `log^${p} n`);
export const thetaStr = (k: number, p: number) => {
  const a = fmtPow(k);
  const b = fmtLog(p);
  if (a === '1') return `Θ(${b || '1'})`;
  return `Θ(${a}${b ? ' ' + b : ''})`;
};

/**
 * Extended Master theorem (the form in your Recurrence deck / Abdul Bari):
 * T(n) = a·T(n/b) + Θ(n^k · log^p n), a ≥ 1, b > 1.
 */
export function masterDividing(a: number, b: number, k: number, p: number): { answer: string; case: string } {
  const c = Math.log(a) / Math.log(b);
  const eq = Math.abs(c - k) < 1e-9;
  if (!eq && c > k) return { answer: `Θ(${fmtPow(c)})`, case: `Case 1: log_${b} ${a} = ${round(c)} > k = ${k}` };
  if (eq) {
    if (p > -1) return { answer: thetaStr(k, p + 1), case: `Case 2(a): log_${b} ${a} = k = ${k} and p = ${p} > −1` };
    if (p === -1) return { answer: `Θ(${fmtPow(k) === '1' ? '' : fmtPow(k) + ' '}log log n)`, case: `Case 2(b): log_${b} ${a} = k and p = −1` };
    return { answer: `Θ(${fmtPow(k)})`, case: `Case 2(c): log_${b} ${a} = k and p < −1` };
  }
  if (p >= 0) return { answer: thetaStr(k, p), case: `Case 3(a): log_${b} ${a} = ${round(c)} < k = ${k}, p ≥ 0` };
  return { answer: `O(${fmtPow(k)})`, case: `Case 3(b): log_${b} ${a} < k, p < 0` };
}
const round = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(3));

/**
 * Master theorem for decreasing functions: T(n) = a·T(n − b) + f(n), f(n) = O(n^k).
 * a < 1 → O(n^k); a = 1 → O(n^(k+1)); a > 1 → O(n^k · a^(n/b)).  (Upper bounds.)
 */
export function masterDecreasing(a: number, b: number, k: number): string {
  if (a < 1) return `O(${fmtPow(k)})`;
  if (a === 1) return `O(${fmtPow(k + 1)})`;
  const exp = b === 1 ? 'n' : `(n/${b})`;
  return `O(${k === 0 ? '' : fmtPow(k) + ' · '}${a}^${exp})`;
}

/* =====================================================================
   Strassen
   ===================================================================== */
export type M2 = [[number, number], [number, number]];
export function strassen(A: M2, B: M2) {
  const [[a11, a12], [a21, a22]] = A;
  const [[b11, b12], [b21, b22]] = B;
  const M1 = (a11 + a22) * (b11 + b22);
  const M2 = (a21 + a22) * b11;
  const M3 = a11 * (b12 - b22);
  const M4 = a22 * (b21 - b11);
  const M5 = (a11 + a12) * b22;
  const M6 = (a21 - a11) * (b11 + b12);
  const M7 = (a12 - a22) * (b21 + b22);
  const z = (x: number) => x || 0; // avoid -0
  const C: M2 = [
    [z(M1 + M4 - M5 + M7), z(M3 + M5)],
    [z(M2 + M4), z(M1 - M2 + M3 + M6)],
  ];
  return { M: [M1, M2, M3, M4, M5, M6, M7], C };
}
export const naiveMul = (A: M2, B: M2): M2 => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0] || 0, A[0][0] * B[0][1] + A[0][1] * B[1][1] || 0],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0] || 0, A[1][0] * B[0][1] + A[1][1] * B[1][1] || 0],
];
