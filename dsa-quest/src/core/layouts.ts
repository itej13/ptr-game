import type { SEdge, SNode, Scene, Tone } from './types';

/** Reusable scene builders. Engines produce state; these turn state into drawable nodes. */

export interface Item {
  id: string;
  v: string | number;
}
/** Give each value a stable identity so it visibly travels when swapped/shifted. */
export const items = (vals: (string | number)[], prefix = 'e'): Item[] => vals.map((v, i) => ({ id: `${prefix}${i}`, v }));

export interface RowOpts {
  x?: number;
  y?: number;
  cw?: number;
  ch?: number;
  gap?: number;
  /** tone per index */
  tone?: (i: number) => Tone | undefined;
  /** index captions above cells: true = 0-based indices, or custom */
  index?: boolean | ((i: number) => string);
  /** named pointers -> index (undefined / out of range are skipped unless allowEdge) */
  pointers?: Record<string, number | undefined>;
  /** prefix for empty-slot / index / pointer node ids */
  key?: string;
  /** fixed number of slots (shows empty boxes for capacity) */
  slots?: number;
}

export function row(cells: (Item | string | number | null)[], o: RowOpts = {}): SNode[] {
  const { x = 40, y = 70, cw = 52, ch = 44, gap = 4, key = 'r' } = o;
  const n = Math.max(cells.length, o.slots ?? 0);
  const nodes: SNode[] = [];
  const cx = (i: number) => x + i * (cw + gap) + cw / 2;
  for (let i = 0; i < n; i++) {
    const c = cells[i];
    const tone = o.tone?.(i);
    if (c === null || c === undefined) {
      nodes.push({ id: `${key}-slot${i}`, x: cx(i), y, w: cw, h: ch, shape: 'rect', tone: tone ?? 'ghost' });
    } else if (typeof c === 'object') {
      nodes.push({ id: c.id, x: cx(i), y, w: cw, h: ch, shape: 'rect', label: c.v, tone: tone ?? 'base' });
    } else {
      nodes.push({ id: `${key}-c${i}`, x: cx(i), y, w: cw, h: ch, shape: 'rect', label: c, tone: tone ?? 'base' });
    }
    if (o.index) {
      const lbl = typeof o.index === 'function' ? o.index(i) : String(i);
      nodes.push({ id: `${key}-ix${i}`, x: cx(i), y: y - ch / 2 - 12, shape: 'text', label: lbl, tone: 'muted', fontSize: 11 });
    }
  }
  if (o.pointers) {
    const stack: Record<number, number> = {};
    for (const [name, at] of Object.entries(o.pointers)) {
      if (at === undefined || at < -1 || at > n) continue;
      const level = (stack[at] = (stack[at] ?? 0) + 1) - 1;
      nodes.push({
        id: `${key}-p-${name}`,
        x: cx(at),
        y: y + ch / 2 + 16 + level * 22,
        w: Math.max(26, name.length * 8 + 14),
        h: 19,
        shape: 'tag',
        label: name,
        tone: 'accent',
      });
    }
  }
  return nodes;
}
export const rowWidth = (n: number, o: RowOpts = {}) => (o.x ?? 40) * 2 + n * ((o.cw ?? 52) + (o.gap ?? 4));

export function text(id: string, x: number, y: number, label: string | number, o: Partial<SNode> = {}): SNode {
  return { id, x, y, shape: 'text', label, anchor: 'start', fontSize: 14, ...o };
}

/* ---------- binary trees ---------- */
export interface BNode {
  id: string;
  v: string | number;
  left?: BNode | null;
  right?: BNode | null;
  sub?: string | number;
}

/** Inorder-x / depth-y layout: simple, never overlaps, mirrors how BSTs are drawn in textbooks. */
export function treeScene(
  root: BNode | null | undefined,
  o: { tone?: (n: BNode) => Tone | undefined; edgeTone?: (p: BNode, c: BNode) => Tone | undefined; dx?: number; dy?: number; r?: number; extra?: SNode[]; extraEdges?: SEdge[]; minW?: number; top?: number } = {},
): Scene {
  const { dx = 46, dy = 64, r = 40, top = 40 } = o;
  const nodes: SNode[] = [];
  const edges: SEdge[] = [];
  let k = 0;
  let maxDepth = 0;
  const walk = (n: BNode | null | undefined, d: number): void => {
    if (!n) return;
    walk(n.left, d + 1);
    const x = 30 + k++ * dx + r / 2;
    maxDepth = Math.max(maxDepth, d);
    nodes.push({ id: n.id, x, y: top + d * dy, w: r, label: n.v, sub: n.sub, subPos: 'right', tone: o.tone?.(n) ?? 'base' });
    walk(n.right, d + 1);
  };
  walk(root, 0);
  const link = (n: BNode | null | undefined): void => {
    if (!n) return;
    for (const c of [n.left, n.right]) if (c) edges.push({ from: n.id, to: c.id, tone: o.edgeTone?.(n, c) });
    link(n.left);
    link(n.right);
  };
  link(root);
  const extra = o.extra ?? [];
  const w = Math.max(o.minW ?? 300, 60 + k * dx + r, ...extra.map((n) => n.x + 60));
  const h = Math.max(top + maxDepth * dy + r + 30, ...extra.map((n) => n.y + 30));
  return { w, h, nodes: [...nodes, ...extra], edges: [...edges, ...(o.extraEdges ?? [])] };
}

/* ---------- graphs ---------- */
export interface GraphDraw {
  n: number;
  pos: [number, number][];
  names?: string[];
  edges: { u: number; v: number; w?: number }[];
  directed?: boolean;
}
export function graphScene(
  g: GraphDraw,
  o: {
    nodeTone?: (v: number) => Tone | undefined;
    edgeTone?: (i: number) => Tone | undefined;
    sub?: (v: number) => string | number | undefined;
    extra?: SNode[];
    w?: number;
    h?: number;
    weights?: boolean;
  } = {},
): Scene {
  const nodes: SNode[] = g.pos.map(([x, y], v) => ({
    id: `v${v}`,
    x,
    y,
    w: 38,
    label: g.names?.[v] ?? v,
    sub: o.sub?.(v),
    subPos: 'above',
    tone: o.nodeTone?.(v) ?? 'base',
  }));
  // parallel edges between the same pair get bends so multigraphs stay readable
  const seen: Record<string, number> = {};
  const edges: SEdge[] = g.edges.map((e, i) => {
    const k = e.u < e.v ? `${e.u}-${e.v}` : `${e.v}-${e.u}`;
    const c = (seen[k] = (seen[k] ?? 0) + 1) - 1;
    const hasReverse = g.directed && g.edges.some((f) => f.u === e.v && f.v === e.u);
    const bend = e.u === e.v ? 0 : c > 0 ? (c % 2 ? 1 : -1) * Math.ceil(c / 2) * 26 : hasReverse ? 14 : 0;
    return { from: `v${e.u}`, to: `v${e.v}`, directed: g.directed, label: o.weights === false ? undefined : e.w, tone: o.edgeTone?.(i) ?? 'base', bend };
  });
  const xs = g.pos.map((p) => p[0]);
  const ys = g.pos.map((p) => p[1]);
  return {
    w: o.w ?? Math.max(...xs) + 50,
    h: o.h ?? Math.max(...ys) + 50,
    nodes: [...nodes, ...(o.extra ?? [])],
    edges,
  };
}

/** Evenly spaced positions on a circle (for random graphs). */
export function circlePos(n: number, cx = 200, cy = 170, r = 130): [number, number][] {
  return Array.from({ length: n }, (_, i) => [
    Math.round(cx + r * Math.sin((2 * Math.PI * i) / n)),
    Math.round(cy - r * Math.cos((2 * Math.PI * i) / n)),
  ]);
}

/* ---------- tables (DP, matrices, hash tables) ---------- */
export function grid(
  cells: (string | number | null)[][],
  o: {
    x?: number;
    y?: number;
    cw?: number;
    ch?: number;
    rowHead?: (string | number)[];
    colHead?: (string | number)[];
    tone?: (r: number, c: number) => Tone | undefined;
    key?: string;
  } = {},
): { nodes: SNode[]; w: number; h: number } {
  const { x = 60, y = 50, cw = 46, ch = 34, key = 'g' } = o;
  const nodes: SNode[] = [];
  cells.forEach((r, i) =>
    r.forEach((v, j) => {
      nodes.push({
        id: `${key}-${i}-${j}`,
        x: x + j * cw + cw / 2,
        y: y + i * ch + ch / 2,
        w: cw - 3,
        h: ch - 3,
        shape: 'rect',
        label: v === null ? '' : v,
        tone: o.tone?.(i, j) ?? (v === null ? 'ghost' : 'base'),
        fontSize: 13,
      });
    }),
  );
  o.colHead?.forEach((c, j) => nodes.push({ id: `${key}-ch${j}`, x: x + j * cw + cw / 2, y: y - 12, shape: 'text', label: c, tone: 'muted', fontSize: 12 }));
  o.rowHead?.forEach((r, i) => nodes.push({ id: `${key}-rh${i}`, x: x - 10, y: y + i * ch + ch / 2, shape: 'text', label: r, anchor: 'end', tone: 'muted', fontSize: 12 }));
  const cols = Math.max(0, ...cells.map((r) => r.length));
  return { nodes, w: x + cols * cw + 20, h: y + cells.length * ch + 20 };
}

/* ---------- linked structures ---------- */
/** A chain of boxes with next arrows (singly / doubly / circular). */
export function chain(
  list: Item[],
  o: { x?: number; y?: number; gap?: number; doubly?: boolean; circular?: boolean; tone?: (i: number, it: Item) => Tone | undefined; head?: boolean; nullEnd?: boolean; key?: string; ptrs?: Record<string, number | undefined> } = {},
): { nodes: SNode[]; edges: SEdge[]; w: number } {
  const { x = 70, y = 90, gap = 92, key = 'L' } = o;
  const nodes: SNode[] = [];
  const edges: SEdge[] = [];
  list.forEach((it, i) => {
    nodes.push({ id: it.id, x: x + i * gap, y, w: 56, h: 38, shape: 'rect', label: it.v, tone: o.tone?.(i, it) ?? 'base' });
    if (i > 0) {
      edges.push({ from: list[i - 1].id, to: it.id, directed: true, bend: o.doubly ? -7 : 0 });
      if (o.doubly) edges.push({ from: it.id, to: list[i - 1].id, directed: true, bend: -7, tone: 'muted' });
    }
  });
  const endX = x + list.length * gap;
  if (o.nullEnd !== false && !o.circular) {
    nodes.push({ id: `${key}-null`, x: list.length ? endX - 18 : x, y, shape: 'text', label: 'NULL', tone: 'muted', fontSize: 12 });
    if (list.length) edges.push({ from: list[list.length - 1].id, to: `${key}-null`, directed: true });
  }
  if (o.circular && list.length) {
    edges.push({ from: list[list.length - 1].id, to: list[0].id, directed: true, bend: list.length === 1 ? 40 : -Math.min(70, 26 + list.length * 6) });
  }
  if (o.head !== false) {
    nodes.push({ id: `${key}-head`, x: x - 44, y: y - 44, w: 52, h: 22, shape: 'tag', label: 'head', tone: 'accent' });
    if (list.length) edges.push({ from: `${key}-head`, to: list[0].id, directed: true, tone: 'accent' });
  }
  if (o.ptrs) {
    const stack: Record<number, number> = {};
    for (const [name, at] of Object.entries(o.ptrs)) {
      if (at === undefined || at < 0 || at >= list.length) continue;
      const lv = (stack[at] = (stack[at] ?? 0) + 1) - 1;
      const id = `${key}-ptr-${name}`;
      nodes.push({ id, x: x + at * gap, y: y + 52 + lv * 26, w: Math.max(30, name.length * 8 + 14), h: 20, shape: 'tag', label: name, tone: 'compare' });
      edges.push({ from: id, to: list[at].id, directed: true, tone: 'compare' });
    }
  }
  return { nodes, edges, w: endX + 40 };
}
