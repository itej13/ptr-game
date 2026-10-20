import type { Frame, Scene, Tone, Ask } from '../core/types';
import { row, rowWidth, items, type Item } from '../core/layouts';

/**
 * Array algorithms of World 2 as frame generators + plain functions.
 * Each `...Frames` mirrors the C++ snippet of the same name line by line (labels = //@ markers).
 */

export interface ArrScene {
  cells: (Item | null)[];
  tone?: (i: number) => Tone | undefined;
  ptr?: Record<string, number | undefined>;
  slots?: number;
  caption?: string;
}
export function arrScene(s: ArrScene): Scene {
  const n = Math.max(s.cells.length, s.slots ?? 0);
  const nodes = row(s.cells, { index: true, tone: s.tone, pointers: s.ptr, slots: s.slots, key: 'a' });
  return { w: Math.max(rowWidth(n), 320), h: 150, nodes };
}

/* ---------------- insertion / deletion (L05) ---------------- */

export function insertAt(a: number[], cap: number, pos: number, x: number): number[] | null {
  if (a.length === cap || pos < 0 || pos > a.length) return null;
  return [...a.slice(0, pos), x, ...a.slice(pos)];
}
export function deleteAt(a: number[], pos: number): number[] | null {
  if (pos < 0 || pos >= a.length) return null;
  return [...a.slice(0, pos), ...a.slice(pos + 1)];
}

export function insertFrames(vals: number[], cap: number, pos: number, x: number): Frame[] {
  const n = vals.length;
  const F: Frame[] = [];
  let cells: (Item | null)[] = [...items(vals), ...Array(Math.max(0, cap - n)).fill(null)];
  const sc = (tone?: (i: number) => Tone | undefined, ptr?: Record<string, number | undefined>) => arrScene({ cells, slots: cap, tone, ptr });
  F.push({ scene: sc(undefined, { n }), line: 'check', say: `n = ${n}, capacity ${cap}. Insert ${x} at index ${pos}. First check: full? position in 0..n?`, vars: { n, cap, pos, x } });
  if (n === cap || pos < 0 || pos > n) {
    F.push({ scene: sc(() => 'warn'), line: 'check', say: n === cap ? 'Array is full (n == cap): overflow, return -1.' : `Position ${pos} is outside 0..${n}: return -1.`, vars: { n, cap, pos }, sfx: 'wrong' });
    return F;
  }
  let shifts = 0;
  for (let i = n - 1; i >= pos; i--) {
    F.push({ scene: sc((k) => (k === i ? 'compare' : undefined), { i }), line: 'loop', say: `i = ${i} ≥ pos = ${pos}: a[${i}] must move right.`, vars: { i, shifts } });
    cells = cells.slice();
    cells[i + 1] = cells[i];
    cells[i] = null;
    shifts++;
    F.push({ scene: sc((k) => (k === i + 1 ? 'active' : undefined), { i }), line: 'shift', say: `a[${i + 1}] = a[${i}] — shifted. Gap now at index ${i}.`, vars: { i, shifts }, sfx: 'swap' });
  }
  F.push({ scene: sc(undefined, { i: pos - 1 }), line: 'loop', say: `i = ${pos - 1} < pos: loop ends after ${shifts} shift(s) = n − pos.`, vars: { i: pos - 1, shifts } });
  cells = cells.slice();
  cells[pos] = { id: 'ins', v: x };
  F.push({ scene: sc((k) => (k === pos ? 'done' : undefined)), line: 'write', say: `a[${pos}] = ${x}.`, vars: { shifts }, sfx: 'found' });
  F.push({ scene: sc((k) => (k <= n ? 'done' : undefined)), line: 'ret', say: `Return n + 1 = ${n + 1}. Cost: ${shifts} moves — worst case (pos = 0) is n, so insertion is O(n).`, vars: { 'new n': n + 1 } });
  return F;
}

export function deleteFrames(vals: number[], pos: number): Frame[] {
  const n = vals.length;
  const F: Frame[] = [];
  let cells: (Item | null)[] = items(vals);
  const sc = (tone?: (i: number) => Tone | undefined, ptr?: Record<string, number | undefined>) => arrScene({ cells, slots: n, tone, ptr });
  F.push({ scene: sc((k) => (k === pos ? 'warn' : undefined)), line: 'check', say: `n = ${n}. Delete index ${pos}. Valid if 0 ≤ pos < n.`, vars: { n, pos } });
  if (pos < 0 || pos >= n) {
    F.push({ scene: sc(() => 'warn'), line: 'check', say: `Index ${pos} is invalid: return -1.`, vars: { n, pos }, sfx: 'wrong' });
    return F;
  }
  let shifts = 0;
  for (let i = pos; i < n - 1; i++) {
    F.push({ scene: sc((k) => (k === i + 1 ? 'compare' : undefined), { i }), line: 'loop', say: `i = ${i} < n − 1: pull a[${i + 1}] left.`, vars: { i, shifts } });
    cells = cells.slice();
    cells[i] = cells[i + 1];
    cells[i + 1] = null;
    shifts++;
    F.push({ scene: sc((k) => (k === i ? 'active' : undefined), { i }), line: 'shift', say: `a[${i}] = a[${i + 1}].`, vars: { i, shifts }, sfx: 'swap' });
  }
  cells = cells.slice(0, n - 1);
  F.push({ scene: arrScene({ cells, slots: n, tone: () => 'done' }), line: 'ret', say: `Return n − 1 = ${n - 1}. ${shifts} move(s) = n − pos − 1.`, vars: { 'new n': n - 1 }, sfx: 'found' });
  return F;
}

/* ---------------- searching (L06) ---------------- */

export function linearSearch(a: number[], key: number): { idx: number; comps: number } {
  for (let i = 0; i < a.length; i++) if (a[i] === key) return { idx: i, comps: i + 1 };
  return { idx: -1, comps: a.length };
}

/** Exactly the C++ iterative binary search; probes = mids examined in order. */
export function binarySearch(a: number[], key: number): { idx: number; probes: number[] } {
  let low = 0;
  let high = a.length - 1;
  const probes: number[] = [];
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    probes.push(mid);
    if (a[mid] === key) return { idx: mid, probes };
    else if (a[mid] < key) low = mid + 1;
    else high = mid - 1;
  }
  return { idx: -1, probes };
}

export function interpolationSearch(a: number[], key: number): { idx: number; probes: number[] } {
  let low = 0;
  let high = a.length - 1;
  const probes: number[] = [];
  while (low <= high && key >= a[low] && key <= a[high]) {
    if (a[high] === a[low]) return { idx: a[low] === key ? low : -1, probes };
    // C++ integer division truncates toward zero; all terms here are ≥ 0
    const pos = low + Math.trunc(((key - a[low]) * (high - low)) / (a[high] - a[low]));
    probes.push(pos);
    if (a[pos] === key) return { idx: pos, probes };
    if (a[pos] < key) low = pos + 1;
    else high = pos - 1;
  }
  return { idx: -1, probes };
}

export function linearFrames(a: number[], key: number): Frame[] {
  const its = items(a);
  const F: Frame[] = [];
  for (let i = 0; i < a.length; i++) {
    F.push({
      scene: arrScene({ cells: its, tone: (k) => (k === i ? 'compare' : k < i ? 'muted' : undefined), ptr: { i } }),
      line: 'cmp',
      say: `Compare a[${i}] = ${a[i]} with key ${key}${a[i] === key ? ' — match!' : ' — no.'}`,
      vars: { i, key, comparisons: i + 1 },
      sfx: 'compare',
    });
    if (a[i] === key) {
      F.push({ scene: arrScene({ cells: its, tone: (k) => (k === i ? 'done' : 'muted'), ptr: { i } }), line: 'found', say: `Return ${i}. ${i + 1} comparison(s).`, vars: { result: i }, sfx: 'found' });
      return F;
    }
  }
  F.push({ scene: arrScene({ cells: its, tone: () => 'muted' }), line: 'notfound', say: `Key ${key} not present: return -1 after ${a.length} comparisons (worst case).`, vars: { result: -1 }, sfx: 'wrong' });
  return F;
}

export function binaryFrames(a: number[], key: number, predict = false): Frame[] {
  const its = items(a);
  const F: Frame[] = [];
  let low = 0;
  let high = a.length - 1;
  const sc = (mid?: number, hit?: boolean) =>
    arrScene({
      cells: its,
      tone: (k) => (k === mid ? (hit ? 'done' : 'compare') : k < low || k > high ? 'muted' : undefined),
      ptr: { low, high, ...(mid !== undefined ? { mid } : {}) },
    });
  F.push({ scene: sc(), line: 'init', say: `Sorted array, key = ${key}. low = 0, high = ${high}.`, vars: { low, high, key } });
  let probes = 0;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    probes++;
    const ask: Ask | undefined = predict
      ? { prompt: `low = ${low}, high = ${high}. Which index is mid?`, options: [...new Set([mid, Math.max(low, mid - 1), Math.min(high, mid + 1), Math.ceil((low + high) / 2)])].map(String), answer: 0, hint: 'mid = low + (high − low) / 2 with integer division.' }
      : undefined;
    F.push({ scene: sc(mid), line: 'mid', say: `mid = ${low} + (${high} − ${low}) / 2 = ${mid}. a[mid] = ${a[mid]}.`, vars: { low, high, mid, probes }, sfx: 'compare', ask });
    if (a[mid] === key) {
      F.push({ scene: sc(mid, true), line: 'found', say: `a[${mid}] == ${key}: found after ${probes} probe(s).`, vars: { result: mid, probes }, sfx: 'found' });
      return F;
    }
    if (a[mid] < key) {
      const nl = mid + 1;
      const ask2: Ask | undefined = predict ? { prompt: `a[mid] = ${a[mid]} < ${key}. Which half survives?`, options: ['Right half (low = mid + 1)', 'Left half (high = mid − 1)'], answer: 0 } : undefined;
      low = nl;
      F.push({ scene: sc(), line: 'right', say: `${a[mid]} < ${key}: the key can only be to the right. low = mid + 1 = ${low}.`, vars: { low, high }, ask: ask2 });
    } else {
      const ask2: Ask | undefined = predict ? { prompt: `a[mid] = ${a[mid]} > ${key}. Which half survives?`, options: ['Left half (high = mid − 1)', 'Right half (low = mid + 1)'], answer: 0 } : undefined;
      high = mid - 1;
      F.push({ scene: sc(), line: 'left', say: `${a[mid]} > ${key}: discard the right part. high = mid − 1 = ${high}.`, vars: { low, high }, ask: ask2 });
    }
  }
  F.push({ scene: sc(), line: 'notfound', say: `low (${low}) > high (${high}): empty range, return -1. ${probes} probe(s) ≤ ⌊log₂ n⌋ + 1.`, vars: { result: -1, probes }, sfx: 'wrong' });
  return F;
}

export function interpolationFrames(a: number[], key: number): Frame[] {
  const its = items(a);
  const F: Frame[] = [];
  let low = 0;
  let high = a.length - 1;
  const sc = (pos?: number, hit?: boolean) =>
    arrScene({ cells: its, tone: (k) => (k === pos ? (hit ? 'done' : 'compare') : k < low || k > high ? 'muted' : undefined), ptr: { low, high, ...(pos !== undefined ? { pos } : {}) } });
  F.push({ scene: sc(), line: 'init', say: `key = ${key}. Instead of the middle, estimate where ${key} should sit if values were evenly spread.`, vars: { low, high, key } });
  while (low <= high && key >= a[low] && key <= a[high]) {
    if (a[high] === a[low]) {
      F.push({ scene: sc(), line: 'same', say: `a[low] == a[high]: all values equal — answer directly without dividing by zero.`, vars: { low, high } });
      const r = a[low] === key ? low : -1;
      F.push({ scene: sc(r >= 0 ? r : undefined, r >= 0), line: 'same', say: r >= 0 ? `Found at ${low}.` : 'Not found.', vars: { result: r } });
      return F;
    }
    const pos = low + Math.trunc(((key - a[low]) * (high - low)) / (a[high] - a[low]));
    F.push({ scene: sc(pos), line: 'pos', say: `pos = ${low} + (${key} − ${a[low]})·(${high} − ${low}) / (${a[high]} − ${a[low]}) = ${pos}. a[pos] = ${a[pos]}.`, vars: { low, high, pos }, sfx: 'compare' });
    if (a[pos] === key) {
      F.push({ scene: sc(pos, true), line: 'found', say: `Found ${key} at index ${pos}.`, vars: { result: pos }, sfx: 'found' });
      return F;
    }
    if (a[pos] < key) {
      low = pos + 1;
      F.push({ scene: sc(), line: 'right', say: `${a[pos]} < ${key}: low = pos + 1 = ${low}.`, vars: { low, high } });
    } else {
      high = pos - 1;
      F.push({ scene: sc(), line: 'left', say: `${a[pos]} > ${key}: high = pos − 1 = ${high}.`, vars: { low, high } });
    }
  }
  F.push({ scene: sc(), line: 'notfound', say: `Range empty or key outside [a[low], a[high]]: return -1.`, vars: { result: -1 }, sfx: 'wrong' });
  return F;
}

/* ---------------- simple sorts (L07) ---------------- */

export interface SortTrace {
  sorted: number[];
  swaps: [number, number][]; // index pairs passed to swap(), in order (incl. self-swaps)
  passes: number[][]; // array after each outer-loop iteration
  comps: number;
}

export function bubbleSort(input: number[]): SortTrace {
  const a = input.slice();
  const n = a.length;
  const t: SortTrace = { sorted: a, swaps: [], passes: [], comps: 0 };
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      t.comps++;
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        t.swaps.push([j, j + 1]);
        swapped = true;
      }
    }
    t.passes.push(a.slice());
    if (!swapped) break;
  }
  return t;
}
export function selectionSort(input: number[]): SortTrace {
  const a = input.slice();
  const n = a.length;
  const t: SortTrace = { sorted: a, swaps: [], passes: [], comps: 0 };
  for (let i = 0; i < n - 1; i++) {
    let m = i;
    for (let j = i + 1; j < n; j++) {
      t.comps++;
      if (a[j] < a[m]) m = j;
    }
    [a[i], a[m]] = [a[m], a[i]];
    t.swaps.push([i, m]);
    t.passes.push(a.slice());
  }
  return t;
}
export function insertionSort(input: number[]): SortTrace & { shifts: number } {
  const a = input.slice();
  const n = a.length;
  const t = { sorted: a, swaps: [] as [number, number][], passes: [] as number[][], comps: 0, shifts: 0 };
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0) {
      t.comps++;
      if (!(a[j] > key)) break;
      a[j + 1] = a[j];
      t.shifts++;
      j--;
    }
    a[j + 1] = key;
    t.passes.push(a.slice());
  }
  return t;
}

const sortTone = (sortedFrom: (k: number) => boolean, hi: Record<number, Tone>) => (k: number) => hi[k] ?? (sortedFrom(k) ? 'done' : undefined);

export function bubbleFrames(vals: number[], predict = false): Frame[] {
  const its = items(vals);
  const a = its.slice();
  const n = a.length;
  const F: Frame[] = [];
  const sc = (i: number, hi: Record<number, Tone>, ptr: Record<string, number | undefined>) => arrScene({ cells: a.slice(), tone: sortTone((k) => k >= n - i, hi), ptr });
  F.push({ scene: sc(0, {}, {}), line: 'pass', say: `Bubble sort: each pass bubbles the largest remaining value to the end.`, vars: { n } });
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    F.push({ scene: sc(i, {}, { j: 0 }), line: 'flag', say: `Pass i = ${i}: swapped = false. Compare pairs j = 0 … ${n - i - 2}.`, vars: { i, swapped: false } });
    for (let j = 0; j < n - i - 1; j++) {
      const will = (a[j].v as number) > (a[j + 1].v as number);
      F.push({
        scene: sc(i, { [j]: 'compare', [j + 1]: 'compare' }, { j, 'j+1': j + 1 }),
        line: 'cmp',
        say: `a[${j}] = ${a[j].v} ${will ? '>' : '≤'} a[${j + 1}] = ${a[j + 1].v}${will ? ' → swap' : ' → leave'}.`,
        vars: { i, j, swapped },
        sfx: 'compare',
        ask: predict ? { prompt: `Will a[${j}] = ${a[j].v} and a[${j + 1}] = ${a[j + 1].v} be swapped?`, options: will ? ['Yes', 'No'] : ['No', 'Yes'], answer: 0, hint: 'Swap only when the left one is strictly greater.' } : undefined,
      });
      if (will) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        F.push({ scene: sc(i, { [j]: 'active', [j + 1]: 'active' }, { j, 'j+1': j + 1 }), line: 'swap', say: `swap(a[${j}], a[${j + 1}]); swapped = true.`, vars: { i, j, swapped }, sfx: 'swap' });
      }
    }
    F.push({ scene: sc(i + 1, {}, {}), line: 'check', say: `End of pass ${i}: ${a[n - i - 1].v} is in its final place.${swapped ? '' : ' No swaps happened → already sorted.'}`, vars: { i, swapped } });
    if (!swapped) {
      F.push({ scene: arrScene({ cells: a.slice(), tone: () => 'done' }), line: 'stop', say: `break — the optimised version stops early. That's why the best case (sorted input) is O(n).`, vars: { passes: i + 1 }, sfx: 'found' });
      return F;
    }
  }
  F.push({ scene: arrScene({ cells: a.slice(), tone: () => 'done' }), line: 'pass', say: `All n − 1 passes done. Sorted.`, sfx: 'found' });
  return F;
}

export function selectionFrames(vals: number[], predict = false): Frame[] {
  const its = items(vals);
  const a = its.slice();
  const n = a.length;
  const F: Frame[] = [];
  const sc = (i: number, hi: Record<number, Tone>, ptr: Record<string, number | undefined>) => arrScene({ cells: a.slice(), tone: sortTone((k) => k < i, hi), ptr });
  for (let i = 0; i < n - 1; i++) {
    let m = i;
    F.push({ scene: sc(i, { [i]: 'compare' }, { i, minIdx: m }), line: 'init', say: `Pass i = ${i}: assume a[${i}] = ${a[i].v} is the minimum of a[${i}..${n - 1}].`, vars: { i, minIdx: m } });
    for (let j = i + 1; j < n; j++) {
      const better = (a[j].v as number) < (a[m].v as number);
      F.push({ scene: sc(i, { [m]: 'compare', [j]: 'path' }, { i, j, minIdx: m }), line: 'cmp', say: `a[${j}] = ${a[j].v} ${better ? '<' : '≥'} a[minIdx] = ${a[m].v}.`, vars: { i, j, minIdx: m }, sfx: 'compare' });
      if (better) {
        m = j;
        F.push({ scene: sc(i, { [m]: 'compare' }, { i, j, minIdx: m }), line: 'newmin', say: `New minimum: minIdx = ${m}.`, vars: { i, j, minIdx: m } });
      }
    }
    const final = m;
    const opts = [...new Set([final, i, (final + 1) % n, Math.max(i, final - 1)])].map((k) => `index ${k} (value ${a[k].v})`);
    [a[i], a[m]] = [a[m], a[i]];
    F.push({
      scene: sc(i + 1, { [i]: 'active', [m]: 'active' }, { i, minIdx: m }),
      line: 'swap',
      say: m === i ? `swap(a[${i}], a[${i}]) — the minimum was already in place (still one swap call).` : `swap(a[${i}], a[${m}]): ${a[i].v} moves to its final position ${i}.`,
      vars: { i, minIdx: m },
      sfx: 'swap',
      ask: predict ? { prompt: `Which element ends up swapped into position ${i}?`, options: opts, answer: 0, hint: 'Find the smallest value in the unsorted part a[i..n-1].' } : undefined,
    });
  }
  F.push({ scene: arrScene({ cells: a.slice(), tone: () => 'done' }), line: 'pass', say: `Sorted with exactly n(n−1)/2 = ${(n * (n - 1)) / 2} comparisons — always, whatever the input order.`, sfx: 'found' });
  return F;
}

export function insertionFrames(vals: number[], predict = false): Frame[] {
  const its = items(vals);
  const a: (Item | null)[] = its.slice();
  const n = its.length;
  const F: Frame[] = [];
  const keyNode = (it: Item, at: number) => ({ id: it.id, x: 40 + at * 56 + 26, y: 230, w: 52, h: 44, shape: 'rect' as const, label: it.v, tone: 'active' as const, sub: 'key' });
  const sc = (i: number, key: Item | null, keyAt: number, hi: Record<number, Tone>, ptr: Record<string, number | undefined>): Scene => {
    const base = arrScene({ cells: a.slice(), tone: (k) => hi[k] ?? (k < i ? 'done' : undefined), ptr, slots: n });
    if (key) base.nodes.push(keyNode(key, keyAt));
    base.h = 290;
    return base;
  };
  F.push({ scene: sc(1, null, 0, {}, {}), line: 'pass', say: `a[0] alone is a sorted prefix. Insert each next element into the prefix, like sorting playing cards.`, vars: { n } });
  for (let i = 1; i < n; i++) {
    const key = a[i] as Item;
    a[i] = null;
    let j = i - 1;
    F.push({ scene: sc(i, key, i, {}, { i, j }), line: 'key', say: `i = ${i}: lift key = ${key.v} out; j = ${j}.`, vars: { i, key: key.v, j } });
    let target = j + 1;
    {
      // compute landing spot for the predict question
      let t = j;
      while (t >= 0 && ((a[t] as Item).v as number) > (key.v as number)) t--;
      target = t + 1;
    }
    let asked = false;
    while (j >= 0) {
      const bigger = ((a[j] as Item).v as number) > (key.v as number);
      F.push({
        scene: sc(i, key, j + 1, { [j]: 'compare' }, { i, j }),
        line: 'cmp',
        say: `a[${j}] = ${(a[j] as Item).v} ${bigger ? '>' : '≤'} key ${key.v}${bigger ? ' → shift it right' : ' → stop'}.`,
        vars: { i, key: key.v, j },
        sfx: 'compare',
        ask:
          predict && !asked
            ? { prompt: `Key ${key.v}: at which index will it finally be placed?`, options: [...new Set([target, Math.max(0, target - 1), Math.min(i, target + 1), i])].map(String), answer: 0, hint: 'It slides left past every larger element in the sorted prefix.' }
            : undefined,
      });
      asked = true;
      if (!bigger) break;
      a[j + 1] = a[j];
      a[j] = null;
      F.push({ scene: sc(i, key, j, { [j + 1]: 'path' }, { i, j }), line: 'shift', say: `a[${j + 1}] = a[${j}]; j-- → ${j - 1}.`, vars: { i, key: key.v, j: j - 1 }, sfx: 'swap' });
      j--;
    }
    a[j + 1] = key;
    F.push({ scene: sc(i + 1, null, 0, { [j + 1]: 'active' }, { i, j }), line: 'place', say: `a[j + 1] = a[${j + 1}] = ${key.v}. Prefix a[0..${i}] is sorted.`, vars: { i, j }, sfx: 'pop' });
  }
  F.push({ scene: arrScene({ cells: a.slice(), tone: () => 'done' }), line: 'pass', say: `Sorted. Best case (already sorted): n − 1 comparisons, O(n). Worst (reverse): n(n−1)/2.`, sfx: 'found' });
  return F;
}
