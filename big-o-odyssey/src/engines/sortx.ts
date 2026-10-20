import type { Frame, Scene, SNode, SEdge } from '../core/types';
import { treeScene, type BNode } from '../core/layouts';

/* =====================================================================
   LSD radix sort (Level 35) — mirrors cpp/radix_sort.cpp
   ===================================================================== */
export function radixPasses(input: number[]): number[][] {
  const a = input.slice();
  const out: number[][] = [];
  if (!a.length) return out;
  const mx = Math.max(...a);
  for (let exp = 1; Math.floor(mx / exp) > 0; exp *= 10) {
    const bins: number[][] = Array.from({ length: 10 }, () => []);
    for (const x of a) bins[Math.floor(x / exp) % 10].push(x); // stable
    a.splice(0, a.length, ...bins.flat());
    out.push(a.slice());
  }
  return out;
}

/** MSD-first sorting on several keys: sort tuples lexicographically (reference). */
export const lexSort = (rows: number[][]) => [...rows].sort((x, y) => {
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
});

export function radixFrames(vals: number[]): Frame[] {
  const items = vals.map((v, i) => ({ id: `r${i}`, v }));
  let a = items.slice();
  const F: Frame[] = [];
  const mx = Math.max(0, ...vals);
  const digits = Math.max(1, String(mx).length);
  const pad = (v: number) => String(v).padStart(digits, '0');
  const rowScene = (arr: typeof items, bins: (typeof items)[] | null, exp: number | null, note?: string): Scene => {
    const nodes: SNode[] = arr.map((it, i) => ({ id: it.id, x: 50 + i * 58, y: 50, w: 54, h: 36, shape: 'rect', label: pad(it.v), tone: 'base', fontSize: 13 }));
    if (bins) {
      bins.forEach((b, d) => {
        nodes.push({ id: `bl${d}`, x: 50 + d * 62, y: 110, shape: 'text', label: `bin ${d}`, tone: 'muted', fontSize: 11 });
        b.forEach((it, k) => nodes.push({ id: it.id, x: 50 + d * 62, y: 140 + k * 40, w: 56, h: 34, shape: 'rect', label: pad(it.v), tone: 'compare', fontSize: 13 }));
      });
    }
    if (note) nodes.push({ id: 'note', x: 20, y: 18, shape: 'text', label: note, anchor: 'start', tone: 'accent', fontSize: 12 });
    const maxBin = bins ? Math.max(1, ...bins.map((b) => b.length)) : 0;
    return { w: Math.max(60 + arr.length * 58, 60 + 10 * 62), h: bins ? 160 + maxBin * 40 : 110, nodes };
  };
  F.push({ scene: rowScene(a, null, null), say: `Keys written with ${digits} digit(s). LSD radix sort makes ${digits} stable pass(es): units, then tens, …` });
  for (let p = 0, exp = 1; p < digits; p++, exp *= 10) {
    const bins: (typeof items)[] = Array.from({ length: 10 }, () => []);
    for (const it of a) bins[Math.floor(it.v / exp) % 10].push(it);
    const place = ['units', 'tens', 'hundreds', 'thousands'][p] ?? `10^${p}`;
    F.push({ scene: rowScene([], bins, exp, `pass ${p + 1}: distribute by the ${place} digit`), line: 'count', say: `Pass ${p + 1}: drop each key, left to right, into the bin of its ${place} digit (keeping arrival order inside a bin).`, sfx: 'swap' });
    a = bins.flat();
    F.push({ scene: rowScene(a, null, null, `after pass ${p + 1}`), line: 'copy', say: `Collect bins 0 → 9: ${a.map((x) => pad(x.v)).join(' ')}. Sorted on the last ${p + 1} digit(s).`, sfx: 'tick' });
  }
  F.push({ scene: rowScene(a, null, null, 'sorted'), say: `Sorted after ${digits} passes. Time O(d·(n + r)) for d digits in radix r — linear for fixed d.`, sfx: 'found' });
  return F;
}

/* =====================================================================
   External sorting (Level 36)
   ===================================================================== */

/** Replacement selection with memory for m records. Returns the runs produced. */
export function replacementSelection(input: number[], m: number): number[][] {
  const runs: number[][] = [];
  const mem: { v: number; frozen: boolean }[] = [];
  let i = 0;
  while (i < input.length && mem.length < m) mem.push({ v: input[i++], frozen: false });
  let run: number[] = [];
  while (mem.length) {
    const eligible = mem.filter((x) => !x.frozen);
    if (!eligible.length) {
      runs.push(run);
      run = [];
      mem.forEach((x) => (x.frozen = false));
      continue;
    }
    const best = eligible.reduce((a, b) => (b.v < a.v ? b : a));
    run.push(best.v);
    const pos = mem.indexOf(best);
    if (i < input.length) {
      const x = input[i++];
      mem[pos] = { v: x, frozen: x < best.v };
    } else mem.splice(pos, 1);
  }
  if (run.length) runs.push(run);
  return runs;
}

export function replacementFrames(input: number[], m: number): Frame[] {
  const F: Frame[] = [];
  const runs: number[][] = [];
  const mem: { v: number; frozen: boolean }[] = [];
  let i = 0;
  while (i < input.length && mem.length < m) mem.push({ v: input[i++], frozen: false });
  let run: number[] = [];
  const sc = (pick: number | null): Scene => {
    const nodes: SNode[] = [
      { id: 'inl', x: 20, y: 24, shape: 'text', label: 'input', anchor: 'start', tone: 'muted', fontSize: 11 },
      ...input.slice(i).map((v, k) => ({ id: `in${i + k}`, x: 80 + k * 40, y: 24, w: 36, h: 28, shape: 'rect' as const, label: v, tone: 'base' as const, fontSize: 12 })),
      { id: 'meml', x: 20, y: 84, shape: 'text', label: `memory (${m})`, anchor: 'start', tone: 'muted', fontSize: 11 },
      ...mem.map((x, k) => ({ id: `mem${k}`, x: 120 + k * 50, y: 84, w: 44, h: 34, shape: 'rect' as const, label: x.v, tone: (k === pick ? 'active' : x.frozen ? 'muted' : 'compare') as 'active' | 'muted' | 'compare', sub: x.frozen ? 'next run' : undefined })),
      ...[...runs, run].flatMap((r, ri) => [
        { id: `rl${ri}`, x: 20, y: 150 + ri * 40, shape: 'text' as const, label: `run ${ri + 1}`, anchor: 'start' as const, tone: 'muted' as const, fontSize: 11 },
        ...r.map((v, k) => ({ id: `run${ri}-${k}`, x: 90 + k * 40, y: 150 + ri * 40, w: 36, h: 28, shape: 'rect' as const, label: v, tone: (ri === runs.length ? 'done' : 'base') as 'done' | 'base', fontSize: 12 })),
      ]),
    ];
    return { w: Math.max(420, 100 + input.length * 40), h: 190 + (runs.length + 1) * 40, nodes };
  };
  F.push({ scene: sc(null), say: `Fill memory with ${m} records. Repeatedly output the smallest record that can still extend the current run.` });
  while (mem.length) {
    const eligible = mem.filter((x) => !x.frozen);
    if (!eligible.length) {
      runs.push(run);
      run = [];
      mem.forEach((x) => (x.frozen = false));
      F.push({ scene: sc(null), say: `Every record in memory is frozen: close run ${runs.length} and start run ${runs.length + 1} with them.`, sfx: 'found' });
      continue;
    }
    const best = eligible.reduce((a, b) => (b.v < a.v ? b : a));
    const pos = mem.indexOf(best);
    F.push({ scene: sc(pos), say: `Smallest unfrozen record in memory: ${best.v} → output to run ${runs.length + 1}.`, sfx: 'pop' });
    run.push(best.v);
    if (i < input.length) {
      const x = input[i++];
      mem[pos] = { v: x, frozen: x < best.v };
      F.push({ scene: sc(null), say: x < best.v ? `Read ${x}: smaller than the last output ${best.v}, so it can't join this run — frozen for the next one.` : `Read ${x} into the freed slot (≥ ${best.v}, can still join this run).`, sfx: 'tick' });
    } else mem.splice(pos, 1);
  }
  if (run.length) runs.push(run);
  F.push({ scene: sc(null), say: `${runs.length} run(s) of lengths ${runs.map((r) => r.length).join(', ')} from memory ${m} — on random input runs average 2m long, halving the runs a simple "sort m at a time" would make.`, sfx: 'found' });
  return F;
}

export function kWayMergeFrames(runs: number[][]): Frame[] {
  const ptr = runs.map(() => 0);
  const out: number[] = [];
  const F: Frame[] = [];
  const sc = (pick: number | null): Scene => {
    const nodes: SNode[] = [];
    runs.forEach((r, ri) => {
      nodes.push({ id: `l${ri}`, x: 20, y: 40 + ri * 44, shape: 'text', label: `run ${ri + 1}`, anchor: 'start', tone: 'muted', fontSize: 11 });
      r.forEach((v, k) => nodes.push({ id: `c${ri}-${k}`, x: 90 + k * 42, y: 40 + ri * 44, w: 38, h: 32, shape: 'rect', label: v, tone: k < ptr[ri] ? 'muted' : k === ptr[ri] ? (ri === pick ? 'active' : 'compare') : 'base', fontSize: 12 }));
    });
    const y = 60 + runs.length * 44;
    nodes.push({ id: 'ol', x: 20, y, shape: 'text', label: 'output', anchor: 'start', tone: 'muted', fontSize: 11 });
    out.forEach((v, k) => nodes.push({ id: `o${k}`, x: 90 + k * 34, y, w: 30, h: 28, shape: 'rect', label: v, tone: 'done', fontSize: 11 }));
    return { w: Math.max(100 + Math.max(...runs.map((r) => r.length)) * 42, 120 + out.length * 34, 420), h: y + 40, nodes };
  };
  F.push({ scene: sc(null), say: `${runs.length}-way merge: keep a pointer into each sorted run; repeatedly output the smallest current head.` });
  for (;;) {
    let best = -1;
    for (let r = 0; r < runs.length; r++) if (ptr[r] < runs[r].length && (best < 0 || runs[r][ptr[r]] < runs[best][ptr[best]])) best = r;
    if (best < 0) break;
    F.push({ scene: sc(best), say: `Heads: ${runs.map((r, ri) => (ptr[ri] < r.length ? r[ptr[ri]] : '—')).join(', ')} → output ${runs[best][ptr[best]]} from run ${best + 1}.`, sfx: 'pop' });
    out.push(runs[best][ptr[best]++]);
  }
  F.push({ scene: sc(null), say: `Merged ${out.length} records in one pass. With k runs, picking the minimum naively costs k − 1 comparisons; a selection (loser) tree makes it ⌈log₂ k⌉.`, sfx: 'found' });
  return F;
}

/** Optimal (2-way) merge pattern: always merge the two smallest. Returns total cost and the merge steps. */
export function optimalMerge(sizes: number[]): { cost: number; steps: [number, number, number][] } {
  const q = [...sizes].sort((a, b) => a - b);
  let cost = 0;
  const steps: [number, number, number][] = [];
  while (q.length > 1) {
    const a = q.shift()!;
    const b = q.shift()!;
    cost += a + b;
    steps.push([a, b, a + b]);
    let i = 0;
    while (i < q.length && q[i] < a + b) i++;
    q.splice(i, 0, a + b);
  }
  return { cost, steps };
}
export function kWayPasses(runs: number, k: number): number {
  let p = 0;
  for (let r = runs; r > 1; r = Math.ceil(r / k)) p++;
  return p;
}

/* =====================================================================
   Lower bound (Level 37): decision tree of insertion sort on 3 elements
   ===================================================================== */
export const log2Fact = (n: number) => {
  let s = 0;
  for (let i = 2; i <= n; i++) s += Math.log2(i);
  return s;
};
export const minCompLowerBound = (n: number) => Math.ceil(log2Fact(n) - 1e-12);

interface DT {
  id: string;
  label: string;
  yes?: DT; // key < a[j] → shift
  no?: DT;
}
/** Builds the decision tree of insertion sort (as in cpp/insertion_sort.cpp) on 3 distinct items named a, b, c. */
export function insertionDecisionTree(): DT {
  const names = ['a', 'b', 'c'];
  const perms = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]];
  let uid = 0;
  const mk = (): DT => ({ id: `d${uid++}`, label: '' });
  const root = mk();
  for (const p of perms) {
    const arr = p.map((v, i) => ({ v, n: names[i] }));
    let node = root;
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;
      while (j >= 0) {
        node.label = `${key.n} < ${arr[j].n}?`;
        if (key.v < arr[j].v) {
          node.yes ??= mk();
          node = node.yes;
          arr[j + 1] = arr[j];
          j--;
        } else {
          node.no ??= mk();
          node = node.no;
          break;
        }
      }
      arr[j + 1] = key;
    }
    node.label = arr.map((x) => x.n).join(' ≤ ');
  }
  return root;
}
const isLeaf = (d: DT) => !d.yes && !d.no;
export const dtLeaves = (d: DT): number => (isLeaf(d) ? 1 : (d.yes ? dtLeaves(d.yes) : 0) + (d.no ? dtLeaves(d.no) : 0));
export const dtHeight = (d: DT): number => (isLeaf(d) ? 0 : 1 + Math.max(d.yes ? dtHeight(d.yes) : 0, d.no ? dtHeight(d.no) : 0));

function decisionScene(t: DT, onPath: Set<string>, current: string | null): Scene {
  const conv = (d: DT): BNode => ({ id: d.id, v: d.label, left: d.yes ? conv(d.yes) : null, right: d.no ? conv(d.no) : null });
  const sc = treeScene(conv(t), { dx: 92, dy: 74, r: 84 });
  const nodes = sc.nodes.map((n) => ({ ...n, shape: 'rect' as const, w: 86, h: 30, fontSize: 11, tone: n.id === current ? ('active' as const) : onPath.has(n.id) ? ('path' as const) : String(n.label).includes('≤') ? ('done' as const) : ('base' as const) }));
  const edges: SEdge[] = [];
  const walk = (d: DT) => {
    if (d.yes) {
      edges.push({ from: d.id, to: d.yes.id, label: 'yes', tone: onPath.has(d.yes.id) ? 'path' : undefined });
      walk(d.yes);
    }
    if (d.no) {
      edges.push({ from: d.id, to: d.no.id, label: 'no', tone: onPath.has(d.no.id) ? 'path' : undefined });
      walk(d.no);
    }
  };
  walk(t);
  return { ...sc, nodes, edges };
}

/** Walk the decision tree for concrete values of a, b, c. */
export function decisionFrames(vals: [number, number, number]): Frame[] {
  const t = insertionDecisionTree();
  const env: Record<string, number> = { a: vals[0], b: vals[1], c: vals[2] };
  const F: Frame[] = [];
  const path = new Set<string>();
  let d: DT = t;
  F.push({ scene: decisionScene(t, path, null), say: `Decision tree of insertion sort on three items: ${dtLeaves(t)} leaves (one per permutation, 3! = 6), height ${dtHeight(t)}. Input a = ${vals[0]}, b = ${vals[1]}, c = ${vals[2]}.` });
  while (!isLeaf(d)) {
    path.add(d.id);
    const m = /^(\w) < (\w)\?$/.exec(d.label)!;
    const ans = env[m[1]] < env[m[2]];
    F.push({ scene: decisionScene(t, path, d.id), say: `${d.label}  ${env[m[1]]} < ${env[m[2]]} is ${ans ? 'true → yes' : 'false → no'}.`, sfx: 'compare' });
    d = (ans ? d.yes : d.no)!;
  }
  path.add(d.id);
  F.push({ scene: decisionScene(t, path, d.id), say: `Leaf reached: ${d.label}. Every comparison sort is some such tree; with n! leaves its height is at least ⌈log₂ n!⌉ = Ω(n log n).`, sfx: 'found' });
  return F;
}
