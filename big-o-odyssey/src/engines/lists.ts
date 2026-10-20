import type { Frame, Scene, SNode, SEdge, Tone } from '../core/types';
import type { Item } from '../core/layouts';

/**
 * Linked lists (World 4): reference models (run*) used by tests/crosscheck, and frame builders
 * that mirror the C++ snippets' pointer manipulations step by step.
 */

/* ---------------- models ---------------- */
export type SllOp = { k: 'b'; x: number } | { k: 'e'; x: number } | { k: 'a'; pos: number; x: number } | { k: 'd'; x: number } | { k: 's'; x: number };

export function runSLL(ops: SllOp[]): { outputs: string[]; invalid: number; list: number[] } {
  const L: number[] = [];
  const outputs: string[] = [];
  let invalid = 0;
  for (const o of ops) {
    if (o.k === 'b') L.unshift(o.x);
    else if (o.k === 'e') L.push(o.x);
    else if (o.k === 'a') {
      if (o.pos === 0) L.unshift(o.x);
      else if (o.pos > L.length) invalid++;
      else L.splice(o.pos, 0, o.x);
    } else if (o.k === 'd') {
      const i = L.indexOf(o.x);
      outputs.push(i >= 0 ? 'T' : 'F');
      if (i >= 0) L.splice(i, 1);
    } else outputs.push(String(L.indexOf(o.x)));
  }
  return { outputs, invalid, list: L };
}

export type CllOp = { k: 'f'; x: number } | { k: 'e'; x: number } | { k: 'd' };
export function runCLL(ops: CllOp[]): { list: number[]; last: number | null } {
  const L: number[] = [];
  for (const o of ops) {
    if (o.k === 'f') L.unshift(o.x);
    else if (o.k === 'e') L.push(o.x);
    else L.shift();
  }
  return { list: L, last: L.length ? L[L.length - 1] : null };
}

export type DllOp = { k: 'b'; x: number } | { k: 'e'; x: number } | { k: 'a'; pos: number; x: number } | { k: 'd'; pos: number };
export function runDLL(ops: DllOp[]): number[] {
  const L: number[] = [];
  for (const o of ops) {
    if (o.k === 'b') L.unshift(o.x);
    else if (o.k === 'e') L.push(o.x);
    else if (o.k === 'a') {
      if (o.pos < L.length) L.splice(o.pos + 1, 0, o.x);
    } else if (o.pos < L.length) L.splice(o.pos, 1);
  }
  return L;
}

export type Poly = [number, number][]; // [coef, exp], decreasing exp
export function addPoly(a: Poly, b: Poly): Poly {
  const out: Poly = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i][1] > b[j][1]) out.push(a[i++]);
    else if (a[i][1] < b[j][1]) out.push(b[j++]);
    else {
      const c = a[i][0] + b[j][0];
      if (c !== 0) out.push([c, a[i][1]]);
      i++;
      j++;
    }
  }
  while (i < a.length) out.push(a[i++]);
  while (j < b.length) out.push(b[j++]);
  return out;
}
export const polyStr = (p: Poly) =>
  p.length
    ? p
        .map(([c, e], k) => {
          const sign = c < 0 ? (k ? ' − ' : '−') : k ? ' + ' : '';
          const m = Math.abs(c);
          const body = e === 0 ? `${m}` : `${m === 1 ? '' : m}x${e === 1 ? '' : `^${e}`}`;
          return sign + body;
        })
        .join('')
    : '0';

/* ---------------- drawing ---------------- */
const GAP = 96;
const X0 = 90;
const Y = 110;

interface Draw {
  list: Item[];
  tone?: Record<string, Tone>;
  ptrs?: Record<string, string | null>; // name -> node id (null = NULL)
  floating?: { it: Item; x: number; y: number; tone?: Tone };
  extraEdges?: SEdge[];
  hideEdges?: [string, string][];
  doubly?: boolean;
  circular?: boolean;
  headName?: string; // 'head' | 'last' | 'top' | 'front'
  headAt?: string | null; // node id the head pointer points to
  rearAt?: string | null;
  caption?: string;
}

function draw(d: Draw): Scene {
  const nodes: SNode[] = [];
  const edges: SEdge[] = [];
  const pos: Record<string, [number, number]> = {};
  d.list.forEach((it, i) => {
    pos[it.id] = [X0 + i * GAP, Y];
    nodes.push({ id: it.id, x: X0 + i * GAP, y: Y, w: 58, h: 40, shape: 'rect', label: it.v, tone: d.tone?.[it.id] ?? 'base' });
  });
  if (d.floating) {
    pos[d.floating.it.id] = [d.floating.x, d.floating.y];
    nodes.push({ id: d.floating.it.id, x: d.floating.x, y: d.floating.y, w: 58, h: 40, shape: 'rect', label: d.floating.it.v, tone: d.floating.tone ?? 'active', sub: 'new', subPos: 'below' });
  }
  const hidden = new Set((d.hideEdges ?? []).map(([a, b]) => `${a}>${b}`));
  const add = (e: SEdge) => !hidden.has(`${e.from}>${e.to}`) && edges.push(e);
  d.list.forEach((it, i) => {
    if (i > 0) {
      add({ from: d.list[i - 1].id, to: it.id, directed: true, bend: d.doubly ? -8 : 0 });
      if (d.doubly) add({ from: it.id, to: d.list[i - 1].id, directed: true, bend: -8, tone: 'muted' });
    }
  });
  const endX = X0 + d.list.length * GAP - 26;
  if (!d.circular) {
    nodes.push({ id: 'NULL', x: d.list.length ? endX : X0, y: Y, shape: 'text', label: 'NULL', tone: 'muted', fontSize: 12 });
    if (d.list.length) add({ from: d.list[d.list.length - 1].id, to: 'NULL', directed: true });
  } else if (d.list.length) {
    add({ from: d.list[d.list.length - 1].id, to: d.list[0].id, directed: true, bend: d.list.length === 1 ? 46 : -Math.min(80, 30 + d.list.length * 7) });
  }
  const hn = d.headName ?? 'head';
  nodes.push({ id: 'HEAD', x: X0 - 50, y: 34, w: Math.max(48, hn.length * 9 + 16), h: 22, shape: 'tag', label: hn, tone: 'accent' });
  const ha = d.headAt === undefined ? d.list[0]?.id : d.headAt;
  if (ha) edges.push({ from: 'HEAD', to: ha, directed: true, tone: 'accent' });
  if (d.rearAt !== undefined) {
    nodes.push({ id: 'REAR', x: Math.max(X0 + 40, endX - 30), y: 34, w: 48, h: 22, shape: 'tag', label: 'rear', tone: 'compare' });
    if (d.rearAt) edges.push({ from: 'REAR', to: d.rearAt, directed: true, tone: 'compare' });
  }
  const level: Record<string, number> = {};
  for (const [name, target] of Object.entries(d.ptrs ?? {})) {
    const at = target ? pos[target] : [X0 - 60, Y + 70];
    if (!at) continue;
    const key = target ?? 'null';
    const lv = (level[key] = (level[key] ?? 0) + 1) - 1;
    const id = `P-${name}`;
    nodes.push({ id, x: at[0], y: (target && d.floating?.it.id === target ? at[1] : Y) + 66 + lv * 26, w: Math.max(30, name.length * 8 + 16), h: 20, shape: 'tag', label: target ? name : `${name}=NULL`, tone: 'compare' });
    if (target) edges.push({ from: id, to: target, directed: true, tone: 'compare' });
  }
  edges.push(...(d.extraEdges ?? []));
  if (d.caption) nodes.push({ id: 'CAP', x: 20, y: 250, shape: 'text', label: d.caption, anchor: 'start', tone: 'muted', fontSize: 12 });
  const maxX = Math.max(endX + 40, (d.floating?.x ?? 0) + 60, 360);
  return { w: maxX, h: 270, nodes, edges };
}

let uid = 0;
const nid = () => `n${uid++}`;

/* ---------------- singly linked list frames ---------------- */
export function sllFrames(initial: number[], ops: SllOp[]): Frame[] {
  let list: Item[] = initial.map((v) => ({ id: nid(), v }));
  const F: Frame[] = [];
  F.push({ scene: draw({ list }), say: `Start: ${list.length ? list.map((i) => i.v).join(' → ') + ' → NULL' : 'empty list (head = NULL)'}.` });
  for (const o of ops) {
    if (o.k === 'b' || (o.k === 'a' && o.pos === 0)) {
      const t = { id: nid(), v: o.x };
      if (o.k === 'a') F.push({ scene: draw({ list }), line: 'ia-zero', say: `insertAt(0, ${o.x}) is just insertBegin(${o.x}).` });
      F.push({ scene: draw({ list, floating: { it: t, x: X0 - 10, y: Y + 110 }, extraEdges: list[0] ? [{ from: t.id, to: list[0].id, directed: true, tone: 'active' }] : [], ptrs: { t: t.id } }), line: 'ib-new', say: `t = new Node{${o.x}, head}: the new node already points at the old first node${list[0] ? ` (${list[0].v})` : ' (NULL)'}.`, sfx: 'push' });
      list = [t, ...list];
      F.push({ scene: draw({ list, tone: { [t.id]: 'active' } }), line: 'ib-head', say: `head = t. Two pointer assignments — O(1) regardless of length.`, sfx: 'found' });
    } else if (o.k === 'e') {
      const t = { id: nid(), v: o.x };
      F.push({ scene: draw({ list, floating: { it: t, x: X0 + list.length * GAP, y: Y + 110 }, ptrs: { t: t.id } }), line: 'ie-new', say: `t = new Node{${o.x}, nullptr}.`, sfx: 'push' });
      if (!list.length) {
        list = [t];
        F.push({ scene: draw({ list, tone: { [t.id]: 'active' } }), line: 'ie-empty', say: 'List was empty: head = t.', sfx: 'found' });
        continue;
      }
      for (let i = 0; i < list.length; i++) {
        F.push({ scene: draw({ list, floating: { it: t, x: X0 + list.length * GAP, y: Y + 110 }, ptrs: { p: list[i].id }, tone: { [list[i].id]: 'compare' } }), line: i === 0 ? 'ie-p' : 'ie-walk', say: i < list.length - 1 ? `p->next is not NULL — move p to ${list[i + 1].v}.` : `p->next is NULL: p is the last node (${list[i].v}).`, sfx: 'tick' });
      }
      const last = list[list.length - 1];
      F.push({ scene: draw({ list, floating: { it: t, x: X0 + list.length * GAP, y: Y + 110 }, ptrs: { p: last.id }, extraEdges: [{ from: last.id, to: t.id, directed: true, tone: 'active' }], hideEdges: [[last.id, 'NULL']] }), line: 'ie-link', say: `p->next = t. Walking to the end made this O(n) (keep a tail pointer to make it O(1)).` });
      list = [...list, t];
      F.push({ scene: draw({ list, tone: { [t.id]: 'active' } }), say: `Inserted ${o.x} at the end.`, sfx: 'found' });
    } else if (o.k === 'a') {
      const t = { id: nid(), v: o.x };
      let p = 0;
      F.push({ scene: draw({ list, ptrs: { p: list[0]?.id ?? null } }), line: 'ia-p', say: `insertAt(${o.pos}, ${o.x}): walk p to the node at position pos − 1 = ${o.pos - 1}.` });
      for (let i = 0; i < o.pos - 1 && p < list.length; i++) {
        p++;
        F.push({ scene: draw({ list, ptrs: { p: list[p]?.id ?? null } }), line: 'ia-walk', say: p < list.length ? `p = p->next → ${list[p].v} (i = ${i + 1}).` : 'p ran off the end (NULL).', sfx: 'tick' });
      }
      if (p >= list.length || !list.length) {
        F.push({ scene: draw({ list, ptrs: { p: null } }), line: 'ia-check', say: `p is NULL: position ${o.pos} is beyond the end → "Invalid position".`, sfx: 'wrong' });
        continue;
      }
      const P = list[p];
      const nxt = list[p + 1];
      F.push({
        scene: draw({ list, floating: { it: t, x: X0 + p * GAP + GAP / 2, y: Y + 110 }, ptrs: { p: P.id }, extraEdges: [{ from: t.id, to: nxt ? nxt.id : 'NULL', directed: true, tone: 'active' }] }),
        line: 'ia-link',
        say: `new Node{${o.x}, p->next}: t first points to p's successor (${nxt ? nxt.v : 'NULL'}) …`,
        sfx: 'push',
      });
      F.push({
        scene: draw({ list, floating: { it: t, x: X0 + p * GAP + GAP / 2, y: Y + 110 }, ptrs: { p: P.id }, extraEdges: [{ from: t.id, to: nxt ? nxt.id : 'NULL', directed: true, tone: 'active' }, { from: P.id, to: t.id, directed: true, tone: 'active' }], hideEdges: [[P.id, nxt ? nxt.id : 'NULL']] }),
        line: 'ia-link',
        say: `… then p->next = t. Order matters: setting p->next first would lose the rest of the list.`,
      });
      list = [...list.slice(0, p + 1), t, ...list.slice(p + 1)];
      F.push({ scene: draw({ list, tone: { [t.id]: 'active' } }), say: `${o.x} is now at position ${o.pos}.`, sfx: 'found' });
    } else if (o.k === 'd') {
      let cur = 0;
      F.push({ scene: draw({ list, ptrs: { cur: list[0]?.id ?? null, prev: null } }), line: 'd-init', say: `deleteValue(${o.x}): cur = head, prev = NULL.` });
      while (cur < list.length && list[cur].v !== o.x) {
        cur++;
        F.push({ scene: draw({ list, ptrs: { prev: list[cur - 1].id, cur: list[cur]?.id ?? null }, tone: list[cur] ? { [list[cur].id]: 'compare' } : {} }), line: 'd-walk', say: list[cur] ? `${list[cur - 1].v} ≠ ${o.x}: prev = cur, cur = cur->next (${list[cur].v}).` : `${list[cur - 1].v} ≠ ${o.x}: cur becomes NULL.`, sfx: 'tick' });
      }
      if (cur >= list.length) {
        F.push({ scene: draw({ list, ptrs: { cur: null } }), line: 'd-none', say: `${o.x} not found: return false.`, sfx: 'wrong' });
        continue;
      }
      const C = list[cur];
      if (cur === 0) F.push({ scene: draw({ list, ptrs: { cur: C.id }, tone: { [C.id]: 'warn' }, headAt: list[1]?.id ?? null }), line: 'd-first', say: `prev is NULL → deleting the first node: head = cur->next.` });
      else
        F.push({
          scene: draw({ list, ptrs: { prev: list[cur - 1].id, cur: C.id }, tone: { [C.id]: 'warn' }, hideEdges: [[list[cur - 1].id, C.id]], extraEdges: [{ from: list[cur - 1].id, to: list[cur + 1]?.id ?? 'NULL', directed: true, tone: 'active', bend: 40 }] }),
          line: 'd-bypass',
          say: `prev->next = cur->next: ${list[cur - 1].v} now skips over ${C.v}.`,
        });
      list = list.filter((it) => it !== C);
      F.push({ scene: draw({ list }), line: 'd-free', say: `delete cur — free the node's memory. Return true.`, sfx: 'pop' });
    } else if (o.k === 's') {
      let i = 0;
      for (; i < list.length; i++) {
        const hit = list[i].v === o.x;
        F.push({ scene: draw({ list, ptrs: { p: list[i].id }, tone: { [list[i].id]: hit ? 'done' : 'compare' } }), line: 's-cmp', say: `search(${o.x}): position ${i} holds ${list[i].v}${hit ? ' — found!' : '.'}`, sfx: hit ? 'found' : 'tick' });
        if (hit) break;
      }
      if (i === list.length) F.push({ scene: draw({ list, ptrs: { p: null } }), line: 's-none', say: `Reached NULL: return −1.`, sfx: 'wrong' });
    }
  }
  return F;
}

/* ---------------- circular list frames (last pointer) ---------------- */
export function cllFrames(initial: number[], ops: CllOp[]): Frame[] {
  let list: Item[] = initial.map((v) => ({ id: nid(), v }));
  const F: Frame[] = [];
  const lastId = () => list[list.length - 1]?.id ?? null;
  const d = (extra: Partial<Draw> = {}) => draw({ list, circular: true, headName: 'last', headAt: lastId(), ...extra });
  F.push({ scene: d(), say: `Circular list with a pointer to the LAST node: last->next is the first node (${list[0]?.v ?? 'empty'}).` });
  for (const o of ops) {
    if (o.k === 'f' || o.k === 'e') {
      const t = { id: nid(), v: o.x };
      if (!list.length) {
        list = [t];
        F.push({ scene: d({ tone: { [t.id]: 'active' } }), line: 'if-empty', say: `Empty list: t->next = t (a one-node circle) and last = t.`, sfx: 'push' });
        if (o.k === 'e') F.push({ scene: d(), line: 'ie-advance', say: 'insertEnd: last = last->next — still the same single node.' });
        continue;
      }
      const first = list[0];
      F.push({ scene: d({ floating: { it: t, x: X0 - 20, y: Y + 110 }, extraEdges: [{ from: t.id, to: first.id, directed: true, tone: 'active' }] }), line: 'if-link', say: `${o.k === 'e' ? 'insertEnd first calls insertFront. ' : ''}t->next = last->next (the first node, ${first.v}).`, sfx: 'push' });
      F.push({ scene: d({ floating: { it: t, x: X0 - 20, y: Y + 110 }, extraEdges: [{ from: t.id, to: first.id, directed: true, tone: 'active' }, { from: list[list.length - 1].id, to: t.id, directed: true, tone: 'active', bend: 30 }], hideEdges: [[list[list.length - 1].id, first.id]] }), line: 'if-close', say: `last->next = t: the circle now passes through ${o.x}, which is the new first node.` });
      list = [t, ...list];
      F.push({ scene: d({ tone: { [t.id]: 'active' } }), say: `${o.x} inserted at the front in O(1).`, sfx: 'found' });
      if (o.k === 'e') {
        list = [...list.slice(1), t];
        F.push({ scene: d({ tone: { [t.id]: 'active' } }), line: 'ie-advance', say: `insertEnd: last = last->next. The new front node becomes the last — the circle didn't change, only where 'last' points.`, sfx: 'swap' });
      }
    } else {
      if (!list.length) {
        F.push({ scene: d(), line: 'df-empty', say: 'deleteFront on an empty list: nothing to do.', sfx: 'wrong' });
        continue;
      }
      const first = list[0];
      if (list.length === 1) {
        F.push({ scene: d({ tone: { [first.id]: 'warn' } }), line: 'df-single', say: 'Only one node (first == last): the list becomes empty, last = NULL.' });
        list = [];
        F.push({ scene: d(), line: 'df-free', say: 'delete first.', sfx: 'pop' });
        continue;
      }
      F.push({ scene: d({ tone: { [first.id]: 'warn' }, ptrs: { first: first.id }, hideEdges: [[list[list.length - 1].id, first.id]], extraEdges: [{ from: list[list.length - 1].id, to: list[1].id, directed: true, tone: 'active', bend: -60 }] }), line: 'df-bypass', say: `first = last->next (${first.v}); last->next = first->next (${list[1].v}).` });
      list = list.slice(1);
      F.push({ scene: d(), line: 'df-free', say: `delete first. O(1).`, sfx: 'pop' });
    }
  }
  return F;
}

/* ---------------- doubly linked list frames ---------------- */
export function dllFrames(initial: number[], ops: DllOp[]): Frame[] {
  let list: Item[] = initial.map((v) => ({ id: nid(), v }));
  const F: Frame[] = [];
  const d = (extra: Partial<Draw> = {}) => draw({ list, doubly: true, ...extra });
  F.push({ scene: d(), say: 'Doubly linked list: every node knows its prev (grey) and next (bold).' });
  for (const o of ops) {
    if (o.k === 'b') {
      const t = { id: nid(), v: o.x };
      F.push({ scene: d({ floating: { it: t, x: X0 - 20, y: Y + 110 }, extraEdges: list[0] ? [{ from: t.id, to: list[0].id, directed: true, tone: 'active' }] : [] }), line: 'ib-new', say: `t = new DNode{${o.x}, nullptr, head}.`, sfx: 'push' });
      if (list[0]) F.push({ scene: d({ floating: { it: t, x: X0 - 20, y: Y + 110 }, extraEdges: [{ from: t.id, to: list[0].id, directed: true, tone: 'active' }, { from: list[0].id, to: t.id, directed: true, tone: 'active', bend: 20 }] }), line: 'ib-fix', say: `head->prev = t (the old first node points back to t).` });
      list = [t, ...list];
      F.push({ scene: d({ tone: { [t.id]: 'active' } }), line: 'ib-head', say: 'head = t.', sfx: 'found' });
    } else if (o.k === 'e') {
      const t = { id: nid(), v: o.x };
      if (!list.length) {
        list = [t];
        F.push({ scene: d({ tone: { [t.id]: 'active' } }), line: 'ie-new', say: 'Empty: head = t.', sfx: 'push' });
        continue;
      }
      const last = list[list.length - 1];
      F.push({ scene: d({ floating: { it: t, x: X0 + list.length * GAP, y: Y + 110 }, ptrs: { p: last.id } }), line: 'ie-walk', say: `Walk p to the last node (${last.v}).`, sfx: 'tick' });
      F.push({ scene: d({ floating: { it: t, x: X0 + list.length * GAP, y: Y + 110 }, ptrs: { p: last.id }, hideEdges: [[last.id, 'NULL']], extraEdges: [{ from: last.id, to: t.id, directed: true, tone: 'active' }, { from: t.id, to: last.id, directed: true, tone: 'active', bend: 20 }] }), line: 'ie-back', say: 'p->next = t; t->prev = p.' });
      list = [...list, t];
      F.push({ scene: d({ tone: { [t.id]: 'active' } }), say: `${o.x} appended.`, sfx: 'found' });
    } else if (o.k === 'a') {
      if (o.pos >= list.length) {
        F.push({ scene: d(), say: `There is no node at position ${o.pos}.`, sfx: 'wrong' });
        continue;
      }
      const P = list[o.pos];
      const N = list[o.pos + 1];
      const t = { id: nid(), v: o.x };
      const fx = X0 + o.pos * GAP + GAP / 2;
      F.push({ scene: d({ floating: { it: t, x: fx, y: Y + 110 }, ptrs: { p: P.id }, extraEdges: [{ from: t.id, to: P.id, directed: true, tone: 'muted' }, ...(N ? [{ from: t.id, to: N.id, directed: true, tone: 'active' } as SEdge] : [])] }), line: 'ia-new', say: `insertAfter(p = ${P.v}, ${o.x}): t = new DNode{${o.x}, p, p->next} — both of t's links are set first.`, sfx: 'push' });
      if (N) F.push({ scene: d({ floating: { it: t, x: fx, y: Y + 110 }, ptrs: { p: P.id }, hideEdges: [[N.id, P.id]], extraEdges: [{ from: t.id, to: P.id, directed: true, tone: 'muted' }, { from: t.id, to: N.id, directed: true, tone: 'active' }, { from: N.id, to: t.id, directed: true, tone: 'active', bend: 20 }] }), line: 'ia-fix', say: `p->next->prev = t (${N.v} now points back to ${o.x}).` });
      F.push({ scene: d({ floating: { it: t, x: fx, y: Y + 110 }, ptrs: { p: P.id }, hideEdges: [[P.id, N ? N.id : 'NULL'], ...(N ? ([[N.id, P.id]] as [string, string][]) : [])], extraEdges: [{ from: t.id, to: P.id, directed: true, tone: 'muted' }, ...(N ? [{ from: t.id, to: N.id, directed: true, tone: 'active' } as SEdge, { from: N.id, to: t.id, directed: true, tone: 'active', bend: 20 } as SEdge] : []), { from: P.id, to: t.id, directed: true, tone: 'active' }] }), line: 'ia-link', say: 'p->next = t. Four pointers updated, O(1).' });
      list = [...list.slice(0, o.pos + 1), t, ...list.slice(o.pos + 1)];
      F.push({ scene: d({ tone: { [t.id]: 'active' } }), say: `${o.x} inserted after ${P.v}.`, sfx: 'found' });
    } else {
      if (o.pos >= list.length) {
        F.push({ scene: d(), say: `There is no node at position ${o.pos}.`, sfx: 'wrong' });
        continue;
      }
      const P = list[o.pos];
      const A = list[o.pos - 1];
      const B = list[o.pos + 1];
      F.push({ scene: d({ ptrs: { p: P.id }, tone: { [P.id]: 'warn' }, headAt: A ? undefined : B?.id ?? null, hideEdges: A ? [[A.id, P.id]] : [], extraEdges: A ? [{ from: A.id, to: B ? B.id : 'NULL', directed: true, tone: 'active', bend: 46 }] : [] }), line: A ? 'dn-prev' : 'dn-head', say: A ? `p->prev->next = p->next (${A.v} → ${B ? B.v : 'NULL'}).` : `p is the first node: head = p->next.` });
      if (B) F.push({ scene: d({ ptrs: { p: P.id }, tone: { [P.id]: 'warn' }, headAt: A ? undefined : B.id, hideEdges: [...(A ? ([[A.id, P.id]] as [string, string][]) : []), [B.id, P.id]], extraEdges: [...(A ? [{ from: A.id, to: B.id, directed: true, tone: 'active', bend: 46 } as SEdge, { from: B.id, to: A.id, directed: true, tone: 'active', bend: 46 } as SEdge] : [])] }), line: 'dn-next', say: `p->next->prev = p->prev (${B.v} ← ${A ? A.v : 'NULL'}).` });
      list = list.filter((x) => x !== P);
      F.push({ scene: d(), line: 'dn-free', say: `delete p. No search for the predecessor was needed — that's the point of prev links.`, sfx: 'pop' });
    }
  }
  return F;
}

/* ---------------- linked stack / queue ---------------- */
export function linkedSQFrames(kind: 'stack' | 'queue', ops: ({ k: 'add'; x: number } | { k: 'rem' })[]): Frame[] {
  let list: Item[] = [];
  const F: Frame[] = [];
  const isQ = kind === 'queue';
  const d = (extra: Partial<Draw> = {}) => draw({ list, headName: isQ ? 'front' : 'top', rearAt: isQ ? list[list.length - 1]?.id ?? null : undefined, ...extra });
  F.push({ scene: d(), say: isQ ? 'Linked queue: front = rear = NULL.' : 'Linked stack: top = NULL. No capacity limit.' });
  for (const o of ops) {
    if (o.k === 'add') {
      const t = { id: nid(), v: o.x };
      if (!isQ) {
        F.push({ scene: d({ floating: { it: t, x: X0 - 20, y: Y + 110 }, extraEdges: list[0] ? [{ from: t.id, to: list[0].id, directed: true, tone: 'active' }] : [] }), line: 'push', say: `push(${o.x}): top = new SNode{${o.x}, top} — the new node points to the old top …`, sfx: 'push' });
        list = [t, ...list];
        F.push({ scene: d({ tone: { [t.id]: 'active' } }), line: 'push', say: '… and becomes the top. O(1).' });
      } else if (!list.length) {
        list = [t];
        F.push({ scene: d({ tone: { [t.id]: 'active' } }), line: 'enq-empty', say: `enqueue(${o.x}) into an empty queue: front = rear = t.`, sfx: 'push' });
      } else {
        const r = list[list.length - 1];
        F.push({ scene: d({ floating: { it: t, x: X0 + list.length * GAP, y: Y + 110 }, hideEdges: [[r.id, 'NULL']], extraEdges: [{ from: r.id, to: t.id, directed: true, tone: 'active' }] }), line: 'enq-link', say: `rear->next = t.`, sfx: 'push' });
        list = [...list, t];
        F.push({ scene: d({ tone: { [t.id]: 'active' } }), line: 'enq-rear', say: 'rear = t. Keeping a rear pointer makes enqueue O(1).' });
      }
    } else {
      if (!list.length) {
        F.push({ scene: d(), line: isQ ? 'deq-empty' : 'pop-empty', say: isQ ? '"Queue empty" → −1.' : '"Stack underflow" → −1.', sfx: 'wrong' });
        continue;
      }
      const f = list[0];
      F.push({ scene: d({ tone: { [f.id]: 'warn' }, ptrs: { t: f.id } }), line: isQ ? 'deq-take' : 'pop-take', say: `t = ${isQ ? 'front' : 'top'}; x = t->data = ${f.v}.` });
      list = list.slice(1);
      F.push({ scene: d(), line: isQ ? (list.length ? 'deq-advance' : 'deq-last') : 'pop-advance', say: isQ ? (list.length ? `front = front->next; delete t; return ${f.v}.` : `Queue became empty: front = NULL so rear = NULL too. Return ${f.v}.`) : `top = t->next; delete t; return ${f.v}.`, sfx: 'pop' });
    }
  }
  return F;
}

/* ---------------- polynomial addition ---------------- */
export function polyFrames(a: Poly, b: Poly): Frame[] {
  const F: Frame[] = [];
  const out: Poly = [];
  let i = 0;
  let j = 0;
  const term = (p: Poly, k: number, prefix: string, y: number, hi: number, used: number): SNode[] =>
    p.map(([c, e], idx) => ({ id: `${prefix}${idx}`, x: 110 + idx * 92, y, w: 76, h: 38, shape: 'rect' as const, label: `${c}x^${e}`, tone: idx === hi ? ('compare' as const) : idx < used ? ('muted' as const) : ('base' as const), fontSize: 13 }));
  const sc = (hiA: number, hiB: number): Scene => {
    const nodes: SNode[] = [
      { id: 'la', x: 20, y: 50, shape: 'text', label: 'A', anchor: 'start', tone: 'muted' },
      { id: 'lb', x: 20, y: 120, shape: 'text', label: 'B', anchor: 'start', tone: 'muted' },
      { id: 'lc', x: 20, y: 210, shape: 'text', label: 'A+B', anchor: 'start', tone: 'accent' },
      ...term(a, 0, 'a', 50, hiA, i),
      ...term(b, 0, 'b', 120, hiB, j),
      ...out.map(([c, e], k) => ({ id: `c${k}`, x: 110 + k * 92, y: 210, w: 76, h: 38, shape: 'rect' as const, label: `${c}x^${e}`, tone: 'done' as const, fontSize: 13 })),
    ];
    const edges: SEdge[] = [];
    for (const [p, pre] of [[a, 'a'], [b, 'b'], [out, 'c']] as [Poly, string][]) for (let k = 1; k < p.length; k++) edges.push({ from: `${pre}${k - 1}`, to: `${pre}${k}`, directed: true });
    return { w: 140 + Math.max(a.length, b.length, out.length + 1) * 92, h: 260, nodes, edges };
  };
  F.push({ scene: sc(-1, -1), say: `A = ${polyStr(a)},  B = ${polyStr(b)}. Walk both lists like merging sorted lists (by decreasing exponent).` });
  while (i < a.length && j < b.length) {
    const [ca, ea] = a[i];
    const [cb, eb] = b[j];
    if (ea > eb) {
      F.push({ scene: sc(i, j), line: 'a-bigger', say: `exp ${ea} > ${eb}: copy ${ca}x^${ea} from A.`, sfx: 'compare' });
      out.push(a[i++]);
    } else if (ea < eb) {
      F.push({ scene: sc(i, j), line: 'b-bigger', say: `exp ${ea} < ${eb}: copy ${cb}x^${eb} from B.`, sfx: 'compare' });
      out.push(b[j++]);
    } else {
      const c = ca + cb;
      F.push({ scene: sc(i, j), line: 'equal', say: `Equal exponents ${ea}: ${ca} + ${cb} = ${c}${c === 0 ? ' — zero, so the term is dropped' : ''}.`, sfx: 'swap' });
      if (c !== 0) out.push([c, ea]);
      i++;
      j++;
    }
  }
  if (i < a.length || j < b.length) F.push({ scene: sc(-1, -1), line: 'rest', say: `One list is exhausted: copy the remaining terms of ${i < a.length ? 'A' : 'B'}.` });
  while (i < a.length) out.push(a[i++]);
  while (j < b.length) out.push(b[j++]);
  F.push({ scene: sc(-1, -1), say: `A + B = ${polyStr(out)}. Time O(m + n) for m and n terms.`, sfx: 'found' });
  return F;
}
