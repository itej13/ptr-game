import type { Frame, Scene, SNode, Tone, Ask } from '../core/types';
import { graphScene, circlePos, grid, type GraphDraw } from '../core/layouts';
import type { Rng } from '../core/rng';

/* =====================================================================
   Graph model, parsing, generators
   ===================================================================== */
export interface Edge {
  u: number;
  v: number;
  w: number;
}
export interface Graph {
  n: number;
  edges: Edge[];
  directed: boolean;
  pos?: [number, number][];
}

/** "0-1:4, 1-2:3" (undirected) or "0>1:4" (directed). Weight optional (default 1). */
export function parseGraph(s: string, n: number, directed: boolean, maxN = 10): Graph {
  if (!Number.isInteger(n) || n < 1 || n > maxN) throw new Error(`Number of vertices must be 1–${maxN}.`);
  const parts = s.split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean);
  const edges: Edge[] = parts.map((p) => {
    const m = /^(\d+)\s*([->])\s*(\d+)(?::(-?\d+))?$/.exec(p);
    if (!m) throw new Error(`Can't read edge "${p}". Use ${directed ? '0>1:4' : '0-1:4'}.`);
    const u = +m[1];
    const v = +m[3];
    if (u >= n || v >= n) throw new Error(`Vertex out of range in "${p}" (0..${n - 1}).`);
    if (directed !== (m[2] === '>')) throw new Error(directed ? 'This graph is directed: write u>v.' : 'This graph is undirected: write u-v.');
    return { u, v, w: m[4] === undefined ? 1 : +m[4] };
  });
  if (edges.length > 24) throw new Error('At most 24 edges.');
  return { n, edges, directed };
}

export function adjList(g: Graph): number[][] {
  const adj: number[][] = Array.from({ length: g.n }, () => []);
  for (const e of g.edges) {
    adj[e.u].push(e.v);
    if (!g.directed) adj[e.v].push(e.u);
  }
  adj.forEach((l) => l.sort((a, b) => a - b));
  return adj;
}
export function weightedAdj(g: Graph): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: g.n }, () => []);
  for (const e of g.edges) {
    adj[e.u].push([e.v, e.w]);
    if (!g.directed) adj[e.v].push([e.u, e.w]);
  }
  return adj;
}

export function randomGraph(rng: Rng, n: number, m: number, o: { directed?: boolean; connected?: boolean; wmin?: number; wmax?: number; simple?: boolean; dag?: boolean } = {}): Graph {
  const { directed = false, connected = false, wmin = 1, wmax = 9, simple = true, dag = false } = o;
  const edges: Edge[] = [];
  const has = new Set<string>();
  const key = (u: number, v: number) => (directed ? `${u}>${v}` : `${Math.min(u, v)}-${Math.max(u, v)}`);
  const add = (u: number, v: number) => {
    if (u === v) return false;
    if (dag && u > v) [u, v] = [v, u];
    if (simple && has.has(key(u, v))) return false;
    has.add(key(u, v));
    edges.push({ u, v, w: rng.int(wmin, wmax) });
    return true;
  };
  if (connected) {
    const order = rng.shuffle([...Array(n).keys()]);
    for (let i = 1; i < n; i++) add(order[rng.int(0, i - 1)], order[i]);
  }
  let guard = 0;
  while (edges.length < m && guard++ < 500) add(rng.int(0, n - 1), rng.int(0, n - 1));
  return { n, edges: rng.shuffle(edges), directed };
}

const draw = (g: Graph): GraphDraw => ({ n: g.n, pos: g.pos ?? circlePos(g.n, 210, 180, 140), edges: g.edges, directed: g.directed });
export const graphStatic = (g: Graph, weights = true) => graphScene(draw(g), { weights, w: 430, h: 360 });
export const edgeStr = (e: Edge, g: Graph, w = false) => `${e.u}${g.directed ? '→' : '–'}${e.v}${w ? `(${e.w})` : ''}`;
export const graphText = (g: Graph, weighted = false) => g.edges.map((e) => `${e.u}${g.directed ? '>' : '-'}${e.v}${weighted ? `:${e.w}` : ''}`).join(', ');

/* =====================================================================
   Traversals & components (Level 39) — mirror cpp/graph_traversal.cpp
   ===================================================================== */
export function dfsOrder(adj: number[][], s: number): number[] {
  const seen = new Array(adj.length).fill(false);
  const out: number[] = [];
  const go = (u: number) => {
    seen[u] = true;
    out.push(u);
    for (const v of adj[u]) if (!seen[v]) go(v);
  };
  go(s);
  return out;
}
export function bfsOrder(adj: number[][], s: number): number[] {
  const seen = new Array(adj.length).fill(false);
  const out: number[] = [];
  const q = [s];
  seen[s] = true;
  while (q.length) {
    const u = q.shift()!;
    out.push(u);
    for (const v of adj[u])
      if (!seen[v]) {
        seen[v] = true;
        q.push(v);
      }
  }
  return out;
}
export function components(adj: number[][]): number[][] {
  const seen = new Array(adj.length).fill(false);
  const comps: number[][] = [];
  for (let s = 0; s < adj.length; s++) {
    if (seen[s]) continue;
    const c: number[] = [];
    const go = (u: number) => {
      seen[u] = true;
      c.push(u);
      for (const v of adj[u]) if (!seen[v]) go(v);
    };
    go(s);
    comps.push(c);
  }
  return comps;
}

export function traversalFrames(g: Graph, s: number, kind: 'dfs' | 'bfs', predict = false): Frame[] {
  const adj = adjList(g);
  const F: Frame[] = [];
  const order: number[] = [];
  const visited = new Set<number>();
  const treeEdges: string[] = [];
  const pend: number[] = [];
  const sc = (cur: number | null, scanning?: number): Scene => {
    const d = draw(g);
    const base = graphScene(d, {
      weights: false,
      w: 430,
      h: 360,
      nodeTone: (v) => (v === cur ? 'active' : v === scanning ? 'compare' : visited.has(v) ? 'done' : pend.includes(v) ? 'path' : undefined),
      edgeTone: (i) => {
        const e = g.edges[i];
        return treeEdges.includes(`${e.u}-${e.v}`) || treeEdges.includes(`${e.v}-${e.u}`) ? 'done' : undefined;
      },
      sub: (v) => (order.includes(v) ? `#${order.indexOf(v) + 1}` : undefined),
    });
    const extra: SNode[] = [
      { id: 'ol', x: 450, y: 30, shape: 'text', label: 'visit order', anchor: 'start', tone: 'muted', fontSize: 11 },
      ...order.map((v, i) => ({ id: `o${i}`, x: 470 + (i % 6) * 34, y: 60 + Math.floor(i / 6) * 34, w: 30, h: 28, shape: 'rect' as const, label: v, tone: 'done' as const, fontSize: 12 })),
      { id: 'ql', x: 450, y: 170, shape: 'text', label: kind === 'bfs' ? 'queue (front → rear)' : 'recursion stack', anchor: 'start', tone: 'muted', fontSize: 11 },
      ...pend.map((v, i) => ({ id: `p${i}-${v}`, x: 470 + i * 34, y: 200, w: 30, h: 28, shape: 'rect' as const, label: v, tone: 'path' as const, fontSize: 12 })),
    ];
    return { ...base, w: 700, nodes: [...base.nodes, ...extra] };
  };
  F.push({ scene: sc(null), say: `${kind.toUpperCase()} from ${s}. Neighbours are tried in increasing order (sorted adjacency lists).` });
  if (kind === 'dfs') {
    const go = (u: number, parent: number | null, ask?: Ask) => {
      visited.add(u);
      order.push(u);
      pend.push(u);
      if (parent !== null) treeEdges.push(`${parent}-${u}`);
      F.push({ scene: sc(u), line: 'dfs-visit', say: `Visit ${u}${parent !== null ? ` (tree edge ${parent}–${u})` : ''}.`, sfx: 'pop', vars: { order: order.join(' ') }, ask });
      for (const v of adj[u]) {
        if (visited.has(v)) {
          F.push({ scene: sc(u, v), line: 'dfs-check', say: `${u}: neighbour ${v} already visited — skip.` });
          continue;
        }
        const others = [...Array(g.n).keys()].filter((x) => !visited.has(x) && x !== v);
        go(v, u, predict ? { prompt: `DFS is at ${u}. Which vertex is visited next?`, options: [v, ...others].slice(0, 4).map(String), answer: 0, hint: 'Smallest unvisited neighbour of the current vertex; backtrack only when none is left.' } : undefined);
      }
      pend.pop();
      F.push({ scene: sc(pend[pend.length - 1] ?? null), line: 'dfs-loop', say: `${u} finished — backtrack${pend.length ? ` to ${pend[pend.length - 1]}` : ''}.` });
    };
    go(s, null);
  } else {
    visited.add(s);
    pend.push(s);
    F.push({ scene: sc(s), line: 'bfs-start', say: `Mark ${s} and enqueue it.`, sfx: 'push' });
    while (pend.length) {
      const u = pend.shift()!;
      order.push(u);
      F.push({ scene: sc(u), line: 'bfs-deq', say: `Dequeue ${u} and visit it.`, sfx: 'pop', vars: { order: order.join(' ') } });
      const added: number[] = [];
      for (const v of adj[u])
        if (!visited.has(v)) {
          visited.add(v);
          pend.push(v);
          treeEdges.push(`${u}-${v}`);
          added.push(v);
        }
      F.push({
        scene: sc(u),
        line: 'bfs-mark',
        say: added.length ? `Unvisited neighbours of ${u}: ${added.join(', ')} — mark them and enqueue (in that order).` : `${u} has no unvisited neighbours.`,
        sfx: added.length ? 'push' : 'tick',
        ask: predict && pend.length ? { prompt: `Which vertex will BFS visit next?`, options: [...new Set([pend[0], ...pend.slice(1), ...adj[u]])].slice(0, 4).map(String), answer: 0, hint: 'The front of the queue.' } : undefined,
      });
    }
  }
  const comps = components(adj);
  F.push({ scene: sc(null), say: `${kind.toUpperCase()} order: ${order.join(' ')}. ${order.length < g.n ? `Only ${order.length} of ${g.n} vertices reached — the graph has ${comps.length} connected components.` : 'All vertices reached: connected.'}`, sfx: 'found' });
  return F;
}

/* =====================================================================
   Cut vertices & bridges (Level 40)
   ===================================================================== */
export function tarjan(g: Graph): { cut: number[]; bridges: [number, number][]; disc: number[]; low: number[] } {
  const adj = adjList(g);
  const n = g.n;
  const disc = Array(n).fill(0);
  const low = Array(n).fill(0);
  const isCut = Array(n).fill(false);
  const bridges: [number, number][] = [];
  let timer = 0;
  const go = (u: number, p: number) => {
    disc[u] = low[u] = ++timer;
    let children = 0;
    for (const v of adj[u]) {
      if (disc[v] === 0) {
        children++;
        go(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (p !== -1 && low[v] >= disc[u]) isCut[u] = true;
        if (low[v] > disc[u]) bridges.push([Math.min(u, v), Math.max(u, v)]);
      } else if (v !== p) low[u] = Math.min(low[u], disc[v]);
    }
    if (p === -1 && children > 1) isCut[u] = true;
  };
  for (let u = 0; u < n; u++) if (!disc[u]) go(u, -1);
  bridges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return { cut: [...Array(n).keys()].filter((u) => isCut[u]), bridges, disc, low };
}
/** Brute force: a vertex is a cut vertex if deleting it increases the number of components. */
export function cutBrute(g: Graph): number[] {
  const base = components(adjList(g)).length;
  const out: number[] = [];
  for (let x = 0; x < g.n; x++) {
    const sub: Graph = { n: g.n, directed: false, edges: g.edges.filter((e) => e.u !== x && e.v !== x) };
    if (components(adjList(sub)).length - 1 > base) out.push(x);
  }
  return out;
}

export function articulationFrames(g: Graph): Frame[] {
  const adj = adjList(g);
  const n = g.n;
  const disc = Array(n).fill(0);
  const low = Array(n).fill(0);
  const isCut = Array(n).fill(false);
  const bridges: string[] = [];
  let timer = 0;
  const F: Frame[] = [];
  const sc = (cur: number | null): Scene =>
    graphScene(draw(g), {
      weights: false,
      w: 430,
      h: 360,
      nodeTone: (v) => (v === cur ? 'active' : isCut[v] ? 'warn' : disc[v] ? 'done' : undefined),
      edgeTone: (i) => (bridges.includes(`${Math.min(g.edges[i].u, g.edges[i].v)}-${Math.max(g.edges[i].u, g.edges[i].v)}`) ? 'warn' : undefined),
      sub: (v) => (disc[v] ? `${disc[v]}/${low[v]}` : undefined),
    });
  F.push({ scene: sc(null), say: 'Labels show disc/low. disc = DFS discovery time; low = smallest disc reachable from the subtree with one back edge.' });
  const go = (u: number, p: number) => {
    disc[u] = low[u] = ++timer;
    F.push({ scene: sc(u), line: 'ap-num', say: `Discover ${u}: disc = low = ${timer}.`, sfx: 'tick' });
    let children = 0;
    for (const v of adj[u]) {
      if (!disc[v]) {
        children++;
        go(v, u);
        low[u] = Math.min(low[u], low[v]);
        const isC = p !== -1 && low[v] >= disc[u];
        if (isC) isCut[u] = true;
        if (low[v] > disc[u]) bridges.push(`${Math.min(u, v)}-${Math.max(u, v)}`);
        F.push({
          scene: sc(u),
          line: low[v] > disc[u] ? 'ap-bridge' : isC ? 'ap-cut' : 'ap-low',
          say: `Back at ${u} from child ${v}: low[${u}] = min(low[${u}], low[${v}]) = ${low[u]}. ${p !== -1 ? (low[v] >= disc[u] ? `low[${v}] = ${low[v]} ≥ disc[${u}] = ${disc[u]} ⇒ ${u} is a CUT VERTEX.` : `low[${v}] < disc[${u}]: ${v}'s subtree reaches above ${u}.`) : ''} ${low[v] > disc[u] ? `low[${v}] > disc[${u}] ⇒ ${u}–${v} is a BRIDGE.` : ''}`,
          sfx: isC || low[v] > disc[u] ? 'found' : 'tick',
        });
      } else if (v !== p) {
        if (disc[v] < low[u]) {
          low[u] = disc[v];
          F.push({ scene: sc(u), line: 'ap-back', say: `Back edge ${u}–${v}: low[${u}] = min(low[${u}], disc[${v}]) = ${low[u]}.`, sfx: 'compare' });
        }
      }
    }
    if (p === -1) {
      if (children > 1) isCut[u] = true;
      F.push({ scene: sc(u), line: 'ap-root', say: `Root ${u} has ${children} DFS child(ren): ${children > 1 ? 'it IS a cut vertex' : 'not a cut vertex'}.` });
    }
  };
  for (let u = 0; u < n; u++) if (!disc[u]) go(u, -1);
  const t = tarjan(g);
  F.push({ scene: sc(null), say: `Cut vertices: ${t.cut.join(', ') || 'none'}. Bridges: ${t.bridges.map(([a, b]) => `${a}–${b}`).join(', ') || 'none'}.`, sfx: 'found' });
  return F;
}

/* =====================================================================
   Disjoint sets (Level 41) — mirror cpp/disjoint_set.cpp
   ===================================================================== */
export class DSU {
  parent: number[];
  sz: number[];
  constructor(n: number) {
    this.parent = [...Array(n).keys()];
    this.sz = Array(n).fill(1);
  }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  unite(a: number, b: number): boolean {
    a = this.find(a);
    b = this.find(b);
    if (a === b) return false;
    if (this.sz[a] < this.sz[b]) [a, b] = [b, a];
    this.parent[b] = a;
    this.sz[a] += this.sz[b];
    return true;
  }
}
export type DsuOp = { k: 'u'; a: number; b: number } | { k: 'f'; x: number };

export function dsuFrames(n: number, ops: DsuOp[]): Frame[] {
  const d = new DSU(n);
  const F: Frame[] = [];
  const sc = (hi: number[] = []): Scene => {
    // forest layout: roots spaced, children below
    const kids: number[][] = Array.from({ length: n }, () => []);
    for (let i = 0; i < n; i++) if (d.parent[i] !== i) kids[d.parent[i]].push(i);
    const nodes: SNode[] = [];
    const edges: { from: string; to: string; directed: boolean }[] = [];
    let x = 40;
    const place = (v: number, depth: number): number => {
      let cx: number;
      if (!kids[v].length) {
        cx = x;
        x += 52;
      } else {
        const xs = kids[v].map((c) => place(c, depth + 1));
        cx = (xs[0] + xs[xs.length - 1]) / 2;
      }
      nodes.push({ id: `v${v}`, x: cx, y: 50 + depth * 62, w: 38, label: v, sub: d.parent[v] === v ? `size ${d.sz[v]}` : undefined, subPos: 'above', tone: hi.includes(v) ? 'active' : d.parent[v] === v ? 'accent' : 'base' });
      for (const c of kids[v]) edges.push({ from: `v${c}`, to: `v${v}`, directed: true });
      return cx;
    };
    for (let r = 0; r < n; r++) if (d.parent[r] === r) place(r, 0);
    const pr = grid([d.parent.map(String)], { x: 70, y: 300, cw: 40, colHead: [...Array(n).keys()], rowHead: ['parent'], key: 'par' });
    return { w: Math.max(x + 20, pr.w + 20, 420), h: 360, nodes: [...nodes, ...pr.nodes], edges };
  };
  F.push({ scene: sc(), line: 'make', say: `makeSet(${n}): every element is its own root (parent[i] = i, size 1).` });
  for (const o of ops) {
    if (o.k === 'f') {
      const before = d.parent.slice();
      const r = d.find(o.x);
      const changed = before.some((p, i) => p !== d.parent[i]);
      F.push({ scene: sc([o.x, r]), line: 'find-compress', say: `findSet(${o.x}) = ${r}.${changed ? ' Path compression re-pointed every node on the path straight to the root.' : ''}`, sfx: 'found' });
    } else {
      const ra = d.find(o.a);
      const rb = d.find(o.b);
      const sa = d.sz[ra];
      const sb = d.sz[rb];
      const ok = d.unite(o.a, o.b);
      const [big, small] = sa < sb ? [rb, ra] : [ra, rb];
      F.push({
        scene: sc([o.a, o.b]),
        line: ok ? 'u-link' : 'u-same',
        say: ok ? `unite(${o.a}, ${o.b}): roots ${ra} (size ${sa}) and ${rb} (size ${sb}). The smaller tree goes under the larger root: parent[${small}] = ${big}${sa === sb ? ' (equal sizes: the second root goes under the first)' : ''}.` : `unite(${o.a}, ${o.b}): both already have root ${ra} — same set (in Kruskal this edge would form a cycle).`,
        sfx: ok ? 'swap' : 'wrong',
      });
    }
  }
  return F;
}

/* =====================================================================
   MST: Kruskal and Prim (Level 42)
   ===================================================================== */
export function kruskal(g: Graph): { total: number; mst: Edge[]; considered: { e: Edge; taken: boolean }[] } {
  const es = [...g.edges].sort((a, b) => a.w - b.w); // stable in JS
  const d = new DSU(g.n);
  const mst: Edge[] = [];
  const considered: { e: Edge; taken: boolean }[] = [];
  let total = 0;
  for (const e of es) {
    const ok = d.unite(e.u, e.v);
    considered.push({ e, taken: ok });
    if (ok) {
      mst.push(e);
      total += e.w;
    }
  }
  return { total, mst, considered };
}
export function prim(g: Graph): { total: number; parent: number[]; order: number[] } {
  const n = g.n;
  const W: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (const e of g.edges) W[e.u][e.v] = W[e.v][e.u] = e.w; // later edges overwrite, as in the harness
  const key = Array(n).fill(Infinity);
  const inT = Array(n).fill(false);
  const parent = Array(n).fill(-1);
  const order: number[] = [];
  key[0] = 0;
  let total = 0;
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!inT[v] && (u === -1 || key[v] < key[u])) u = v;
    inT[u] = true;
    order.push(u);
    total += key[u];
    for (let v = 0; v < n; v++)
      if (W[u][v] && !inT[v] && W[u][v] < key[v]) {
        key[v] = W[u][v];
        parent[v] = u;
      }
  }
  return { total, parent, order };
}

export function kruskalFrames(g: Graph, predict = false): Frame[] {
  const r = kruskal(g);
  const taken = new Set<Edge>();
  const rejected = new Set<Edge>();
  const F: Frame[] = [];
  const sc = (cur?: Edge): Scene =>
    graphScene(draw(g), { w: 430, h: 360, edgeTone: (i) => (g.edges[i] === cur ? 'active' : taken.has(g.edges[i]) ? 'done' : rejected.has(g.edges[i]) ? 'ghost' : undefined), nodeTone: () => undefined });
  F.push({ scene: sc(), line: 'k-sort', say: `Sort the ${g.edges.length} edges by weight: ${r.considered.map((c) => `${c.e.u}–${c.e.v}(${c.e.w})`).join(', ')}.` });
  for (const c of r.considered) {
    const ask: Ask | undefined = predict ? { prompt: `Edge ${c.e.u}–${c.e.v} (weight ${c.e.w}): take it or reject it?`, options: c.taken ? ['Take it', 'Reject (cycle)'] : ['Reject (cycle)', 'Take it'], answer: 0, hint: 'Reject exactly when both ends are already connected by chosen edges.' } : undefined;
    if (c.taken) taken.add(c.e);
    else rejected.add(c.e);
    F.push({ scene: sc(c.e), line: c.taken ? 'k-take' : 'k-unite', say: c.taken ? `${c.e.u}–${c.e.v} (${c.e.w}) joins two different components: take it.` : `${c.e.u}–${c.e.v} (${c.e.w}): ${c.e.u} and ${c.e.v} are already connected — would form a cycle, reject.`, sfx: c.taken ? 'push' : 'wrong', ask, vars: { 'MST weight': [...taken].reduce((s, e) => s + e.w, 0) } });
    if (taken.size === g.n - 1) {
      F.push({ scene: sc(), say: `${g.n - 1} edges chosen — the spanning tree is complete; the remaining edges can be skipped.` });
      break;
    }
  }
  F.push({ scene: sc(), say: `MST weight ${r.total}${r.mst.length < g.n - 1 ? ' — graph is disconnected, this is a minimum spanning FOREST' : ''}. Time O(E log E) for sorting.`, sfx: 'found' });
  return F;
}

export function primFrames(g: Graph, predict = false): Frame[] {
  const n = g.n;
  const W: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (const e of g.edges) W[e.u][e.v] = W[e.v][e.u] = e.w;
  const key = Array(n).fill(Infinity);
  const inT = Array(n).fill(false);
  const parent = Array(n).fill(-1);
  key[0] = 0;
  const F: Frame[] = [];
  const isTree = (e: Edge) => (parent[e.v] === e.u && inT[e.v]) || (parent[e.u] === e.v && inT[e.u]);
  const sc = (cur: number | null): Scene => {
    const base = graphScene(draw(g), { w: 430, h: 360, nodeTone: (v) => (v === cur ? 'active' : inT[v] ? 'done' : undefined), edgeTone: (i) => (isTree(g.edges[i]) ? 'done' : undefined), sub: (v) => (inT[v] ? undefined : key[v] === Infinity ? '∞' : `key ${key[v]}`) });
    const t = grid([key.map((k) => (k === Infinity ? '∞' : k)), parent.map((p) => (p === -1 ? '–' : p))], { x: 500, y: 60, cw: 34, colHead: [...Array(n).keys()], rowHead: ['key', 'π'], key: 'kt', tone: (r, c) => (inT[c] ? 'done' : c === cur ? 'active' : undefined) });
    return { ...base, w: Math.max(base.w, t.w + 40), nodes: [...base.nodes, ...t.nodes] };
  };
  F.push({ scene: sc(null), line: 'p-start', say: 'Start from vertex 0: key[0] = 0, all other keys ∞.' });
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!inT[v] && (u === -1 || key[v] < key[u])) u = v;
    if (key[u] === Infinity) {
      F.push({ scene: sc(null), say: 'Remaining vertices are unreachable — the graph is disconnected.', sfx: 'wrong' });
      break;
    }
    const cand = [...Array(n).keys()].filter((v) => !inT[v] && key[v] !== Infinity);
    inT[u] = true;
    F.push({
      scene: sc(u),
      line: 'p-add',
      say: `Smallest key among vertices outside the tree: ${u} (key ${key[u]}${parent[u] >= 0 ? `, via edge ${parent[u]}–${u}` : ''}). Add it.`,
      sfx: 'push',
      ask: predict && it > 0 ? { prompt: 'Which vertex joins the tree next?', options: [...new Set([u, ...cand.filter((v) => v !== u)])].slice(0, 4).map(String), answer: 0, hint: 'The non-tree vertex with the smallest key (ties: smaller index).' } : undefined,
    });
    const upd: string[] = [];
    for (let v = 0; v < n; v++)
      if (W[u][v] && !inT[v] && W[u][v] < key[v]) {
        key[v] = W[u][v];
        parent[v] = u;
        upd.push(`${v}→${W[u][v]}`);
      }
    if (upd.length) F.push({ scene: sc(u), line: 'p-update', say: `Edges from ${u} lower these keys: ${upd.join(', ')}.`, sfx: 'tick' });
  }
  const total = [...Array(n).keys()].reduce((s, v) => s + (parent[v] >= 0 ? W[parent[v]][v] : 0), 0);
  F.push({ scene: sc(null), say: `MST weight ${total}. This array version is O(V²); with a binary heap it is O(E log V).`, sfx: 'found' });
  return F;
}

/* =====================================================================
   Shortest paths (Levels 43–44)
   ===================================================================== */
export function dijkstra(g: Graph, s: number): { dist: number[]; order: number[]; parent: number[] } {
  const adj = weightedAdj(g);
  const dist = Array(g.n).fill(Infinity);
  const parent = Array(g.n).fill(-1);
  const order: number[] = [];
  dist[s] = 0;
  const pq: [number, number][] = [[0, s]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const [d, u] = pq.shift()!;
    if (d > dist[u]) continue;
    order.push(u);
    for (const [v, w] of adj[u])
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        parent[v] = u;
        pq.push([dist[v], v]);
      }
  }
  return { dist, order, parent };
}
export function bellmanFord(g: Graph, s: number): { dist: number[]; negCycle: boolean } {
  const dist = Array(g.n).fill(Infinity);
  dist[s] = 0;
  const es = g.directed ? g.edges : g.edges.flatMap((e) => [e, { u: e.v, v: e.u, w: e.w }]);
  for (let i = 1; i <= g.n - 1; i++) for (const e of es) if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) dist[e.v] = dist[e.u] + e.w;
  const negCycle = es.some((e) => dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]);
  return { dist, negCycle };
}

export function dijkstraFrames(g: Graph, s: number, predict = false): Frame[] {
  const adj = weightedAdj(g);
  const n = g.n;
  const dist = Array(n).fill(Infinity);
  const parent = Array(n).fill(-1);
  const done = Array(n).fill(false);
  dist[s] = 0;
  const F: Frame[] = [];
  const treeEdge = (e: Edge) => (parent[e.v] === e.u && done[e.v]) || (!g.directed && parent[e.u] === e.v && done[e.u]);
  const sc = (cur: number | null, relaxing?: Edge): Scene => {
    const base = graphScene(draw(g), { w: 430, h: 360, nodeTone: (v) => (v === cur ? 'active' : done[v] ? 'done' : dist[v] < Infinity ? 'compare' : undefined), edgeTone: (i) => (g.edges[i] === relaxing ? 'active' : treeEdge(g.edges[i]) ? 'path' : undefined), sub: (v) => (dist[v] === Infinity ? '∞' : dist[v]) });
    const t = grid([dist.map((d) => (d === Infinity ? '∞' : d)), parent.map((p) => (p === -1 ? '–' : p))], { x: 500, y: 60, cw: 34, colHead: [...Array(n).keys()], rowHead: ['dist', 'π'], key: 'dt', tone: (_, c) => (done[c] ? 'done' : c === cur ? 'active' : undefined) });
    return { ...base, w: Math.max(base.w, t.w + 40), nodes: [...base.nodes, ...t.nodes] };
  };
  F.push({ scene: sc(null), line: 'd-init', say: `dist[${s}] = 0, every other dist = ∞. Repeatedly finalise the closest unfinished vertex.` });
  for (;;) {
    let u = -1;
    for (let v = 0; v < n; v++) if (!done[v] && dist[v] < Infinity && (u === -1 || dist[v] < dist[u])) u = v;
    if (u === -1) break;
    const cand = [...Array(n).keys()].filter((v) => !done[v] && dist[v] < Infinity);
    done[u] = true;
    F.push({ scene: sc(u), line: 'd-pop', say: `Closest unfinished vertex: ${u} with dist ${dist[u]} — now final (no shorter path can appear, since all weights are ≥ 0).`, sfx: 'pop', ask: predict && cand.length > 1 ? { prompt: 'Which vertex is finalised next?', options: [...new Set([u, ...cand.filter((v) => v !== u)])].slice(0, 4).map(String), answer: 0, hint: 'Smallest tentative distance among unfinished vertices.' } : undefined });
    for (const [v, w] of adj[u]) {
      if (done[v]) continue;
      const e = g.edges.find((x) => (x.u === u && x.v === v) || (!g.directed && x.u === v && x.v === u))!;
      if (dist[u] + w < dist[v]) {
        const old = dist[v];
        dist[v] = dist[u] + w;
        parent[v] = u;
        F.push({ scene: sc(u, e), line: 'd-update', say: `Relax ${u}→${v}: ${dist[u]} + ${w} = ${dist[v]} < ${old === Infinity ? '∞' : old} ⇒ dist[${v}] = ${dist[v]}, π[${v}] = ${u}.`, sfx: 'tick' });
      } else F.push({ scene: sc(u, e), line: 'd-relax', say: `Relax ${u}→${v}: ${dist[u]} + ${w} = ${dist[u] + w} ≥ ${dist[v]} — no change.` });
    }
  }
  F.push({ scene: sc(null), say: `Final distances from ${s}: ${dist.map((d, v) => `${v}:${d === Infinity ? '∞' : d}`).join('  ')}.`, sfx: 'found' });
  return F;
}

export function bellmanFordFrames(g: Graph, s: number): Frame[] {
  const n = g.n;
  const dist = Array(n).fill(Infinity);
  dist[s] = 0;
  const F: Frame[] = [];
  const sc = (hi?: Edge, round?: number): Scene => {
    const base = graphScene(draw(g), { w: 430, h: 360, edgeTone: (i) => (g.edges[i] === hi ? 'active' : undefined), sub: (v) => (dist[v] === Infinity ? '∞' : dist[v]) });
    const t = grid([dist.map((d) => (d === Infinity ? '∞' : d))], { x: 500, y: 60, cw: 34, colHead: [...Array(n).keys()], rowHead: ['dist'], key: 'bt' });
    const nodes: SNode[] = [...base.nodes, ...t.nodes];
    if (round) nodes.push({ id: 'round', x: 500, y: 140, shape: 'text', label: `round ${round} of ${n - 1}`, anchor: 'start', tone: 'accent', fontSize: 13 });
    return { ...base, w: Math.max(base.w, t.w + 40), nodes };
  };
  F.push({ scene: sc(), line: 'bf-init', say: `dist[${s}] = 0. Relax every edge, in the listed order, ${n - 1} times.` });
  for (let i = 1; i <= n - 1; i++) {
    let changed = false;
    for (const e of g.edges) {
      if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) {
        dist[e.v] = dist[e.u] + e.w;
        changed = true;
        F.push({ scene: sc(e, i), line: 'bf-update', say: `Round ${i}: relax ${e.u}→${e.v} (${e.w}) ⇒ dist[${e.v}] = ${dist[e.v]}.`, sfx: 'tick' });
      }
    }
    if (!changed) {
      F.push({ scene: sc(undefined, i), line: 'bf-round', say: `Round ${i}: nothing changed — distances are final (the code would still run the remaining rounds).` });
      break;
    }
  }
  const neg = g.edges.find((e) => dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]);
  F.push({ scene: sc(neg), line: neg ? 'bf-neg' : 'bf-check', say: neg ? `Extra check: ${neg.u}→${neg.v} can STILL be relaxed after ${n - 1} rounds ⇒ a negative-weight cycle is reachable. Return false.` : `Extra check: no edge can be relaxed ⇒ no negative cycle. Distances: ${dist.map((d, v) => `${v}:${d === Infinity ? '∞' : d}`).join('  ')}.`, sfx: neg ? 'wrong' : 'found' });
  return F;
}

/* =====================================================================
   Warshall (Level 45)
   ===================================================================== */
export function warshall(m: number[][]): number[][] {
  const R = m.map((r) => r.slice());
  const n = R.length;
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) R[i][j] = R[i][j] || (R[i][k] && R[k][j]) ? 1 : 0;
  return R;
}
export const adjMatrix = (g: Graph): number[][] => {
  const M = Array.from({ length: g.n }, () => Array(g.n).fill(0));
  for (const e of g.edges) {
    M[e.u][e.v] = 1;
    if (!g.directed) M[e.v][e.u] = 1;
  }
  return M;
};
export function warshallFrames(g: Graph): Frame[] {
  const n = g.n;
  const R = adjMatrix(g);
  const F: Frame[] = [];
  const sc = (k: number | null, fresh: Set<string>): Scene => {
    const gr = grid(R.map((r) => r.slice()), { x: 480, y: 60, cw: 34, rowHead: [...Array(n).keys()], colHead: [...Array(n).keys()], key: 'R', tone: (i, j) => (fresh.has(`${i},${j}`) ? 'active' : k !== null && (i === k || j === k) ? 'compare' : R[i][j] ? 'done' : 'ghost') });
    const base = graphScene(draw(g), { w: 430, h: 360, weights: false, nodeTone: (v) => (v === k ? 'active' : undefined) });
    return { ...base, w: gr.w + 20, nodes: [...base.nodes, ...gr.nodes] };
  };
  F.push({ scene: sc(null, new Set()), say: 'R⁽⁻¹⁾ = adjacency matrix. Step k allows vertex k as an intermediate: R[i][j] |= R[i][k] && R[k][j].' });
  for (let k = 0; k < n; k++) {
    const fresh = new Set<string>();
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!R[i][j] && R[i][k] && R[k][j]) fresh.add(`${i},${j}`);
    for (const c of fresh) {
      const [i, j] = c.split(',').map(Number);
      R[i][j] = 1;
    }
    F.push({ scene: sc(k, fresh), line: 'w-update', say: fresh.size ? `k = ${k}: new paths through ${k}: ${[...fresh].map((c) => c.replace(',', '→')).join(', ')}.` : `k = ${k}: no new pairs (row ${k} and column ${k} highlighted).`, sfx: fresh.size ? 'push' : 'tick' });
  }
  F.push({ scene: sc(null, new Set()), say: 'Final matrix = transitive closure A⁺: R[i][j] = 1 iff j is reachable from i by a path of length ≥ 1. (A* would also set every R[i][i] = 1.)', sfx: 'found' });
  return F;
}

/* =====================================================================
   Activity networks (Level 46)
   ===================================================================== */
export function kahn(n: number, adj: number[][]): number[] {
  const indeg = Array(n).fill(0);
  adj.forEach((l) => l.forEach((v) => indeg[v]++));
  const q: number[] = [];
  for (let u = 0; u < n; u++) if (!indeg[u]) q.push(u);
  const out: number[] = [];
  while (q.length) {
    const u = q.shift()!;
    out.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
  }
  return out;
}
export const isTopoOrder = (g: Graph, order: number[]) => order.length === g.n && new Set(order).size === g.n && g.edges.every((e) => order.indexOf(e.u) < order.indexOf(e.v));

export function topoFrames(g: Graph, predict = false): Frame[] {
  const adj = adjList(g);
  const n = g.n;
  const indeg = Array(n).fill(0);
  adj.forEach((l) => l.forEach((v) => indeg[v]++));
  const removed = new Set<number>();
  const order: number[] = [];
  const q: number[] = [];
  for (let u = 0; u < n; u++) if (!indeg[u]) q.push(u);
  const F: Frame[] = [];
  const sc = (cur: number | null): Scene => {
    const base = graphScene(draw(g), { w: 430, h: 360, weights: false, nodeTone: (v) => (v === cur ? 'active' : removed.has(v) ? 'done' : q.includes(v) ? 'compare' : undefined), edgeTone: (i) => (removed.has(g.edges[i].u) ? 'ghost' : undefined), sub: (v) => (removed.has(v) ? `#${order.indexOf(v) + 1}` : `in ${indeg[v]}`) });
    const nodes: SNode[] = [...base.nodes, { id: 'ql', x: 450, y: 40, shape: 'text', label: 'queue', anchor: 'start', tone: 'muted', fontSize: 11 }, ...q.map((v, i) => ({ id: `q${v}`, x: 470 + i * 34, y: 70, w: 30, h: 28, shape: 'rect' as const, label: v, tone: 'compare' as Tone })), { id: 'orl', x: 450, y: 120, shape: 'text', label: 'topological order', anchor: 'start', tone: 'muted', fontSize: 11 }, ...order.map((v, i) => ({ id: `o${v}`, x: 470 + i * 34, y: 150, w: 30, h: 28, shape: 'rect' as const, label: v, tone: 'done' as Tone }))];
    return { ...base, w: Math.max(700, 500 + n * 34), nodes };
  };
  F.push({ scene: sc(null), line: 't-seed', say: `In-degrees computed. Vertices with in-degree 0 (no prerequisites): ${q.join(', ') || 'none — the graph has a cycle'}.` });
  while (q.length) {
    const u = q.shift()!;
    const cand = q.slice();
    order.push(u);
    removed.add(u);
    const freed: number[] = [];
    for (const v of adj[u]) if (--indeg[v] === 0) {
      q.push(v);
      freed.push(v);
    }
    F.push({ scene: sc(u), line: 't-take', say: `Output ${u} and delete its out-edges.${freed.length ? ` In-degree drops to 0 for ${freed.join(', ')} → enqueue.` : ''}`, sfx: 'pop', ask: predict && cand.length ? { prompt: 'Which vertex is output next (queue order)?', options: [...new Set([u, ...cand])].slice(0, 4).map(String), answer: 0 } : undefined });
  }
  F.push({ scene: sc(null), say: order.length === n ? `Topological order: ${order.join(' ')}. Every edge goes from earlier to later. Other valid orders may exist.` : `Only ${order.length} of ${n} vertices output — the remaining ones lie on a cycle, so no topological order exists.`, sfx: order.length === n ? 'found' : 'wrong' });
  return F;
}

/** AOE network: events = vertices (0 = start, n−1 = finish), activities = weighted edges. */
export function criticalPath(g: Graph): { ee: number[]; le: number[]; acts: { e: Edge; early: number; late: number; slack: number }[]; length: number } {
  const adj = adjList({ ...g });
  const order = kahn(g.n, adj);
  const ee = Array(g.n).fill(0);
  for (const u of order) for (const e of g.edges) if (e.u === u) ee[e.v] = Math.max(ee[e.v], ee[u] + e.w);
  const length = Math.max(...ee);
  const le = Array(g.n).fill(length);
  for (const u of [...order].reverse()) for (const e of g.edges) if (e.u === u) le[u] = Math.min(le[u], le[e.v] - e.w);
  const acts = g.edges.map((e) => ({ e, early: ee[e.u], late: le[e.v] - e.w, slack: le[e.v] - e.w - ee[e.u] }));
  return { ee, le, acts, length };
}
export function criticalFrames(g: Graph): Frame[] {
  const r = criticalPath(g);
  const n = g.n;
  const order = kahn(n, adjList(g));
  const F: Frame[] = [];
  const shownEE = new Set<number>();
  const shownLE = new Set<number>();
  let showCrit = false;
  const sc = (cur: number | null): Scene => {
    const base = graphScene(draw(g), { w: 430, h: 360, nodeTone: (v) => (v === cur ? 'active' : undefined), edgeTone: (i) => (showCrit && r.acts[i].slack === 0 ? 'warn' : undefined), sub: (v) => `${shownEE.has(v) ? r.ee[v] : '?'}/${shownLE.has(v) ? r.le[v] : '?'}` });
    const t = grid([r.ee.map((x, v) => (shownEE.has(v) ? x : '')), r.le.map((x, v) => (shownLE.has(v) ? x : ''))], { x: 500, y: 60, cw: 34, colHead: [...Array(n).keys()], rowHead: ['ee', 'le'], key: 'cp' });
    return { ...base, w: Math.max(base.w, t.w + 40), nodes: [...base.nodes, ...t.nodes] };
  };
  F.push({ scene: sc(null), say: 'AOE network: edges are activities with durations, vertices are events. Labels show ee/le (earliest/latest event time).' });
  for (const v of order) {
    shownEE.add(v);
    const preds = g.edges.filter((e) => e.v === v);
    F.push({ scene: sc(v), say: preds.length ? `ee[${v}] = max over incoming activities of ee[u] + duration = max(${preds.map((e) => `${r.ee[e.u]}+${e.w}`).join(', ')}) = ${r.ee[v]}.` : `ee[${v}] = 0 (start event).`, sfx: 'tick' });
  }
  for (const v of [...order].reverse()) {
    shownLE.add(v);
    const succ = g.edges.filter((e) => e.u === v);
    F.push({ scene: sc(v), say: succ.length ? `le[${v}] = min over outgoing activities of le[w] − duration = min(${succ.map((e) => `${r.le[e.v]}−${e.w}`).join(', ')}) = ${r.le[v]}.` : `le[${v}] = ee[${v}] = ${r.le[v]} (finish event: project length).`, sfx: 'tick' });
  }
  showCrit = true;
  F.push({ scene: sc(null), say: `Activity a = ⟨i, j⟩: early(a) = ee[i], late(a) = le[j] − duration. Critical activities (slack = late − early = 0, in red): ${r.acts.filter((a) => a.slack === 0).map((a) => `${a.e.u}→${a.e.v}`).join(', ')}. Project length ${r.length}.`, sfx: 'found' });
  return F;
}
