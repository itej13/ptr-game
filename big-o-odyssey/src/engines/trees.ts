import type { Frame, Scene, SNode, SEdge, Tone, Ask } from '../core/types';
import { treeScene, type BNode as DrawNode } from '../core/layouts';

/* =====================================================================
   Binary tree model shared by World 6
   ===================================================================== */
export interface TN {
  id: string;
  v: number;
  left: TN | null;
  right: TN | null;
}
let uid = 0;
export const node = (v: number, left: TN | null = null, right: TN | null = null): TN => ({ id: `t${uid++}`, v, left, right });

/** Preorder with '#' for null — the format the C++ harnesses read. */
export function serialise(t: TN | null): string {
  return t ? `${t.v} ${serialise(t.left)}${serialise(t.right)}` : '# ';
}
export function parseTree(s: string): TN | null {
  const toks = s.trim().split(/\s+/);
  let i = 0;
  const go = (): TN | null => {
    const tk = toks[i++];
    if (tk === undefined) throw new Error('Tree encoding ended early.');
    if (tk === '#') return null;
    const v = Number(tk);
    if (!Number.isInteger(v)) throw new Error(`Bad token "${tk}".`);
    const n = node(v);
    n.left = go();
    n.right = go();
    return n;
  };
  const t = go();
  if (i !== toks.length) throw new Error('Extra tokens after the tree.');
  return t;
}
export function randomTree(rng: { int: (a: number, b: number) => number; chance: (p: number) => boolean }, n: number, lo = 1, hi = 99): TN | null {
  if (n === 0) return null;
  const leftSize = rng.int(0, n - 1);
  return node(rng.int(lo, hi), randomTree(rng, leftSize, lo, hi), randomTree(rng, n - 1 - leftSize, lo, hi));
}

export const height = (t: TN | null): number => (t ? 1 + Math.max(height(t.left), height(t.right)) : 0);
export const countNodes = (t: TN | null): number => (t ? 1 + countNodes(t.left) + countNodes(t.right) : 0);
export const countLeaves = (t: TN | null): number => (!t ? 0 : !t.left && !t.right ? 1 : countLeaves(t.left) + countLeaves(t.right));
export const inorder = (t: TN | null): number[] => (t ? [...inorder(t.left), t.v, ...inorder(t.right)] : []);
export const preorder = (t: TN | null): number[] => (t ? [t.v, ...preorder(t.left), ...preorder(t.right)] : []);
export const postorder = (t: TN | null): number[] => (t ? [...postorder(t.left), ...postorder(t.right), t.v] : []);
export function levelOrder(t: TN | null): number[] {
  const out: number[] = [];
  const q: TN[] = t ? [t] : [];
  while (q.length) {
    const p = q.shift()!;
    out.push(p.v);
    if (p.left) q.push(p.left);
    if (p.right) q.push(p.right);
  }
  return out;
}
/** Degree counts: n0 leaves, n1 one-child, n2 two-children. */
export function degrees(t: TN | null): [number, number, number] {
  if (!t) return [0, 0, 0];
  const [a0, a1, a2] = degrees(t.left);
  const [b0, b1, b2] = degrees(t.right);
  const d = (t.left ? 1 : 0) + (t.right ? 1 : 0);
  return [a0 + b0 + (d === 0 ? 1 : 0), a1 + b1 + (d === 1 ? 1 : 0), a2 + b2 + (d === 2 ? 1 : 0)];
}
/** Internal path length I (sum of depths of internal nodes, root depth 0) and external E (sum of depths of the n+1 external nodes). */
export function pathLengths(t: TN | null): { I: number; E: number; n: number } {
  let I = 0;
  let E = 0;
  let n = 0;
  const go = (x: TN | null, d: number) => {
    if (!x) {
      E += d;
      return;
    }
    n++;
    I += d;
    go(x.left, d + 1);
    go(x.right, d + 1);
  };
  go(t, 0);
  return { I, E, n };
}

/** Rebuild a tree from inorder + preorder (distinct values). */
export function fromInPre(ino: number[], pre: number[]): TN | null {
  if (!pre.length) return null;
  const r = pre[0];
  const k = ino.indexOf(r);
  return node(r, fromInPre(ino.slice(0, k), pre.slice(1, k + 1)), fromInPre(ino.slice(k + 1), pre.slice(k + 1)));
}
export function fromInPost(ino: number[], post: number[]): TN | null {
  if (!post.length) return null;
  const r = post[post.length - 1];
  const k = ino.indexOf(r);
  return node(r, fromInPost(ino.slice(0, k), post.slice(0, k)), fromInPost(ino.slice(k + 1), post.slice(k, -1)));
}

const toDraw = (t: TN | null, sub?: (x: TN) => string | number | undefined): DrawNode | null => (t ? { id: t.id, v: t.v, left: toDraw(t.left, sub), right: toDraw(t.right, sub), sub: sub?.(t) } : null);
/** Static picture of a binary tree (for questions and lessons). */
export const tnScene = (t: TN | null, o: { tone?: (x: TN) => Tone | undefined; sub?: (x: TN) => string | number | undefined } = {}) => {
  const byId = new Map<string, TN>();
  const walk = (x: TN | null) => {
    if (!x) return;
    byId.set(x.id, x);
    walk(x.left);
    walk(x.right);
  };
  walk(t);
  return treeScene(toDraw(t, o.sub), { tone: (d) => (o.tone ? o.tone(byId.get(d.id)!) : undefined), minW: 300 });
};
export const bstStatic = (r: BST | null, tone?: (v: number) => Tone | undefined) => bstScene(r, tone);

/* =====================================================================
   Traversal frames (Level 24)
   ===================================================================== */
type Order = 'in' | 'pre' | 'post';
export function traversalFrames(t: TN | null, order: Order, predict = false): Frame[] {
  const F: Frame[] = [];
  const out: TN[] = [];
  const calls: string[] = [];
  const target = order === 'in' ? inorder(t) : order === 'pre' ? preorder(t) : postorder(t);
  const sc = (cur: TN | null): Scene => {
    const visited = new Set(out.map((x) => x.id));
    const base = treeScene(toDraw(t), { tone: (n) => (cur && n.id === cur.id ? 'active' : visited.has(n.id) ? 'done' : undefined), minW: 420 });
    const y = base.h + 10;
    const extra: SNode[] = [
      { id: 'outlbl', x: 20, y, shape: 'text', label: 'output', anchor: 'start', tone: 'muted', fontSize: 11 },
      ...out.map((x, i) => ({ id: `o${i}`, x: 90 + i * 40, y, w: 36, h: 28, shape: 'rect' as const, label: x.v, tone: 'done' as const, fontSize: 13 })),
      { id: 'cslbl', x: base.w + 10, y: 20, shape: 'text', label: 'call stack', anchor: 'start', tone: 'muted', fontSize: 11 },
      ...calls.slice(-7).map((c, i) => ({ id: `cs${i}`, x: base.w + 70, y: 50 + i * 30, w: 110, h: 26, shape: 'rect' as const, label: c, tone: (i === Math.min(calls.length, 7) - 1 ? 'accent' : 'base') as Tone, fontSize: 11 })),
    ];
    return { w: base.w + 140, h: y + 40, nodes: [...base.nodes, ...extra], edges: base.edges };
  };
  const lines = order === 'in' ? { left: 'in-left', visit: 'in-visit', right: 'in-right', check: 'in-check' } : order === 'pre' ? { left: 'pre-left', visit: 'pre-visit', right: 'pre-right', check: 'pre-check' } : { left: 'post-left', visit: 'post-visit', right: 'post-right', check: 'post-check' };
  const visit = (x: TN) => {
    const ask: Ask | undefined = predict ? { prompt: `Which node is printed next?`, options: [...new Set([x.v, ...target.filter((v) => !out.some((o) => o.v === v) && v !== x.v).slice(0, 3)])].map(String), answer: 0, hint: order === 'in' ? 'Left subtree first, then the node, then the right subtree.' : order === 'pre' ? 'Node first, then left subtree, then right subtree.' : 'Both subtrees first, node last.' } : undefined;
    out.push(x);
    F.push({ scene: sc(x), line: lines.visit, say: `Visit ${x.v}.`, vars: { output: out.map((o) => o.v).join(' ') }, sfx: 'pop', ask });
  };
  const go = (x: TN | null) => {
    if (!x) return;
    calls.push(`${order}(${x.v})`);
    F.push({ scene: sc(x), line: lines.check, say: `${order}order(${x.v}) called.`, vars: { output: out.map((o) => o.v).join(' ') } });
    if (order === 'pre') visit(x);
    go(x.left);
    if (order === 'in') visit(x);
    go(x.right);
    if (order === 'post') visit(x);
    calls.pop();
  };
  F.push({ scene: sc(null), say: `${order === 'in' ? 'Inorder: Left, Visit, Right' : order === 'pre' ? 'Preorder: Visit, Left, Right' : 'Postorder: Left, Right, Visit'}.` });
  go(t);
  F.push({ scene: sc(null), say: `${order}order = ${out.map((o) => o.v).join(' ')}.`, sfx: 'found' });
  return F;
}

export function iterInorderFrames(t: TN | null): Frame[] {
  const F: Frame[] = [];
  const out: TN[] = [];
  const st: TN[] = [];
  const sc = (cur: TN | null): Scene => {
    const visited = new Set(out.map((x) => x.id));
    const onStack = new Set(st.map((x) => x.id));
    const base = treeScene(toDraw(t), { tone: (n) => (cur && n.id === cur.id ? 'active' : visited.has(n.id) ? 'done' : onStack.has(n.id) ? 'compare' : undefined), minW: 420 });
    const y = base.h + 10;
    return {
      w: base.w + 120,
      h: Math.max(y + 40, 60 + st.length * 32),
      nodes: [
        ...base.nodes,
        { id: 'outlbl', x: 20, y, shape: 'text', label: 'output', anchor: 'start', tone: 'muted', fontSize: 11 },
        ...out.map((x, i) => ({ id: `o${i}`, x: 90 + i * 40, y, w: 36, h: 28, shape: 'rect' as const, label: x.v, tone: 'done' as const, fontSize: 13 })),
        { id: 'stlbl', x: base.w + 60, y: 20, shape: 'text', label: 'stack', tone: 'muted', fontSize: 11 },
        ...st.map((x, i) => ({ id: `s${i}`, x: base.w + 60, y: base.h - 10 - i * 32, w: 48, h: 28, shape: 'rect' as const, label: x.v, tone: 'compare' as const })),
      ],
      edges: base.edges,
    };
  };
  let cur = t;
  F.push({ scene: sc(cur), say: 'Iterative inorder: go left as far as possible, pushing each node; then pop, print, and go right.' });
  for (;;) {
    for (; cur; cur = cur.left) {
      st.push(cur);
      F.push({ scene: sc(cur), line: 'it-push', say: `Push ${cur.v} and go left.`, sfx: 'push' });
    }
    if (!st.length) {
      F.push({ scene: sc(null), line: 'it-empty', say: 'Stack empty and current is NULL: done.', sfx: 'found' });
      break;
    }
    cur = st.pop()!;
    out.push(cur);
    F.push({ scene: sc(cur), line: 'it-visit', say: `Pop ${cur.v} and print it.`, vars: { output: out.map((o) => o.v).join(' ') }, sfx: 'pop' });
    cur = cur.right;
    F.push({ scene: sc(cur), line: 'it-right', say: cur ? `Move to its right child ${cur.v}.` : 'No right child.' });
  }
  return F;
}

export function levelOrderFrames(t: TN | null): Frame[] {
  const F: Frame[] = [];
  const out: TN[] = [];
  const q: TN[] = t ? [t] : [];
  const sc = (cur: TN | null): Scene => {
    const visited = new Set(out.map((x) => x.id));
    const inQ = new Set(q.map((x) => x.id));
    const base = treeScene(toDraw(t), { tone: (n) => (cur && n.id === cur.id ? 'active' : visited.has(n.id) ? 'done' : inQ.has(n.id) ? 'compare' : undefined), minW: 420 });
    const y = base.h + 10;
    return {
      w: base.w,
      h: y + 80,
      nodes: [
        ...base.nodes,
        { id: 'qlbl', x: 20, y, shape: 'text', label: 'queue', anchor: 'start', tone: 'muted', fontSize: 11 },
        ...q.map((x, i) => ({ id: `q${x.id}`, x: 90 + i * 40, y, w: 36, h: 28, shape: 'rect' as const, label: x.v, tone: 'compare' as const })),
        { id: 'outlbl', x: 20, y: y + 40, shape: 'text', label: 'output', anchor: 'start', tone: 'muted', fontSize: 11 },
        ...out.map((x, i) => ({ id: `o${i}`, x: 90 + i * 40, y: y + 40, w: 36, h: 28, shape: 'rect' as const, label: x.v, tone: 'done' as const })),
      ],
      edges: base.edges,
    };
  };
  F.push({ scene: sc(null), line: 'lv-start', say: 'Level order: enqueue the root; repeatedly dequeue, print, enqueue the children.' });
  while (q.length) {
    const p = q.shift()!;
    out.push(p);
    F.push({ scene: sc(p), line: 'lv-visit', say: `Dequeue and print ${p.v}.`, sfx: 'pop' });
    if (p.left) q.push(p.left);
    if (p.right) q.push(p.right);
    if (p.left || p.right) F.push({ scene: sc(p), line: 'lv-right', say: `Enqueue its children: ${[p.left?.v, p.right?.v].filter((x) => x !== undefined).join(', ')}.`, sfx: 'push' });
  }
  F.push({ scene: sc(null), say: `Level order = ${out.map((o) => o.v).join(' ')}.`, sfx: 'found' });
  return F;
}

/* =====================================================================
   BST (Levels 25–26) — ids are 'k<key>' so nodes keep identity across edits
   ===================================================================== */
export interface BST {
  v: number;
  left: BST | null;
  right: BST | null;
}
export function bstInsert(r: BST | null, k: number): BST {
  if (!r) return { v: k, left: null, right: null };
  if (k < r.v) r.left = bstInsert(r.left, k);
  else if (k > r.v) r.right = bstInsert(r.right, k);
  return r;
}
export function bstDelete(r: BST | null, k: number): BST | null {
  if (!r) return null;
  if (k < r.v) r.left = bstDelete(r.left, k);
  else if (k > r.v) r.right = bstDelete(r.right, k);
  else {
    if (!r.left) return r.right;
    if (!r.right) return r.left;
    let s = r.right;
    while (s.left) s = s.left;
    r.v = s.v;
    r.right = bstDelete(r.right, s.v);
  }
  return r;
}
export const bstFrom = (keys: number[]) => keys.reduce<BST | null>((r, k) => bstInsert(r, k), null);
export const bstClone = (r: BST | null): BST | null => (r ? { v: r.v, left: bstClone(r.left), right: bstClone(r.right) } : null);
export const bstSerialise = (r: BST | null): string => (r ? `${r.v} ${bstSerialise(r.left)}${bstSerialise(r.right)}` : '# ');
export const bstInorder = (r: BST | null): number[] => (r ? [...bstInorder(r.left), r.v, ...bstInorder(r.right)] : []);
export const bstPre = (r: BST | null): number[] => (r ? [r.v, ...bstPre(r.left), ...bstPre(r.right)] : []);
export const bstHeight = (r: BST | null): number => (r ? 1 + Math.max(bstHeight(r.left), bstHeight(r.right)) : 0);
export function bstPath(r: BST | null, k: number): number[] {
  const p: number[] = [];
  while (r) {
    p.push(r.v);
    if (k === r.v) break;
    r = k < r.v ? r.left : r.right;
  }
  return p;
}
const bstDraw = (r: BST | null, sub?: (x: BST) => string | number | undefined): DrawNode | null => (r ? { id: `k${r.v}`, v: r.v, left: bstDraw(r.left, sub), right: bstDraw(r.right, sub), sub: sub?.(r) } : null);
const bstScene = (r: BST | null, tone: (v: number) => Tone | undefined = () => undefined, extra: SNode[] = [], extraEdges: SEdge[] = [], sub?: (x: BST) => string | number | undefined) =>
  treeScene(bstDraw(r, sub), { tone: (n) => tone(n.v as number), minW: 420, extra, extraEdges });

export function bstInsertFrames(keys: number[], predict = false): Frame[] {
  let root: BST | null = null;
  const F: Frame[] = [];
  F.push({ scene: bstScene(null, undefined, [{ id: 'empty', x: 200, y: 60, shape: 'text', label: 'root = NULL', tone: 'muted' }]), say: `Insert ${keys.join(', ')} one by one into an empty BST.` });
  for (const k of keys) {
    let cur = root;
    const path: number[] = [];
    while (cur) {
      path.push(cur.v);
      if (k === cur.v) break;
      const goLeft = k < cur.v;
      const c = cur;
      F.push({
        scene: bstScene(root, (v) => (v === c.v ? 'compare' : path.includes(v) ? 'path' : undefined)),
        line: goLeft ? 'i-left' : 'i-right',
        say: `${k} ${goLeft ? '<' : '>'} ${cur.v}: go ${goLeft ? 'left' : 'right'}.`,
        vars: { key: k },
        sfx: 'compare',
        ask: predict ? { prompt: `Inserting ${k}: at node ${cur.v}, which way?`, options: goLeft ? ['Left', 'Right'] : ['Right', 'Left'], answer: 0 } : undefined,
      });
      cur = goLeft ? cur.left : cur.right;
    }
    if (cur && cur.v === k) {
      F.push({ scene: bstScene(root, (v) => (v === k ? 'warn' : undefined)), line: 'i-ret', say: `${k} is already in the tree — duplicates are ignored.`, sfx: 'wrong' });
      continue;
    }
    root = bstInsert(root, k);
    F.push({ scene: bstScene(root, (v) => (v === k ? 'active' : path.includes(v) ? 'path' : undefined)), line: 'i-new', say: `Reached NULL: new node ${k} attached as a ${path.length ? (k < path[path.length - 1] ? 'left' : 'right') + ` child of ${path[path.length - 1]}` : 'root'}.`, sfx: 'push' });
  }
  F.push({ scene: bstScene(root), say: `Done. Inorder traversal gives the keys sorted: ${bstInorder(root).join(' ')}. Height ${bstHeight(root)}.`, sfx: 'found' });
  return F;
}

export function bstSearchFrames(keys: number[], k: number): Frame[] {
  const root = bstFrom(keys);
  const F: Frame[] = [];
  let cur = root;
  const path: number[] = [];
  F.push({ scene: bstScene(root), line: 's-loop', say: `search(${k}) from the root.`, vars: { key: k } });
  while (cur && cur.v !== k) {
    path.push(cur.v);
    const c = cur;
    F.push({ scene: bstScene(root, (v) => (v === c.v ? 'compare' : path.includes(v) ? 'path' : undefined)), line: 's-step', say: `${k} ${k < cur.v ? '<' : '>'} ${cur.v}: go ${k < cur.v ? 'left' : 'right'}.`, sfx: 'compare' });
    cur = k < cur.v ? cur.left : cur.right;
  }
  if (cur) F.push({ scene: bstScene(root, (v) => (v === k ? 'done' : path.includes(v) ? 'path' : undefined)), line: 's-ret', say: `Found ${k} after ${path.length + 1} comparison(s).`, sfx: 'found' });
  else F.push({ scene: bstScene(root, (v) => (path.includes(v) ? 'path' : undefined)), line: 's-ret', say: `Fell off the tree: ${k} is not present (${path.length} comparisons).`, sfx: 'wrong' });
  return F;
}

export function bstDeleteFrames(keys: number[], dels: number[], predict = false): Frame[] {
  let root = bstFrom(keys);
  const F: Frame[] = [];
  F.push({ scene: bstScene(root), say: `BST from ${keys.join(', ')}. Delete ${dels.join(', ')}.` });
  for (const k of dels) {
    const path = bstPath(root, k);
    let n = root;
    while (n && n.v !== k) n = k < n.v ? n.left : n.right;
    if (!n) {
      F.push({ scene: bstScene(root, (v) => (path.includes(v) ? 'path' : undefined)), line: 'd-null', say: `${k} not found — nothing to delete.`, sfx: 'wrong' });
      continue;
    }
    const kind = !n.left && !n.right ? 'leaf' : !n.left || !n.right ? 'one' : 'two';
    const ask: Ask | undefined = predict ? { prompt: `Deleting ${k}: which case is it?`, options: [kind === 'leaf' ? 'Leaf — just remove it' : kind === 'one' ? 'One child — splice the child up' : 'Two children — replace with inorder successor', ...['Leaf — just remove it', 'One child — splice the child up', 'Two children — replace with inorder successor'].filter((o) => !o.startsWith(kind === 'leaf' ? 'Leaf' : kind === 'one' ? 'One' : 'Two'))], answer: 0 } : undefined;
    F.push({ scene: bstScene(root, (v) => (v === k ? 'warn' : path.includes(v) ? 'path' : undefined)), line: kind === 'two' ? 'd-succ' : kind === 'one' ? (n.left ? 'd-noright' : 'd-noleft') : 'd-noleft', say: kind === 'leaf' ? `${k} is a leaf: remove it.` : kind === 'one' ? `${k} has one child: its parent adopts the child.` : `${k} has two children: find the inorder successor (leftmost in the right subtree).`, sfx: 'compare', ask });
    if (kind === 'two') {
      let s = n.right!;
      const sp: number[] = [];
      while (s.left) {
        sp.push(s.v);
        s = s.left;
      }
      const sv = s.v;
      F.push({ scene: bstScene(root, (v) => (v === k ? 'warn' : v === sv ? 'active' : sp.includes(v) ? 'path' : undefined)), line: 'd-copy', say: `Successor is ${sv}. Copy ${sv} into ${k}'s node, then delete ${sv} from the right subtree (it has no left child, so that is case 1 or 2).` });
    }
    root = bstDelete(root, k);
    F.push({ scene: bstScene(root), line: 'd-rec', say: `${k} deleted. Inorder still sorted: ${bstInorder(root).join(' ')}.`, sfx: 'pop' });
  }
  return F;
}

/* =====================================================================
   Threaded trees (Level 28)
   ===================================================================== */
export function threadedFrames(t: TN | null): Frame[] {
  const order: TN[] = [];
  const walk = (x: TN | null) => {
    if (!x) return;
    walk(x.left);
    order.push(x);
    walk(x.right);
  };
  walk(t);
  const idx = new Map(order.map((n, i) => [n.id, i]));
  const base = treeScene(toDraw(t), { minW: 420, top: 100 });
  const head: SNode = { id: 'HEAD', x: base.w / 2, y: 36, w: 70, h: 30, shape: 'rect', label: 'head', tone: 'accent' };
  const threads: SEdge[] = [];
  for (const n of order) {
    const i = idx.get(n.id)!;
    if (!n.left) threads.push({ from: n.id, to: i ? order[i - 1].id : 'HEAD', directed: true, dashed: true, tone: 'path', bend: -18 });
    if (!n.right) threads.push({ from: n.id, to: i + 1 < order.length ? order[i + 1].id : 'HEAD', directed: true, dashed: true, tone: 'path', bend: 18 });
  }
  const headEdge: SEdge[] = t ? [{ from: 'HEAD', to: t.id, directed: true, tone: 'accent' }] : [];
  const F: Frame[] = [];
  const sc = (hi: string | null, done: Set<string>): Scene => ({
    w: base.w,
    h: base.h + 20,
    nodes: [head, ...base.nodes.map((n) => ({ ...n, tone: (n.id === hi ? 'active' : done.has(n.id) ? 'done' : 'base') as Tone }))],
    edges: [...(base.edges ?? []), ...threads, ...headEdge],
  });
  F.push({ scene: sc(null, new Set()), say: 'Dashed purple arrows are threads: a missing left link points to the inorder predecessor, a missing right link to the successor. The first and last nodes thread to head.' });
  const done = new Set<string>();
  let prev = 'head';
  for (const n of order) {
    const viaThread = prev !== 'head' && !order[idx.get(prev)!].right;
    F.push({
      scene: sc(n.id, done),
      line: 'tin-next',
      say: prev === 'head' ? `insucc(head): head's right link is real, so go down left links from head->right… reaching the leftmost node ${n.v}.` : viaThread ? `insucc(${order[idx.get(prev)!].v}): its right link is a thread — follow it straight to ${n.v}.` : `insucc(${order[idx.get(prev)!].v}): right link is a real child; go to it and then all the way left → ${n.v}.`,
      vars: { output: [...done].map((id) => order[idx.get(id)!].v).concat(n.v).join(' ') },
      sfx: 'tick',
    });
    done.add(n.id);
    prev = n.id;
  }
  F.push({ scene: sc(null, done), line: 'tin-stop', say: 'The last node\'s right thread leads back to head: stop. No stack and no recursion were needed.', sfx: 'found' });
  return F;
}

/* =====================================================================
   Heaps (Level 29) — 0-based max-heap, mirrors cpp/heap_sort.cpp & heap_pq.cpp
   ===================================================================== */
export function heapify(a: number[], n: number, i: number, log?: [number, number][]): void {
  for (;;) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < n && a[l] > a[largest]) largest = l;
    if (r < n && a[r] > a[largest]) largest = r;
    if (largest === i) return;
    [a[i], a[largest]] = [a[largest], a[i]];
    log?.push([i, largest]);
    i = largest;
  }
}
export function buildHeap(input: number[], log?: [number, number][]): number[] {
  const a = input.slice();
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) heapify(a, a.length, i, log);
  return a;
}
export function heapSort(input: number[], log?: [number, number][]): number[] {
  const a = buildHeap(input, log);
  for (let i = a.length - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    log?.push([0, i]);
    heapify(a, i, 0, log);
  }
  return a;
}
export function heapInsert(a: number[], x: number): void {
  let i = a.length;
  a.push(x);
  while (i > 0 && a[Math.floor((i - 1) / 2)] < a[i]) {
    const p = Math.floor((i - 1) / 2);
    [a[i], a[p]] = [a[p], a[i]];
    i = p;
  }
}
export function heapDeleteMax(a: number[]): number {
  const mx = a[0];
  a[0] = a[a.length - 1];
  a.pop();
  heapify(a, a.length, 0);
  return mx;
}
export const isMaxHeap = (a: number[], n = a.length) => a.slice(0, n).every((v, i) => i === 0 || a[Math.floor((i - 1) / 2)] >= v);

interface HItem {
  id: string;
  v: number;
}
function heapScene(a: HItem[], n: number, tone: (i: number) => Tone | undefined, note?: string): Scene {
  const total = a.length;
  const levels = Math.max(1, Math.floor(Math.log2(Math.max(1, total))) + 1);
  const W = Math.max(520, 2 ** (levels - 1) * 56 + 60);
  const nodes: SNode[] = [];
  const edges: SEdge[] = [];
  a.forEach((it, i) => {
    const lv = Math.floor(Math.log2(i + 1));
    const pos = i + 1 - 2 ** lv;
    const x = ((pos + 0.5) * W) / 2 ** lv;
    const inHeap = i < n;
    nodes.push({ id: `T${it.id}`, x, y: 40 + lv * 64, w: 38, label: it.v, sub: i, subPos: 'right', tone: tone(i) ?? (inHeap ? 'base' : 'muted') });
    if (i > 0 && inHeap) edges.push({ from: `T${a[Math.floor((i - 1) / 2)].id}`, to: `T${it.id}` });
  });
  const ay = 40 + levels * 64 + 20;
  a.forEach((it, i) => {
    nodes.push({ id: `A${it.id}`, x: 40 + i * 46, y: ay, w: 42, h: 34, shape: 'rect', label: it.v, tone: tone(i) ?? (i < n ? 'base' : 'done'), fontSize: 13 });
    nodes.push({ id: `ix${i}`, x: 40 + i * 46, y: ay + 28, shape: 'text', label: i, tone: 'muted', fontSize: 10 });
  });
  if (note) nodes.push({ id: 'note', x: 20, y: ay + 56, shape: 'text', label: note, anchor: 'start', tone: 'muted', fontSize: 12 });
  return { w: Math.max(W, 60 + total * 46), h: ay + 70, nodes, edges };
}

export function heapSortFrames(vals: number[], buildOnly = false, predict = false): Frame[] {
  const a: HItem[] = vals.map((v, i) => ({ id: `h${i}`, v }));
  const F: Frame[] = [];
  let n = a.length;
  const sw = (x: number, y: number) => ([a[x], a[y]] = [a[y], a[x]]);
  const heapifyF = (size: number, i: number, phase: string) => {
    for (;;) {
      let largest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < size && a[l].v > a[largest].v) largest = l;
      if (r < size && a[r].v > a[largest].v) largest = r;
      const kids = [l, r].filter((k) => k < size);
      F.push({
        scene: heapScene(a, n, (k) => (k === i ? 'active' : kids.includes(k) ? 'compare' : undefined), phase),
        line: 'hp-left',
        say: kids.length ? `heapify(${i}): compare ${a[i].v} with children ${kids.map((k) => a[k].v).join(' and ')} → largest is ${a[largest].v}.` : `heapify(${i}): ${a[i].v} has no children inside the heap.`,
        vars: { i, largest },
        sfx: 'compare',
        ask: predict && kids.length ? { prompt: `heapify(${i}) on ${a[i].v} with children ${kids.map((k) => a[k].v).join(', ')}: what happens?`, options: largest === i ? ['Nothing — it is already the largest', `Swap with ${a[kids[0]].v}`] : [`Swap with ${a[largest].v}`, 'Nothing — it is already the largest', ...kids.filter((k) => k !== largest).map((k) => `Swap with ${a[k].v}`)], answer: 0, hint: 'Swap with the LARGER child, and only if it beats the parent.' } : undefined,
      });
      if (largest === i) return;
      sw(i, largest);
      F.push({ scene: heapScene(a, n, (k) => (k === largest ? 'active' : k === i ? 'done' : undefined), phase), line: 'hp-swap', say: `Swap → ${a[i].v} moves up, ${a[largest].v} sinks to index ${largest}; continue heapifying there.`, sfx: 'swap' });
      i = largest;
    }
  };
  F.push({ scene: heapScene(a, n, () => undefined, 'array view of a complete binary tree: children of i at 2i+1, 2i+2'), say: `Start: [${vals.join(', ')}] viewed as a complete binary tree. Build a max-heap bottom-up from the last internal node, index ${Math.floor(n / 2) - 1}.` });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapifyF(n, i, 'phase 1: build max-heap');
  F.push({ scene: heapScene(a, n, () => undefined, 'max-heap built'), line: 'hs-build', say: `Max-heap: [${a.map((x) => x.v).join(', ')}]. Building bottom-up is O(n), not O(n log n).`, sfx: 'found' });
  if (buildOnly) return F;
  for (let i = n - 1; i > 0; i--) {
    sw(0, i);
    n = i;
    F.push({ scene: heapScene(a, n, (k) => (k === i ? 'done' : k === 0 ? 'active' : undefined), 'phase 2: extract max'), line: 'hs-swap', say: `Swap the max ${a[i].v} into position ${i} (its final place); heap size becomes ${i}.`, sfx: 'swap' });
    heapifyF(i, 0, 'phase 2: extract max');
  }
  n = 0;
  F.push({ scene: heapScene(a, 0, () => 'done', 'sorted'), say: `Sorted ascending: [${a.map((x) => x.v).join(', ')}]. Θ(n log n) in every case, in place, not stable.`, sfx: 'found' });
  return F;
}

export function heapPQFrames(ops: ({ k: 'ins'; x: number } | { k: 'del' })[]): Frame[] {
  const a: HItem[] = [];
  const F: Frame[] = [];
  let id = 0;
  const sc = (tone: (i: number) => Tone | undefined, note?: string) => heapScene(a, a.length, tone, note);
  F.push({ scene: sc(() => undefined, 'empty max-heap'), say: 'Empty max-heap.' });
  for (const o of ops) {
    if (o.k === 'ins') {
      a.push({ id: `p${id++}`, v: o.x });
      let i = a.length - 1;
      F.push({ scene: sc((k) => (k === i ? 'active' : undefined)), line: 'ins-end', say: `insert(${o.x}): place it at the end (index ${i}) — the next free leaf.`, sfx: 'push' });
      while (i > 0 && a[Math.floor((i - 1) / 2)].v < a[i].v) {
        const p = Math.floor((i - 1) / 2);
        [a[i], a[p]] = [a[p], a[i]];
        F.push({ scene: sc((k) => (k === p ? 'active' : undefined)), line: 'ins-swap', say: `Parent ${a[i].v} < ${a[p].v}: swap up to index ${p}.`, sfx: 'swap' });
        i = p;
      }
      F.push({ scene: sc(() => undefined), line: 'ins-cmp', say: i === 0 ? `${o.x} reached the root.` : `Parent ${a[Math.floor((i - 1) / 2)].v} ≥ ${o.x}: heap property restored.` });
    } else {
      if (!a.length) {
        F.push({ scene: sc(() => undefined), say: 'Heap is empty.', sfx: 'wrong' });
        continue;
      }
      const top = a[0];
      F.push({ scene: sc((k) => (k === 0 ? 'warn' : k === a.length - 1 ? 'compare' : undefined)), line: 'del-take', say: `deleteMax(): remove the root ${top.v}; move the last element ${a[a.length - 1].v} to the root.` });
      a[0] = a[a.length - 1];
      a.pop();
      let i = 0;
      for (;;) {
        let largest = i;
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        if (l < a.length && a[l].v > a[largest].v) largest = l;
        if (r < a.length && a[r].v > a[largest].v) largest = r;
        if (largest === i) break;
        [a[i], a[largest]] = [a[largest], a[i]];
        F.push({ scene: sc((k) => (k === largest ? 'active' : undefined)), line: 'del-fix', say: `Sift down: swap with the larger child ${a[i].v}.`, sfx: 'swap' });
        i = largest;
      }
      F.push({ scene: sc(() => undefined), line: 'del-fix', say: `Returned ${top.v}. Heap: [${a.map((x) => x.v).join(', ')}].`, sfx: 'pop' });
    }
  }
  return F;
}

/* =====================================================================
   AVL (Level 30)
   ===================================================================== */
export interface AVL {
  key: number;
  left: AVL | null;
  right: AVL | null;
  h: number;
}
const ah = (n: AVL | null) => (n ? n.h : 0);
export const abf = (n: AVL | null) => (n ? ah(n.left) - ah(n.right) : 0);
const upd = (n: AVL) => void (n.h = 1 + Math.max(ah(n.left), ah(n.right)));
function rotR(y: AVL): AVL {
  const x = y.left!;
  y.left = x.right;
  x.right = y;
  upd(y);
  upd(x);
  return x;
}
function rotL(x: AVL): AVL {
  const y = x.right!;
  x.right = y.left;
  y.left = x;
  upd(x);
  upd(y);
  return y;
}
export type Rot = { kind: 'LL' | 'RR' | 'LR' | 'RL' | 'L0' | 'L1' | 'L-1' | 'R0' | 'R1' | 'R-1'; at: number };
export function avlInsert(n: AVL | null, key: number, rots?: Rot[]): AVL {
  if (!n) return { key, left: null, right: null, h: 1 };
  if (key < n.key) n.left = avlInsert(n.left, key, rots);
  else if (key > n.key) n.right = avlInsert(n.right, key, rots);
  else return n;
  upd(n);
  const bf = abf(n);
  if (bf > 1 && key < n.left!.key) {
    rots?.push({ kind: 'LL', at: n.key });
    return rotR(n);
  }
  if (bf < -1 && key > n.right!.key) {
    rots?.push({ kind: 'RR', at: n.key });
    return rotL(n);
  }
  if (bf > 1 && key > n.left!.key) {
    rots?.push({ kind: 'LR', at: n.key });
    n.left = rotL(n.left!);
    return rotR(n);
  }
  if (bf < -1 && key < n.right!.key) {
    rots?.push({ kind: 'RL', at: n.key });
    n.right = rotR(n.right!);
    return rotL(n);
  }
  return n;
}
export function avlDelete(r: AVL | null, key: number, rots?: Rot[]): AVL | null {
  if (!r) return r;
  if (key < r.key) r.left = avlDelete(r.left, key, rots);
  else if (key > r.key) r.right = avlDelete(r.right, key, rots);
  else {
    if (!r.left || !r.right) return r.left ?? r.right;
    let s = r.right;
    while (s.left) s = s.left;
    r.key = s.key;
    r.right = avlDelete(r.right, s.key, rots);
  }
  upd(r);
  const bf = abf(r);
  if (bf > 1 && abf(r.left) >= 0) {
    rots?.push({ kind: abf(r.left) === 0 ? 'R0' : 'R1', at: r.key });
    return rotR(r);
  }
  if (bf > 1) {
    rots?.push({ kind: 'R-1', at: r.key });
    r.left = rotL(r.left!);
    return rotR(r);
  }
  if (bf < -1 && abf(r.right) <= 0) {
    rots?.push({ kind: abf(r.right) === 0 ? 'L0' : 'L-1', at: r.key });
    return rotL(r);
  }
  if (bf < -1) {
    rots?.push({ kind: 'L1', at: r.key });
    r.right = rotR(r.right!);
    return rotL(r);
  }
  return r;
}
export const avlClone = (n: AVL | null): AVL | null => (n ? { key: n.key, left: avlClone(n.left), right: avlClone(n.right), h: n.h } : null);
export const avlPreH = (n: AVL | null): string => (n ? `${n.key}:${n.h} ${avlPreH(n.left)}${avlPreH(n.right)}` : '# ');
export const avlPre = (n: AVL | null): number[] => (n ? [n.key, ...avlPre(n.left), ...avlPre(n.right)] : []);
export const avlIn = (n: AVL | null): number[] => (n ? [...avlIn(n.left), n.key, ...avlIn(n.right)] : []);
export function avlValid(n: AVL | null): boolean {
  if (!n) return true;
  const ok = Math.abs(abf(n)) <= 1 && n.h === 1 + Math.max(ah(n.left), ah(n.right));
  return ok && avlValid(n.left) && avlValid(n.right);
}
const avlDraw = (n: AVL | null): DrawNode | null => (n ? { id: `k${n.key}`, v: n.key, left: avlDraw(n.left), right: avlDraw(n.right), sub: abf(n) } : null);
const avlScene = (n: AVL | null, tone: (k: number) => Tone | undefined = () => undefined) => treeScene(avlDraw(n), { tone: (d) => tone(d.v as number), minW: 420 });

/** Plain BST insert without rebalancing (to show the imbalance before rotating). */
function bstOnly(n: AVL | null, key: number): AVL {
  if (!n) return { key, left: null, right: null, h: 1 };
  if (key < n.key) n.left = bstOnly(n.left, key);
  else if (key > n.key) n.right = bstOnly(n.right, key);
  upd(n);
  return n;
}
function firstUnbalanced(n: AVL | null, key: number): AVL | null {
  // deepest node on the path with |bf| > 1
  let found: AVL | null = null;
  while (n) {
    if (Math.abs(abf(n)) > 1) found = n;
    if (key === n.key) break;
    n = key < n.key ? n.left : n.right;
  }
  return found;
}

export function avlInsertFrames(keys: number[], predict = false): Frame[] {
  let root: AVL | null = null;
  const F: Frame[] = [];
  F.push({ scene: avlScene(null), say: `Insert ${keys.join(', ')} into an AVL tree. Numbers beside nodes are balance factors h(left) − h(right).` });
  for (const k of keys) {
    const before = avlClone(root);
    const raw = bstOnly(avlClone(before), k);
    const bad = firstUnbalanced(raw, k);
    if (!bad) {
      root = avlInsert(root, k);
      F.push({ scene: avlScene(root, (x) => (x === k ? 'active' : undefined)), line: 'ins-ok', say: `Insert ${k}: every balance factor stays in {−1, 0, 1}. No rotation.`, sfx: 'push' });
      continue;
    }
    const rots: Rot[] = [];
    root = avlInsert(root, k, rots);
    const r = rots[0];
    const kind = r.kind as 'LL' | 'RR' | 'LR' | 'RL';
    const why = { LL: 'inserted into the Left subtree of the Left child', RR: 'into the Right subtree of the Right child', LR: 'into the Right subtree of the Left child', RL: 'into the Left subtree of the Right child' }[kind];
    F.push({
      scene: avlScene(raw, (x) => (x === k ? 'active' : x === bad.key ? 'warn' : undefined)),
      line: `ins-${kind}`,
      say: `Insert ${k}: node ${bad.key} now has balance factor ${abf(bad)} — unbalanced. ${k} went ${why} ⇒ ${kind} case.`,
      sfx: 'wrong',
      ask: predict ? { prompt: `Node ${bad.key} is unbalanced after inserting ${k}. Which rotation case?`, options: [kind, ...(['LL', 'RR', 'LR', 'RL'] as const).filter((x) => x !== kind)], answer: 0, hint: 'Follow the path from the unbalanced node: first step L or R, second step L or R.' } : undefined,
    });
    F.push({
      scene: avlScene(root, (x) => (x === k ? 'active' : x === bad.key ? 'compare' : undefined)),
      line: `ins-${kind}`,
      say: kind === 'LL' ? `LL: single right rotation at ${bad.key}.` : kind === 'RR' ? `RR: single left rotation at ${bad.key}.` : kind === 'LR' ? `LR: left-rotate ${bad.key}'s left child, then right-rotate ${bad.key} (double rotation).` : `RL: right-rotate ${bad.key}'s right child, then left-rotate ${bad.key} (double rotation).`,
      sfx: 'swap',
    });
  }
  F.push({ scene: avlScene(root), say: `Final AVL tree, height ${ah(root)}. Preorder: ${avlPre(root).join(' ')}.`, sfx: 'found' });
  return F;
}

export function avlDeleteFrames(keys: number[], dels: number[]): Frame[] {
  let root: AVL | null = keys.reduce<AVL | null>((r, k) => avlInsert(r, k), null);
  const F: Frame[] = [{ scene: avlScene(root), say: `AVL tree from ${keys.join(', ')}. Delete ${dels.join(', ')}.` }];
  for (const k of dels) {
    const rots: Rot[] = [];
    root = avlDelete(root, k, rots);
    F.push({
      scene: avlScene(root),
      say: rots.length ? `Delete ${k}: rebalanced with ${rots.map((r) => `${r.kind} rotation at ${r.at}`).join(', then ')}. (After deletion, more than one rotation may be needed on the way up.)` : `Delete ${k}: still balanced, no rotation.`,
      sfx: rots.length ? 'swap' : 'pop',
    });
  }
  return F;
}

/* =====================================================================
   B-tree of order m (Level 31) — mirrors cpp/btree_*.cpp (median index (m−1)/2)
   ===================================================================== */
export interface BT {
  id: string;
  keys: number[];
  kids: BT[]; // empty = leaf
}
let bid = 0;
const bnode = (keys: number[] = [], kids: BT[] = []): BT => ({ id: `b${bid++}`, keys, kids });

export function btInsert(root: BT, k: number, m: number, events?: string[]): BT {
  const rec = (x: BT): { up: number; right: BT } | null => {
    let i = 0;
    while (i < x.keys.length && k > x.keys[i]) i++;
    if (i < x.keys.length && x.keys[i] === k) return null;
    if (!x.kids.length) x.keys.splice(i, 0, k);
    else {
      const r = rec(x.kids[i]);
      if (!r) return null;
      x.keys.splice(i, 0, r.up);
      x.kids.splice(i + 1, 0, r.right);
    }
    if (x.keys.length < m) return null;
    const mid = Math.floor((m - 1) / 2);
    const right = bnode(x.keys.slice(mid + 1), x.kids.length ? x.kids.slice(mid + 1) : []);
    const up = x.keys[mid];
    events?.push(`split [${x.keys.join(' ')}]: ${up} moves up`);
    x.keys = x.keys.slice(0, mid);
    if (x.kids.length) x.kids = x.kids.slice(0, mid + 1);
    return { up, right };
  };
  const r = rec(root);
  if (!r) return root;
  events?.push(`new root [${r.up}]`);
  return bnode([r.up], [root, r.right]);
}
export const btSearch = (x: BT, k: number): boolean => {
  let i = 0;
  while (i < x.keys.length && k > x.keys[i]) i++;
  if (i < x.keys.length && x.keys[i] === k) return true;
  return x.kids.length ? btSearch(x.kids[i], k) : false;
};
export const btDump = (x: BT): string => `[${x.keys.join(' ')}]${x.kids.length ? `(${x.kids.map(btDump).join('')})` : ''}`;
export const btFrom = (keys: number[], m: number) => keys.reduce((r, k) => btInsert(r, k, m), bnode());
export const btKeys = (x: BT): number[] => (x.kids.length ? x.kids.flatMap((c, i) => [...btKeys(c), ...(i < x.keys.length ? [x.keys[i]] : [])]) : x.keys.slice());
export function btValid(x: BT, m: number, isRoot = true): { ok: boolean; depth: number } {
  const minKids = Math.ceil(m / 2);
  if (x.keys.length > m - 1) return { ok: false, depth: 0 };
  for (let i = 1; i < x.keys.length; i++) if (x.keys[i - 1] >= x.keys[i]) return { ok: false, depth: 0 };
  if (!x.kids.length) return { ok: isRoot || x.keys.length >= minKids - 1, depth: 1 };
  if (x.kids.length !== x.keys.length + 1) return { ok: false, depth: 0 };
  if (!isRoot && x.kids.length < minKids) return { ok: false, depth: 0 };
  if (isRoot && x.kids.length < 2) return { ok: false, depth: 0 };
  const ds = x.kids.map((c) => btValid(c, m, false));
  return { ok: ds.every((d) => d.ok && d.depth === ds[0].depth), depth: ds[0].depth + 1 };
}

/**
 * Deletion (convention: an internal key is replaced by its inorder predecessor; on underflow borrow from the
 * left sibling, else the right sibling, else merge with the left sibling, else the right).
 */
export function btDelete(root: BT, k: number, m: number, events?: string[]): BT {
  const minKeys = Math.ceil(m / 2) - 1;
  const fix = (p: BT, i: number) => {
    const c = p.kids[i];
    if (c.keys.length >= minKeys) return;
    const L = i > 0 ? p.kids[i - 1] : null;
    const R = i < p.kids.length - 1 ? p.kids[i + 1] : null;
    if (L && L.keys.length > minKeys) {
      c.keys.unshift(p.keys[i - 1]);
      p.keys[i - 1] = L.keys.pop()!;
      if (L.kids.length) c.kids.unshift(L.kids.pop()!);
      events?.push(`borrow from left sibling through ${p.keys[i - 1]}`);
    } else if (R && R.keys.length > minKeys) {
      c.keys.push(p.keys[i]);
      p.keys[i] = R.keys.shift()!;
      if (R.kids.length) c.kids.push(R.kids.shift()!);
      events?.push(`borrow from right sibling through ${p.keys[i]}`);
    } else if (L) {
      L.keys.push(p.keys[i - 1], ...c.keys);
      L.kids.push(...c.kids);
      p.keys.splice(i - 1, 1);
      p.kids.splice(i, 1);
      events?.push('merge with left sibling');
    } else if (R) {
      c.keys.push(p.keys[i], ...R.keys);
      c.kids.push(...R.kids);
      p.keys.splice(i, 1);
      p.kids.splice(i + 1, 1);
      events?.push('merge with right sibling');
    }
  };
  const del = (x: BT, key: number): void => {
    let i = 0;
    while (i < x.keys.length && key > x.keys[i]) i++;
    if (i < x.keys.length && x.keys[i] === key) {
      if (!x.kids.length) {
        x.keys.splice(i, 1);
        return;
      }
      let p = x.kids[i];
      while (p.kids.length) p = p.kids[p.kids.length - 1];
      const pred = p.keys[p.keys.length - 1];
      events?.push(`replace ${key} by its predecessor ${pred}`);
      x.keys[i] = pred;
      del(x.kids[i], pred);
      fix(x, i);
      return;
    }
    if (!x.kids.length) return;
    del(x.kids[i], key);
    fix(x, i);
  };
  del(root, k);
  if (!root.keys.length && root.kids.length) {
    events?.push('root emptied: tree height shrinks');
    return root.kids[0];
  }
  return root;
}

function btScene(root: BT, hi: Set<string> = new Set(), note?: string): Scene {
  const nodes: SNode[] = [];
  const edges: SEdge[] = [];
  const KW = 30;
  const widthOf = (x: BT): number => Math.max(x.keys.length * KW + 14, x.kids.length ? x.kids.map(widthOf).reduce((a, b) => a + b + 14, -14) : 0);
  const place = (x: BT, left: number, depth: number) => {
    const w = widthOf(x);
    const own = Math.max(30, x.keys.length * KW + 14);
    nodes.push({ id: x.id, x: left + w / 2, y: 40 + depth * 70, w: own, h: 34, shape: 'rect', label: x.keys.join('  ') || '∅', tone: hi.has(x.id) ? 'active' : 'base', fontSize: 13 });
    let cur = left;
    for (const c of x.kids) {
      const cw = widthOf(c);
      place(c, cur, depth + 1);
      edges.push({ from: x.id, to: c.id });
      cur += cw + 14;
    }
  };
  place(root, 20, 0);
  const depth = (x: BT): number => (x.kids.length ? 1 + depth(x.kids[0]) : 1);
  const h = 40 + depth(root) * 70;
  if (note) nodes.push({ id: 'note', x: 20, y: h, shape: 'text', label: note, anchor: 'start', tone: 'muted', fontSize: 12 });
  return { w: Math.max(420, widthOf(root) + 40), h: h + 20, nodes, edges };
}

export function btInsertFrames(keys: number[], m: number, predict = false): Frame[] {
  let root = bnode();
  const F: Frame[] = [{ scene: btScene(root, new Set(), `order m = ${m}: at most ${m - 1} keys and ${m} children per node`), say: `Insert ${keys.join(', ')} into an empty B-tree of order ${m}.` }];
  for (const k of keys) {
    const ev: string[] = [];
    const before = btDump(root);
    root = btInsert(root, k, m, ev);
    const splits = ev.filter((e) => e.startsWith('split')).length;
    F.push({
      scene: btScene(root, new Set(), ev.join(' · ') || undefined),
      line: ev.length ? 'i-split' : 'i-leaf',
      say: before === btDump(root) ? `${k} is already present.` : ev.length ? `Insert ${k}: ${ev.join('; ')}.` : `Insert ${k} into its leaf — fits (≤ ${m - 1} keys).`,
      sfx: ev.length ? 'swap' : 'push',
      ask: predict ? { prompt: `Inserting ${k}: how many node splits happen?`, options: [String(splits), ...['0', '1', '2', '3'].filter((x) => x !== String(splits))].slice(0, 3), answer: 0, hint: `A node splits when it would hold ${m} keys.` } : undefined,
    });
  }
  F.push({ scene: btScene(root), say: `Final tree: ${btDump(root)}. All leaves on the same level — B-trees grow at the root.`, sfx: 'found' });
  return F;
}
export function btDeleteFrames(keys: number[], dels: number[], m: number): Frame[] {
  let root = btFrom(keys, m);
  const F: Frame[] = [{ scene: btScene(root), say: `B-tree of order ${m} from ${keys.join(', ')}. Minimum keys in a non-root node: ⌈m/2⌉ − 1 = ${Math.ceil(m / 2) - 1}.` }];
  for (const k of dels) {
    const ev: string[] = [];
    root = btDelete(root, k, m, ev);
    F.push({ scene: btScene(root, new Set(), ev.join(' · ') || undefined), say: `Delete ${k}${ev.length ? `: ${ev.join('; ')}` : ' from its leaf — no underflow'}.`, sfx: ev.length ? 'swap' : 'pop' });
  }
  return F;
}
