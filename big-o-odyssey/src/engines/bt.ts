import type { Frame, Scene, SNode, SEdge, Tone } from '../core/types';

/* =====================================================================
   N-Queens (Level 57) — mirrors cpp/n_queens.cpp
   ===================================================================== */
export function nQueens(n: number): number[][] {
  const sols: number[][] = [];
  const x = Array(n).fill(0);
  const place = (k: number, c: number) => {
    for (let i = 0; i < k; i++) if (x[i] === c || Math.abs(x[i] - c) === Math.abs(i - k)) return false;
    return true;
  };
  const go = (k: number) => {
    for (let c = 0; c < n; c++)
      if (place(k, c)) {
        x[k] = c;
        if (k === n - 1) sols.push(x.slice());
        else go(k + 1);
      }
  };
  go(0);
  return sols;
}

export function queensFrames(n: number, maxSolutions = 1, predict = false): Frame[] {
  const F: Frame[] = [];
  const x: number[] = [];
  let found = 0;
  let tried = 0;
  const S = 46;
  const sc = (row: number | null, col: number | null, bad: [number, number] | null): Scene => {
    const nodes: SNode[] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const isQ = x[r] === c && r < x.length;
        const light = (r + c) % 2 === 0;
        nodes.push({ id: `sq${r}-${c}`, x: 40 + c * S, y: 40 + r * S, w: S - 2, h: S - 2, shape: 'rect', label: isQ ? '♛' : r === row && c === col ? '?' : '', fontSize: 22, tone: bad && bad[0] === r && bad[1] === c ? 'warn' : r === row && c === col ? 'compare' : isQ ? 'accent' : light ? 'base' : 'muted' });
      }
    for (let r = 0; r < n; r++) nodes.push({ id: `rl${r}`, x: 16, y: 40 + r * S, shape: 'text', label: r, tone: 'muted', fontSize: 11 });
    for (let c = 0; c < n; c++) nodes.push({ id: `cl${c}`, x: 40 + c * S, y: 14, shape: 'text', label: c, tone: 'muted', fontSize: 11 });
    nodes.push({ id: 'xs', x: 60 + n * S, y: 40, shape: 'text', label: `x = [${x.join(', ')}]`, anchor: 'start', tone: 'accent', fontSize: 13 });
    nodes.push({ id: 'tr', x: 60 + n * S, y: 66, shape: 'text', label: `placements tried: ${tried}`, anchor: 'start', tone: 'muted', fontSize: 12 });
    return { w: 260 + n * S, h: 60 + n * S, nodes };
  };
  F.push({ scene: sc(null, null, null), say: `Place ${n} queens, one per row, so that no two share a column or a diagonal. x[k] = column of the queen in row k.` });
  const go = (k: number): boolean => {
    for (let c = 0; c < n; c++) {
      tried++;
      let bad: [number, number] | null = null;
      for (let i = 0; i < k; i++)
        if (x[i] === c || Math.abs(x[i] - c) === Math.abs(i - k)) {
          bad = [i, x[i]];
          break;
        }
      if (bad) {
        F.push({ scene: sc(k, c, bad), line: 'attack', say: `Row ${k}, column ${c}: attacked by the queen at (${bad[0]}, ${bad[1]}) — ${x[bad[0]] === c ? 'same column' : 'same diagonal'}.`, sfx: 'wrong' });
        continue;
      }
      x[k] = c;
      F.push({
        scene: sc(null, null, null),
        line: 'put',
        say: `Row ${k}, column ${c} is safe: place a queen (x[${k}] = ${c}).`,
        sfx: 'push',
        ask: predict && k > 0 ? { prompt: `Row ${k}: which column is the first safe one (trying 0, 1, 2, …)?`, options: [...new Set([c, ...[...Array(n).keys()].filter((cc) => cc !== c)])].slice(0, 4).map(String), answer: 0, hint: 'Check every earlier queen: same column, or |Δcol| = |Δrow|.' } : undefined,
      });
      if (k === n - 1) {
        found++;
        F.push({ scene: sc(null, null, null), line: 'full', say: `All ${n} queens placed — solution ${found}: x = [${x.join(', ')}].`, sfx: 'found' });
        if (found >= maxSolutions) return true;
      } else if (go(k + 1)) return true;
      x.length = k;
      F.push({ scene: sc(null, null, null), line: 'try', say: `Row ${k + 1} has no safe column left: BACKTRACK — remove the queen from row ${k} and try its next column.`, sfx: 'pop' });
    }
    return false;
  };
  if (!go(0)) F.push({ scene: sc(null, null, null), say: found ? `Done: ${found} solution(s).` : `No solution exists for n = ${n}.`, sfx: found ? 'found' : 'wrong' });
  return F;
}

/* =====================================================================
   Sum of subsets (Level 58) — mirrors cpp/sum_of_subsets.cpp
   ===================================================================== */
export function sumOfSubsets(w: number[], m: number): number[][] {
  const n = w.length;
  const out: number[][] = [];
  const x = Array(n).fill(0);
  const go = (k: number, s: number, r: number) => {
    if (k === n) return;
    x[k] = 1;
    if (s + w[k] === m) out.push([...x.slice(0, k + 1), ...Array(n - k - 1).fill(0)]);
    else if (k + 1 < n && s + w[k] + w[k + 1] <= m) go(k + 1, s + w[k], r - w[k]);
    x[k] = 0;
    if (k + 1 < n && s + r - w[k] >= m && s + w[k + 1] <= m) go(k + 1, s, r - w[k]);
  };
  go(0, 0, w.reduce((a, b) => a + b, 0));
  return out;
}

interface TNode {
  id: string;
  label: string;
  parent?: string;
  edge?: string;
  tone: Tone;
  depth: number;
}
/** Lay out a growing state-space tree: x by leaf order, y by depth. */
function treeScene(nodes: TNode[], extra: SNode[] = [], w0 = 0): Scene {
  const kids = new Map<string, TNode[]>();
  nodes.forEach((n) => n.parent && kids.set(n.parent, [...(kids.get(n.parent) ?? []), n]));
  const root = nodes.find((n) => !n.parent);
  const out: SNode[] = [];
  const edges: SEdge[] = [];
  let leaf = 0;
  const place = (n: TNode): number => {
    const ch = kids.get(n.id) ?? [];
    let x: number;
    if (!ch.length) x = 50 + leaf++ * 74;
    else {
      const xs = ch.map(place);
      x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    out.push({ id: n.id, x, y: 40 + n.depth * 66, w: 68, h: 30, shape: 'rect', label: n.label, tone: n.tone, fontSize: 10 });
    if (n.parent) edges.push({ from: n.parent, to: n.id, label: n.edge, tone: n.tone === 'muted' || n.tone === 'warn' ? 'ghost' : undefined });
    return x;
  };
  if (root) place(root);
  const maxD = Math.max(0, ...nodes.map((n) => n.depth));
  return { w: Math.max(w0, 80 + leaf * 74), h: 80 + maxD * 66, nodes: [...out, ...extra], edges };
}

export function sumOfSubsetsFrames(w: number[], m: number): Frame[] {
  const n = w.length;
  const nodes: TNode[] = [];
  const F: Frame[] = [];
  const sols: string[] = [];
  let uid = 0;
  const addNode = (label: string, depth: number, parent?: string, edge?: string, tone: Tone = 'base') => {
    const id = `n${uid++}`;
    nodes.push({ id, label, parent, edge, tone, depth });
    return id;
  };
  const cap = () => treeScene(nodes, [{ id: 'sol', x: 20, y: 18, shape: 'text', label: `solutions: ${sols.join('  ') || '—'}`, anchor: 'start', tone: 'done', fontSize: 12 }]);
  const total = w.reduce((a, b) => a + b, 0);
  const root = addNode(`s0 r${total}`, 0);
  F.push({ scene: cap(), say: `w = [${w.join(', ')}] (ascending), m = ${m}. Node label: s = sum chosen so far, r = sum still available.` });
  const x = Array(n).fill(0);
  const go = (k: number, s: number, r: number, at: string) => {
    if (k === n || uid > 60) return;
    x[k] = 1;
    if (s + w[k] === m) {
      addNode(`s${s + w[k]} ✓`, k + 1, at, `x${k + 1}=1`, 'done');
      sols.push(`{${w.filter((_, i) => i <= k && (i === k || x[i])).join(', ')}}`);
      F.push({ scene: cap(), line: 'found', say: `Include w${k + 1} = ${w[k]}: s = ${s + w[k]} = m — a solution!`, sfx: 'found' });
    } else if (k + 1 < n && s + w[k] + w[k + 1] <= m) {
      const id = addNode(`s${s + w[k]} r${r - w[k]}`, k + 1, at, `x${k + 1}=1`, 'active');
      F.push({ scene: cap(), line: 'left', say: `Include w${k + 1} = ${w[k]}: s = ${s + w[k]}; adding the next weight ${w[k + 1]} still fits (≤ ${m}), so go deeper.`, sfx: 'push' });
      nodes.find((nd) => nd.id === id)!.tone = 'base';
      go(k + 1, s + w[k], r - w[k], id);
    } else {
      addNode(`s${s + w[k]} ✗`, k + 1, at, `x${k + 1}=1`, 'warn');
      F.push({ scene: cap(), line: 'left', say: `Include w${k + 1} = ${w[k]} → s = ${s + w[k]}: ${k + 1 < n ? `even the next weight ${w[k + 1]} would overshoot ${m}` : 'no items left'} — bound kills this branch.`, sfx: 'wrong' });
    }
    x[k] = 0;
    if (k + 1 < n && s + r - w[k] >= m && s + w[k + 1] <= m) {
      const id = addNode(`s${s} r${r - w[k]}`, k + 1, at, `x${k + 1}=0`, 'active');
      F.push({ scene: cap(), line: 'right', say: `Exclude w${k + 1}: s stays ${s}; the rest (${r - w[k]}) can still reach ${m} and the next weight fits — explore.`, sfx: 'push' });
      nodes.find((nd) => nd.id === id)!.tone = 'base';
      go(k + 1, s, r - w[k], id);
    } else if (k + 1 < n) {
      addNode(`s${s} ✗`, k + 1, at, `x${k + 1}=0`, 'warn');
      F.push({ scene: cap(), line: 'right', say: `Exclude w${k + 1}: ${s + r - w[k] < m ? `the remaining weights sum to only ${s + r - w[k]} < ${m}` : `even the next weight overshoots`} — killed.`, sfx: 'wrong' });
    }
  };
  go(0, 0, total, root);
  F.push({ scene: cap(), say: `${sols.length} subset(s) found: ${sols.join(', ') || 'none'}. Only ${uid} nodes of the 2^${n + 1} − 1 = ${2 ** (n + 1) - 1} in the full tree were generated.`, sfx: 'found' });
  return F;
}

/* =====================================================================
   Knapsack: backtracking (Level 58) and branch & bound (Levels 59–60)
   Items must be sorted by value/weight descending.
   ===================================================================== */
export const sortByRatio = (wt: number[], val: number[]) => {
  const idx = wt.map((_, i) => i).sort((a, b) => val[b] * wt[a] - val[a] * wt[b]);
  return { wt: idx.map((i) => wt[i]), val: idx.map((i) => val[i]), idx };
};
export function fracBound(k: number, cv: number, cw: number, W: number, wt: number[], val: number[]): number {
  let b = cv;
  let c = cw;
  for (let i = k; i < wt.length; i++) {
    if (c + wt[i] <= W) {
      c += wt[i];
      b += val[i];
    } else return b + ((W - c) * val[i]) / wt[i];
  }
  return b;
}
/** Greedy completion that skips items that don't fit — a feasible (lower-bound) value. */
export function greedyFill(k: number, cv: number, cw: number, W: number, wt: number[], val: number[]): number {
  let b = cv;
  let c = cw;
  for (let i = k; i < wt.length; i++)
    if (c + wt[i] <= W) {
      c += wt[i];
      b += val[i];
    }
  return b;
}
export function bknap(W: number, wt: number[], val: number[]): { best: number; nodes: number } {
  let best = 0;
  let nodes = 0;
  const go = (k: number, cv: number, cw: number) => {
    nodes++;
    if (k === wt.length) {
      best = Math.max(best, cv);
      return;
    }
    if (cw + wt[k] <= W) go(k + 1, cv + val[k], cw + wt[k]);
    if (fracBound(k + 1, cv, cw, W, wt, val) > best) go(k + 1, cv, cw);
  };
  go(0, 0, 0);
  return { best, nodes };
}

export type Strategy = 'FIFO' | 'LIFO' | 'LC';
interface BBNode {
  id: string;
  k: number;
  cv: number;
  cw: number;
  ub: number; // fractional bound (optimistic)
  lb: number; // greedy feasible value (pessimistic)
  parent?: string;
  edge?: string;
  order: number;
}
export interface BBResult {
  best: number;
  expanded: string[];
  generated: number;
  frames: Frame[];
}

/**
 * Branch and bound for 0/1 knapsack in the maximisation form:
 *   ub(x) = fractional-greedy bound, lb(x) = greedy integer completion (a feasible value).
 *   best = max lb seen; a live node is killed when ub < best.
 * Sahni states it as minimisation with ĉ = −ub and u = −lb (kill when ĉ > upper) — the same test.
 * LC expands the live node with the largest ub (ties: generated first); FIFO uses a queue; LIFO a stack.
 * LC stops when it selects a leaf; FIFO/LIFO stop when no live nodes remain.
 */
export function branchAndBound(W: number, wt: number[], val: number[], strat: Strategy, withFrames = true, predict = false): BBResult {
  const n = wt.length;
  let order = 0;
  let uid = 0;
  const mk = (k: number, cv: number, cw: number, parent?: string, edge?: string): BBNode => ({ id: `b${uid++}`, k, cv, cw, ub: fracBound(k, cv, cw, W, wt, val), lb: greedyFill(k, cv, cw, W, wt, val), parent, edge, order: order++ });
  const root = mk(0, 0, 0);
  let best = root.lb;
  const live: BBNode[] = [root];
  const all: BBNode[] = [root];
  const killed = new Set<string>();
  const expanded: string[] = [];
  const F: Frame[] = [];
  const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  const draw = (cur: string | null, note?: string): Scene => {
    const tn: TNode[] = all.map((b) => ({
      id: b.id,
      label: `v${b.cv} w${b.cw} ub${fmt(b.ub)}`,
      parent: b.parent,
      edge: b.edge,
      depth: b.k,
      tone: b.id === cur ? 'active' : killed.has(b.id) ? 'warn' : expanded.includes(b.id) ? 'done' : 'compare',
    }));
    return treeScene(tn, [
      { id: 'info', x: 20, y: 14, shape: 'text', label: `${strat}  ·  best feasible value = ${best}  ·  live: ${live.length}${note ? '  ·  ' + note : ''}`, anchor: 'start', tone: 'accent', fontSize: 12 },
    ]);
  };
  if (withFrames) F.push({ scene: draw(null), say: `Items sorted by value/weight: ${wt.map((w, i) => `(w${w}, v${val[i]})`).join(', ')}, W = ${W}. Root: ub = ${fmt(root.ub)} (fractional greedy), lb = ${root.lb} (greedy feasible) ⇒ best = ${best}.` });
  while (live.length) {
    let idx = 0;
    if (strat === 'LC') {
      for (let i = 1; i < live.length; i++) if (live[i].ub > live[idx].ub + 1e-12) idx = i;
    } else if (strat === 'LIFO') idx = live.length - 1;
    const e = live.splice(idx, 1)[0];
    if (e.ub < best - 1e-12) {
      killed.add(e.id);
      if (withFrames) F.push({ scene: draw(e.id), say: `Node v${e.cv}/w${e.cw}: ub ${fmt(e.ub)} < best ${best} — killed without expanding (bounding).`, sfx: 'wrong' });
      continue;
    }
    if (e.k === n) {
      expanded.push(e.id);
      if (withFrames) F.push({ scene: draw(e.id), say: strat === 'LC' ? `LC picked a leaf (answer node) with value ${e.cv}: since its ub equals its value and no live node has a larger ub, it is optimal. Stop.` : `Leaf with value ${e.cv}.`, sfx: 'found' });
      if (strat === 'LC') {
        best = Math.max(best, e.cv);
        break;
      }
      continue;
    }
    expanded.push(e.id);
    const kids: BBNode[] = [];
    if (e.cw + wt[e.k] <= W) kids.push(mk(e.k + 1, e.cv + val[e.k], e.cw + wt[e.k], e.id, `x${e.k + 1}=1`));
    kids.push(mk(e.k + 1, e.cv, e.cw, e.id, `x${e.k + 1}=0`));
    for (const c of kids) {
      all.push(c);
      best = Math.max(best, c.lb);
      if (c.ub < best - 1e-12) killed.add(c.id);
      else live.push(c);
    }
    const lcNext = strat === 'LC' && live.length ? live.reduce((a, b) => (b.ub > a.ub + 1e-12 ? b : a)) : null;
    if (withFrames)
      F.push({
        scene: draw(e.id),
        say: `Expand v${e.cv}/w${e.cw} on item ${e.k + 1} (w${wt[e.k]}, v${val[e.k]}): children ${kids.map((c) => `${c.edge} → ub ${fmt(c.ub)}, lb ${c.lb}`).join('; ')}. best = ${best}.${kids.some((c) => killed.has(c.id)) ? ' A child with ub < best is killed at once.' : ''}`,
        sfx: 'push',
        ask: predict && lcNext ? { prompt: 'Which live node does LC expand next?', options: [...new Set([lcNext, ...live.filter((l) => l !== lcNext)])].slice(0, 4).map((l) => `v${l.cv} w${l.cw} (ub ${fmt(l.ub)})`), answer: 0, hint: 'Least-cost = largest upper bound ub here (smallest ĉ = −ub in Sahni\'s minimisation form).' } : undefined,
      });
  }
  if (withFrames) F.push({ scene: draw(null), say: `${strat}: optimum ${best}. Expanded ${expanded.length} node(s), generated ${all.length}.`, sfx: 'found' });
  return { best, expanded, generated: all.length, frames: F };
}

export function bknapFrames(W: number, wt0: number[], val0: number[]): Frame[] {
  const { wt, val } = sortByRatio(wt0, val0);
  const nodes: TNode[] = [];
  const F: Frame[] = [];
  let best = 0;
  let uid = 0;
  const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
  const cap = (note = '') => treeScene(nodes, [{ id: 'info', x: 20, y: 14, shape: 'text', label: `best = ${best}${note}`, anchor: 'start', tone: 'accent', fontSize: 12 }]);
  const add = (label: string, depth: number, parent: string | undefined, edge: string | undefined, tone: Tone) => {
    const id = `k${uid++}`;
    nodes.push({ id, label, depth, parent, edge, tone });
    return id;
  };
  F.push({ scene: cap(), say: `Items sorted by value/weight: ${wt.map((w, i) => `(w${w}, v${val[i]})`).join(', ')}; W = ${W}. Depth-first: include first, then exclude only if the bound can beat the best.` });
  const go = (k: number, cv: number, cw: number, parent: string | undefined, edge: string | undefined) => {
    if (uid > 50) return;
    const id = add(`v${cv} w${cw}`, k, parent, edge, 'active');
    if (k === wt.length) {
      const improved = cv > best;
      best = Math.max(best, cv);
      nodes.find((n) => n.id === id)!.tone = improved ? 'done' : 'base';
      F.push({ scene: cap(), line: 'leaf', say: `Leaf: value ${cv}${improved ? ' — new best!' : ''}.`, sfx: improved ? 'found' : 'tick' });
      return;
    }
    F.push({ scene: cap(), line: 'incl', say: `At item ${k + 1} (w${wt[k]}, v${val[k]}) with value ${cv}, weight ${cw}.`, sfx: 'tick' });
    nodes.find((n) => n.id === id)!.tone = 'base';
    if (cw + wt[k] <= W) go(k + 1, cv + val[k], cw + wt[k], id, `x${k + 1}=1`);
    else F.push({ scene: cap(), line: 'incl', say: `Item ${k + 1} doesn't fit — no include branch.` });
    const b = fracBound(k + 1, cv, cw, W, wt, val);
    if (b > best) go(k + 1, cv, cw, id, `x${k + 1}=0`);
    else {
      add(`ub ${fmt(b)} ✗`, k + 1, id, `x${k + 1}=0`, 'warn');
      F.push({ scene: cap(), line: 'excl', say: `Exclude item ${k + 1}? Its bound ${fmt(b)} ≤ best ${best} — prune.`, sfx: 'wrong' });
    }
  };
  go(0, 0, 0, undefined, undefined);
  F.push({ scene: cap(), say: `Optimum ${best}. Bounding pruned every greyed branch.`, sfx: 'found' });
  return F;
}
