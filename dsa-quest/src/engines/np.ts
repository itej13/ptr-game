import type { Frame, Scene, SNode, SEdge, Tone } from '../core/types';
import { graphScene, circlePos } from '../core/layouts';
import type { Graph } from './graphs';

/* =====================================================================
   Boolean circuits (Circuit-SAT)
   ===================================================================== */
export interface Gate {
  id: string;
  op: 'AND' | 'OR' | 'NOT';
  in: string[]; // wire names: inputs x1.. or gate ids
}
export interface Circuit {
  name: string;
  inputs: string[];
  gates: Gate[]; // topologically ordered; last gate is the output
  pos: Record<string, [number, number]>;
}

export const CIRCUITS: Circuit[] = [
  {
    name: 'C1: (x1 ∧ x2) ∨ ¬x3, then AND with (x1 ∨ x3)',
    inputs: ['x1', 'x2', 'x3'],
    gates: [
      { id: 'g1', op: 'AND', in: ['x1', 'x2'] },
      { id: 'g2', op: 'NOT', in: ['x3'] },
      { id: 'g3', op: 'OR', in: ['g1', 'g2'] },
      { id: 'g4', op: 'OR', in: ['x1', 'x3'] },
      { id: 'g5', op: 'AND', in: ['g3', 'g4'] },
    ],
    pos: { x1: [50, 60], x2: [50, 160], x3: [50, 260], g1: [190, 100], g2: [190, 260], g3: [320, 170], g4: [320, 300], g5: [450, 230] },
  },
  {
    name: 'C2: x1 ∧ ¬x1 — unsatisfiable',
    inputs: ['x1', 'x2'],
    gates: [
      { id: 'g1', op: 'NOT', in: ['x1'] },
      { id: 'g2', op: 'AND', in: ['x1', 'x2'] },
      { id: 'g3', op: 'AND', in: ['g1', 'g2'] },
    ],
    pos: { x1: [50, 80], x2: [50, 220], g1: [200, 80], g2: [200, 220], g3: [350, 150] },
  },
  {
    name: 'C3: (x1 ⊕ x2) built from AND/OR/NOT, AND x3',
    inputs: ['x1', 'x2', 'x3'],
    gates: [
      { id: 'g1', op: 'OR', in: ['x1', 'x2'] },
      { id: 'g2', op: 'AND', in: ['x1', 'x2'] },
      { id: 'g3', op: 'NOT', in: ['g2'] },
      { id: 'g4', op: 'AND', in: ['g1', 'g3'] },
      { id: 'g5', op: 'AND', in: ['g4', 'x3'] },
    ],
    pos: { x1: [50, 70], x2: [50, 170], x3: [50, 290], g1: [180, 70], g2: [180, 170], g3: [300, 170], g4: [400, 120], g5: [500, 210] },
  },
];

export function evalCircuit(c: Circuit, bits: number[]): Record<string, number> {
  const val: Record<string, number> = {};
  c.inputs.forEach((x, i) => (val[x] = bits[i]));
  for (const g of c.gates) {
    const a = g.in.map((w) => val[w]);
    val[g.id] = g.op === 'NOT' ? 1 - a[0] : g.op === 'AND' ? (a.every((x) => x) ? 1 : 0) : a.some((x) => x) ? 1 : 0;
  }
  return val;
}
export const circuitOut = (c: Circuit, bits: number[]) => evalCircuit(c, bits)[c.gates[c.gates.length - 1].id];
export function satisfyingAssignments(c: Circuit): number[][] {
  const out: number[][] = [];
  for (let m = 0; m < 1 << c.inputs.length; m++) {
    const bits = c.inputs.map((_, i) => (m >> (c.inputs.length - 1 - i)) & 1);
    if (circuitOut(c, bits)) out.push(bits);
  }
  return out;
}

export function circuitFrames(c: Circuit, bits: number[]): Frame[] {
  const known: Record<string, number> = {};
  const F: Frame[] = [];
  const sc = (hi: string | null): Scene => {
    const nodes: SNode[] = [];
    const edges: SEdge[] = [];
    for (const x of c.inputs) nodes.push({ id: x, x: c.pos[x][0], y: c.pos[x][1], w: 54, h: 36, shape: 'rect', label: `${x}=${known[x] ?? '?'}`, tone: known[x] === undefined ? 'base' : known[x] ? 'done' : 'muted', fontSize: 12 });
    for (const g of c.gates) {
      nodes.push({ id: g.id, x: c.pos[g.id][0], y: c.pos[g.id][1], w: 64, h: 40, shape: 'rect', label: `${g.op}${known[g.id] === undefined ? '' : ` → ${known[g.id]}`}`, tone: g.id === hi ? 'active' : known[g.id] === undefined ? 'base' : known[g.id] ? 'done' : 'muted', fontSize: 12 });
      for (const w of g.in) edges.push({ from: w, to: g.id, directed: true, tone: (known[w] === undefined ? undefined : known[w] ? 'done' : 'ghost') as Tone | undefined });
    }
    const maxX = Math.max(...Object.values(c.pos).map((p) => p[0]));
    const maxY = Math.max(...Object.values(c.pos).map((p) => p[1]));
    return { w: maxX + 80, h: maxY + 50, nodes, edges };
  };
  F.push({ scene: sc(null), say: `${c.name}. Assign the inputs and evaluate gates in topological order — this is the polynomial-time verification of a Circuit-SAT certificate.` });
  c.inputs.forEach((x, i) => (known[x] = bits[i]));
  F.push({ scene: sc(null), say: `Inputs: ${c.inputs.map((x, i) => `${x} = ${bits[i]}`).join(', ')}.`, sfx: 'tick' });
  const val = evalCircuit(c, bits);
  for (const g of c.gates) {
    known[g.id] = val[g.id];
    F.push({ scene: sc(g.id), say: `${g.op}(${g.in.map((w) => `${w}=${val[w]}`).join(', ')}) = ${val[g.id]}.`, sfx: 'tick' });
  }
  const out = val[c.gates[c.gates.length - 1].id];
  const sats = satisfyingAssignments(c);
  F.push({ scene: sc(null), say: `Output = ${out}: this assignment ${out ? 'SATISFIES' : 'does not satisfy'} the circuit. Checking took one pass over the gates; finding a satisfying assignment may need all 2^${c.inputs.length} = ${2 ** c.inputs.length} (here ${sats.length} satisfy it).`, sfx: out ? 'found' : 'wrong' });
  return F;
}

/* =====================================================================
   CNF formulas
   ===================================================================== */
export type Clause = number[]; // literals: +i means x_i, −i means ¬x_i (1-based)
export const satisfies = (cnf: Clause[], a: boolean[]) => cnf.every((cl) => cl.some((l) => (l > 0 ? a[l - 1] : !a[-l - 1])));
export function isSatisfiable(cnf: Clause[], n: number): boolean {
  for (let m = 0; m < 1 << n; m++) if (satisfies(cnf, [...Array(n).keys()].map((i) => !!((m >> i) & 1)))) return true;
  return false;
}
export const cnfStr = (cnf: Clause[]) => cnf.map((cl) => `(${cl.map((l) => (l > 0 ? `x${l}` : `¬x${-l}`)).join(' ∨ ')})`).join(' ∧ ');

/* =====================================================================
   Vertex cover, independent set, clique
   ===================================================================== */
export const isVertexCover = (g: Graph, S: number[]) => g.edges.every((e) => S.includes(e.u) || S.includes(e.v));
export function minVertexCover(g: Graph): number[] {
  let best: number[] = [...Array(g.n).keys()];
  for (let m = 0; m < 1 << g.n; m++) {
    const S = [...Array(g.n).keys()].filter((i) => (m >> i) & 1);
    if (S.length < best.length && isVertexCover(g, S)) best = S;
  }
  return best;
}
/** CLRS APPROX-VERTEX-COVER: repeatedly take both endpoints of an uncovered edge (edges in listed order). */
export function approxVertexCover(g: Graph): number[] {
  const C = new Set<number>();
  for (const e of g.edges) if (!C.has(e.u) && !C.has(e.v)) (C.add(e.u), C.add(e.v));
  return [...C].sort((a, b) => a - b);
}
export const isIndependent = (g: Graph, S: number[]) => g.edges.every((e) => !(S.includes(e.u) && S.includes(e.v)));

export function vcFrames(g: Graph, S: number[]): Frame[] {
  const F: Frame[] = [];
  const pos = circlePos(g.n, 210, 180, 140);
  const checked: number[] = [];
  const sc = (cur: number | null, showIS = false): Scene =>
    graphScene({ n: g.n, pos, edges: g.edges }, { w: 430, h: 360, weights: false, nodeTone: (v) => (S.includes(v) ? 'active' : showIS ? 'path' : undefined), edgeTone: (i) => (i === cur ? (S.includes(g.edges[i].u) || S.includes(g.edges[i].v) ? 'done' : 'warn') : checked.includes(i) ? 'done' : undefined) });
  F.push({ scene: sc(null), say: `Certificate: S = {${S.join(', ')}} (|S| = ${S.length}). Verify that every edge has at least one endpoint in S.` });
  let ok = true;
  g.edges.forEach((e, i) => {
    const c = S.includes(e.u) || S.includes(e.v);
    if (c) checked.push(i);
    else ok = false;
    F.push({ scene: sc(i), say: `Edge ${e.u}–${e.v}: ${c ? `covered by ${S.includes(e.u) ? e.u : e.v}` : 'NOT covered'}.`, sfx: c ? 'tick' : 'wrong' });
  });
  F.push({ scene: sc(null), say: ok ? `Valid vertex cover — verified in O(|E|) time. That polynomial-time check is why VERTEX-COVER ∈ NP.` : `Not a vertex cover.`, sfx: ok ? 'found' : 'wrong' });
  if (ok) F.push({ scene: sc(null, true), say: `Reduction view: the other vertices V − S = {${[...Array(g.n).keys()].filter((v) => !S.includes(v)).join(', ')}} form an INDEPENDENT SET (no edge has both ends outside a cover). G has a vertex cover of size k ⇔ an independent set of size n − k ⇔ the complement graph has a clique of size n − k.`, sfx: 'found' });
  return F;
}

/* =====================================================================
   Subset sum
   ===================================================================== */
export function subsetSumDP(a: number[], t: number): boolean {
  const can = Array(t + 1).fill(false);
  can[0] = true;
  for (const x of a) for (let s = t; s >= x; s--) if (can[s - x]) can[s] = true;
  return can[t];
}
export function subsetSumCount(a: number[], t: number): number {
  let c = 0;
  for (let m = 0; m < 1 << a.length; m++) if (a.reduce((s, x, i) => s + ((m >> i) & 1 ? x : 0), 0) === t) c++;
  return c;
}
export function subsetSumFrames(a: number[], t: number): Frame[] {
  const F: Frame[] = [];
  const can: boolean[] = Array(t + 1).fill(false);
  can[0] = true;
  const W = 34;
  const sc = (hiItem: number | null, fresh: Set<number>): Scene => {
    const nodes: SNode[] = [];
    for (let s = 0; s <= t; s++) {
      nodes.push({ id: `s${s}`, x: 40 + (s % 16) * W, y: 70 + Math.floor(s / 16) * 52, w: W - 3, h: 30, shape: 'rect', label: can[s] ? '✓' : '', tone: fresh.has(s) ? 'active' : can[s] ? 'done' : 'ghost', fontSize: 12 });
      nodes.push({ id: `l${s}`, x: 40 + (s % 16) * W, y: 92 + Math.floor(s / 16) * 52, shape: 'text', label: s, tone: s === t ? 'accent' : 'muted', fontSize: 9 });
    }
    nodes.push({ id: 'items', x: 20, y: 24, shape: 'text', label: `items: ${a.map((x, i) => (i === hiItem ? `[${x}]` : x)).join('  ')}   target ${t}`, anchor: 'start', tone: 'accent', fontSize: 13 });
    return { w: Math.max(420, 60 + Math.min(16, t + 1) * W), h: 110 + Math.floor(t / 16) * 52, nodes };
  };
  F.push({ scene: sc(null, new Set([0])), say: `can[s] = "some subset sums to s". Start with can[0] = true (empty set).` });
  a.forEach((x, i) => {
    const fresh = new Set<number>();
    for (let s = t; s >= x; s--)
      if (can[s - x] && !can[s]) {
        can[s] = true;
        fresh.add(s);
      }
    F.push({ scene: sc(i, fresh), say: `Item ${x}: every reachable s gives s + ${x}${fresh.size ? ` — newly reachable: ${[...fresh].sort((p, q) => p - q).join(', ')}` : ' — nothing new'}.`, sfx: fresh.size ? 'push' : 'tick' });
  });
  F.push({ scene: sc(null, new Set()), say: `can[${t}] = ${can[t]}. This DP is O(n·t) — pseudo-polynomial: polynomial in the VALUE t but exponential in its bit length, so it doesn't contradict SUBSET-SUM being NP-complete.`, sfx: can[t] ? 'found' : 'wrong' });
  return F;
}
