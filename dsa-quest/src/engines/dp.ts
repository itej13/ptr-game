import type { Frame, Scene, SNode, Tone } from '../core/types';
import { grid, graphScene, circlePos } from '../core/layouts';

/* =====================================================================
   Models — mirror the C++ snippets exactly (including tie-breaking)
   ===================================================================== */
export function rodCut(price: number[], n: number): { r: number[]; s: number[] } {
  const r = Array(n + 1).fill(0);
  const s = Array(n + 1).fill(0);
  for (let j = 1; j <= n; j++) {
    let best = -Infinity;
    for (let i = 1; i <= j; i++)
      if (price[i] + r[j - i] > best) {
        best = price[i] + r[j - i];
        s[j] = i;
      }
    r[j] = best;
  }
  return { r, s };
}
export const rodPieces = (s: number[], n: number) => {
  const out: number[] = [];
  for (let j = n; j > 0; j -= s[j]) out.push(s[j]);
  return out;
};

export function floydWarshall(m: number[][]): number[][] {
  const d = m.map((r) => r.slice());
  const n = d.length;
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (d[i][k] < Infinity && d[k][j] < Infinity && d[i][k] + d[k][j] < d[i][j]) d[i][j] = d[i][k] + d[k][j];
  return d;
}

export function matrixChain(p: number[]): { cost: number; m: number[][]; s: number[][]; parens: string } {
  const n = p.length - 1;
  const m = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
  const s = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
  for (let len = 2; len <= n; len++)
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;
      m[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const c = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j];
        if (c < m[i][j]) {
          m[i][j] = c;
          s[i][j] = k;
        }
      }
    }
  const par = (i: number, j: number): string => (i === j ? `A${i}` : `(${par(i, s[i][j])}${par(s[i][j] + 1, j)})`);
  return { cost: n >= 1 ? m[1][n] : 0, m, s, parens: n >= 1 ? par(1, n) : '' };
}

export function lcs(X: string, Y: string): { len: number; seq: string; c: number[][] } {
  const m = X.length;
  const n = Y.length;
  const c = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) c[i][j] = X[i - 1] === Y[j - 1] ? c[i - 1][j - 1] + 1 : Math.max(c[i - 1][j], c[i][j - 1]);
  let seq = '';
  for (let i = m, j = n; i > 0 && j > 0; ) {
    if (X[i - 1] === Y[j - 1]) {
      seq = X[i - 1] + seq;
      i--;
      j--;
    } else if (c[i - 1][j] >= c[i][j - 1]) i--;
    else j--;
  }
  return { len: c[m][n], seq, c };
}

export function editDistance(a: string, b: string): { dist: number; d: number[][] } {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
  return { dist: d[m][n], d };
}

export function knapsack01(W: number, wt: number[], val: number[]): { best: number; chosen: number[]; K: number[][] } {
  const n = wt.length;
  const K = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let w = 0; w <= W; w++) {
      K[i][w] = K[i - 1][w];
      if (wt[i - 1] <= w) K[i][w] = Math.max(K[i][w], K[i - 1][w - wt[i - 1]] + val[i - 1]);
    }
  const chosen: number[] = [];
  for (let i = n, w = W; i > 0; i--)
    if (K[i][w] !== K[i - 1][w]) {
      chosen.push(i - 1);
      w -= wt[i - 1];
    }
  return { best: K[n][W], chosen, K };
}

export function tsp(d: number[][]): { cost: number; tour: number[] } {
  const n = d.length;
  if (n === 1) return { cost: 0, tour: [0, 0] };
  const FULL = 1 << n;
  const dp = Array.from({ length: FULL }, () => Array(n).fill(Infinity));
  const par = Array.from({ length: FULL }, () => Array(n).fill(-1));
  dp[1][0] = 0;
  for (let mask = 1; mask < FULL; mask++)
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u)) || dp[mask][u] === Infinity) continue;
      for (let v = 0; v < n; v++)
        if (!(mask & (1 << v)) && dp[mask][u] + d[u][v] < dp[mask | (1 << v)][v]) {
          dp[mask | (1 << v)][v] = dp[mask][u] + d[u][v];
          par[mask | (1 << v)][v] = u;
        }
    }
  let best = Infinity;
  let last = -1;
  for (let u = 1; u < n; u++)
    if (dp[FULL - 1][u] + d[u][0] < best) {
      best = dp[FULL - 1][u] + d[u][0];
      last = u;
    }
  const tour = [0];
  for (let mask = FULL - 1, u = last; u !== 0; ) {
    tour.push(u);
    const p = par[mask][u];
    mask ^= 1 << u;
    u = p;
  }
  tour.push(0);
  return { cost: best, tour: [0, ...tour.slice(1, -1).reverse(), 0] };
}

/* =====================================================================
   Frames
   ===================================================================== */
const cellTone = (hi: [number, number][], deps: [number, number][]) => (r: number, c: number): Tone | undefined =>
  hi.some(([a, b]) => a === r && b === c) ? 'active' : deps.some(([a, b]) => a === r && b === c) ? 'compare' : undefined;

export function fibFrames(n: number): Frame[] {
  // naive call tree vs memo table
  let calls = 0;
  const nodes: SNode[] = [];
  const edges: { from: string; to: string }[] = [];
  let x = 0;
  const memo = new Map<number, number>();
  const F: Frame[] = [];
  const build = (k: number, depth: number, id: string): number => {
    calls++;
    if (k <= 1) {
      nodes.push({ id, x: 30 + x++ * 34, y: 40 + depth * 52, w: 30, label: `F${k}`, fontSize: 10, tone: 'done' });
      return nodes[nodes.length - 1].x;
    }
    const a = build(k - 1, depth + 1, id + 'L');
    const b = build(k - 2, depth + 1, id + 'R');
    const cx = (a + b) / 2;
    nodes.push({ id, x: cx, y: 40 + depth * 52, w: 30, label: `F${k}`, fontSize: 10, tone: k < n && memo.has(k) ? 'warn' : 'base' });
    memo.set(k, 1);
    edges.push({ from: id, to: id + 'L' }, { from: id, to: id + 'R' });
    return cx;
  };
  build(n, 0, 'f');
  const W = 60 + x * 34;
  const H = 60 + n * 52;
  F.push({ scene: { w: W, h: H, nodes, edges }, say: `Naive recursive fib(${n}) makes ${calls} calls. Red nodes are subproblems already computed elsewhere in the tree — overlapping subproblems.` });
  const table: (number | null)[] = Array(n + 1).fill(null);
  const memoScene = (hi: number): Scene => {
    const g = grid([table.map((v) => (v === null ? null : v))], { x: 60, y: 60, cw: 46, colHead: [...Array(n + 1).keys()].map((i) => `F${i}`), key: 'memo', tone: (_, c) => (c === hi ? 'active' : table[c] === null ? 'ghost' : 'done') });
    return { w: g.w + 20, h: 140, nodes: g.nodes };
  };
  table[0] = 0;
  table[1] = 1;
  F.push({ scene: memoScene(1), say: 'Bottom-up DP: fill a table from the smallest subproblems. F0 = 0, F1 = 1.' });
  for (let i = 2; i <= n; i++) {
    table[i] = table[i - 1]! + table[i - 2]!;
    F.push({ scene: memoScene(i), say: `F${i} = F${i - 1} + F${i - 2} = ${table[i]}. Each subproblem is solved once.`, sfx: 'tick' });
  }
  F.push({ scene: memoScene(n), say: `${n - 1} additions instead of ${calls} calls: exponential → linear. That trade (memory for time) is dynamic programming.`, sfx: 'found' });
  return F;
}

export function rodFrames(price: number[], n: number): Frame[] {
  const r: (number | null)[] = Array(n + 1).fill(null);
  const s: (number | null)[] = Array(n + 1).fill(null);
  r[0] = 0;
  const F: Frame[] = [];
  const sc = (j: number, i: number | null): Scene => {
    const g = grid([price.map((v, k) => (k === 0 ? 0 : v)), r, s], { x: 90, y: 50, cw: 44, colHead: [...Array(n + 1).keys()], rowHead: ['price', 'r[j]', 's[j]'], key: 'rod', tone: (row, c) => (row === 1 && c === j ? 'active' : i !== null && ((row === 0 && c === i) || (row === 1 && c === j - i)) ? 'compare' : row > 0 && r[c] === null ? 'ghost' : undefined) });
    return { w: g.w + 20, h: 200, nodes: g.nodes };
  };
  F.push({ scene: sc(0, null), line: 'init', say: 'r[0] = 0. For each length j, try every first piece i and add the best revenue for the rest: r[j] = max over i of (price[i] + r[j − i]).' });
  for (let j = 1; j <= n; j++) {
    let best = -Infinity;
    for (let i = 1; i <= j; i++) {
      const v = price[i] + (r[j - i] as number);
      const better = v > best;
      if (better) {
        best = v;
        s[j] = i;
      }
      F.push({ scene: sc(j, i), line: 'cmp', say: `j = ${j}, first piece ${i}: price[${i}] + r[${j - i}] = ${price[i]} + ${r[j - i]} = ${v}${better ? ' — best so far' : ''}.`, sfx: 'tick' });
    }
    r[j] = best;
    F.push({ scene: sc(j, null), line: 'store', say: `r[${j}] = ${best} (first piece ${s[j]}).`, sfx: 'pop' });
  }
  const pieces = rodPieces(s as number[], n);
  F.push({ scene: sc(n, null), say: `Best revenue for length ${n}: ${r[n]}, cutting into ${pieces.join(' + ')}. Θ(n²) instead of trying all 2ⁿ⁻¹ cut patterns.`, sfx: 'found' });
  return F;
}

export function fwFrames(m: number[][]): Frame[] {
  const n = m.length;
  const d = m.map((r) => r.slice());
  const F: Frame[] = [];
  const show = (v: number) => (v === Infinity ? '∞' : v);
  const sc = (k: number | null, fresh: Set<string>): Scene => {
    const pos = circlePos(n, 160, 170, 120);
    const edges: { u: number; v: number; w: number }[] = [];
    m.forEach((row, i) => row.forEach((w, j) => i !== j && w < Infinity && edges.push({ u: i, v: j, w })));
    const gs = graphScene({ n, pos, edges, directed: true }, { w: 330, h: 330, nodeTone: (v) => (v === k ? 'active' : undefined) });
    const g = grid(d.map((r) => r.map(show)), { x: 380, y: 60, cw: 40, rowHead: [...Array(n).keys()], colHead: [...Array(n).keys()], key: 'D', tone: (i, j) => (fresh.has(`${i},${j}`) ? 'active' : k !== null && (i === k || j === k) ? 'compare' : undefined) });
    return { w: g.w + 20, h: Math.max(340, g.h), nodes: [...gs.nodes, ...g.nodes], edges: gs.edges };
  };
  F.push({ scene: sc(null, new Set()), say: 'D⁽⁻¹⁾ = weight matrix (∞ = no edge). Phase k allows vertex k as an intermediate: D[i][j] = min(D[i][j], D[i][k] + D[k][j]).' });
  for (let k = 0; k < n; k++) {
    const fresh = new Set<string>();
    const notes: string[] = [];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (d[i][k] < Infinity && d[k][j] < Infinity && d[i][k] + d[k][j] < d[i][j]) {
          notes.push(`${i}→${j}: ${show(d[i][j])} → ${d[i][k] + d[k][j]}`);
          d[i][j] = d[i][k] + d[k][j];
          fresh.add(`${i},${j}`);
        }
    F.push({ scene: sc(k, fresh), line: 'update', say: notes.length ? `k = ${k}: ${notes.join('; ')}.` : `k = ${k}: no path improves via ${k}.`, sfx: notes.length ? 'push' : 'tick' });
  }
  F.push({ scene: sc(null, new Set()), say: 'Final matrix: all-pairs shortest distances. Θ(n³) time, Θ(n²) space (updated in place).', sfx: 'found' });
  return F;
}

export function mcmFrames(p: number[]): Frame[] {
  const n = p.length - 1;
  const m: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (__, j) => (i >= 1 && j === i ? 0 : null)));
  const s: (number | null)[][] = Array.from({ length: n + 1 }, () => Array(n + 1).fill(null));
  const F: Frame[] = [];
  const sc = (ci: number | null, cj: number | null, k: number | null): Scene => {
    const mm = m.slice(1).map((r) => r.slice(1).map((v) => v));
    const ss = s.slice(1).map((r) => r.slice(1));
    const g1 = grid(mm, { x: 60, y: 60, cw: 56, rowHead: [...Array(n).keys()].map((i) => i + 1), colHead: [...Array(n).keys()].map((i) => i + 1), key: 'm', tone: (r, c) => (r + 1 === ci && c + 1 === cj ? 'active' : k !== null && ci !== null && cj !== null && ((r + 1 === ci && c + 1 === k) || (r + 1 === k + 1 && c + 1 === cj)) ? 'compare' : c < r ? 'ghost' : undefined) });
    const g2 = grid(ss, { x: g1.w + 60, y: 60, cw: 36, rowHead: [...Array(n).keys()].map((i) => i + 1), colHead: [...Array(n).keys()].map((i) => i + 1), key: 's', tone: (r, c) => (c <= r ? 'ghost' : undefined) });
    return { w: g1.w + g2.w + 80, h: Math.max(g1.h, g2.h) + 30, nodes: [...g1.nodes, ...g2.nodes, { id: 'tm', x: 60, y: 24, shape: 'text', label: 'm[i][j]', anchor: 'start', tone: 'muted', fontSize: 12 }, { id: 'ts', x: g1.w + 60, y: 24, shape: 'text', label: 's[i][j]', anchor: 'start', tone: 'muted', fontSize: 12 }] };
  };
  F.push({ scene: sc(null, null, null), say: `Matrices: ${[...Array(n).keys()].map((i) => `A${i + 1} ${p[i]}×${p[i + 1]}`).join(', ')}. m[i][i] = 0; fill by chain length.` });
  for (let len = 2; len <= n; len++)
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;
      let best = Infinity;
      const tries: string[] = [];
      for (let k = i; k < j; k++) {
        const c = (m[i][k] as number) + (m[k + 1][j] as number) + p[i - 1] * p[k] * p[j];
        tries.push(`k=${k}: ${m[i][k]}+${m[k + 1][j]}+${p[i - 1]}·${p[k]}·${p[j]} = ${c}`);
        if (c < best) {
          best = c;
          s[i][j] = k;
        }
      }
      m[i][j] = best;
      F.push({ scene: sc(i, j, s[i][j]), line: 'best', say: `m[${i}][${j}] = min(${tries.join('; ')}) = ${best}, split after A${s[i][j]}.`, sfx: 'tick' });
    }
  const r = matrixChain(p);
  F.push({ scene: sc(null, null, null), say: `Minimum ${r.cost} scalar multiplications with ${r.parens}. Θ(n³) time, Θ(n²) space.`, sfx: 'found' });
  return F;
}

export function lcsFrames(X: string, Y: string): Frame[] {
  const m = X.length;
  const n = Y.length;
  const c: (number | null)[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (__, j) => (i === 0 || j === 0 ? 0 : null)));
  const F: Frame[] = [];
  const path = new Set<string>();
  const sc = (ci: number | null, cj: number | null, deps: [number, number][] = []): Scene => {
    const g = grid(c, { x: 70, y: 60, cw: 36, rowHead: ['', ...X], colHead: ['', ...Y], key: 'c', tone: (r, col) => (r === ci && col === cj ? 'active' : deps.some(([a, b]) => a === r && b === col) ? 'compare' : path.has(`${r},${col}`) ? 'done' : undefined) });
    return { w: g.w + 20, h: g.h + 10, nodes: g.nodes };
  };
  F.push({ scene: sc(null, null), say: `X = ${X}, Y = ${Y}. Row 0 and column 0 are 0 (LCS with an empty string).` });
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const match = X[i - 1] === Y[j - 1];
      c[i][j] = match ? (c[i - 1][j - 1] as number) + 1 : Math.max(c[i - 1][j] as number, c[i][j - 1] as number);
      F.push({ scene: sc(i, j, match ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1]]), line: match ? 'diag' : 'max', say: match ? `X[${i}] = Y[${j}] = '${X[i - 1]}': c = diagonal + 1 = ${c[i][j]}.` : `'${X[i - 1]}' ≠ '${Y[j - 1]}': c = max(up ${c[i - 1][j]}, left ${c[i][j - 1]}) = ${c[i][j]}.`, sfx: match ? 'found' : 'tick' });
    }
  let seq = '';
  for (let i = m, j = n; i > 0 && j > 0; ) {
    path.add(`${i},${j}`);
    if (X[i - 1] === Y[j - 1]) {
      seq = X[i - 1] + seq;
      i--;
      j--;
    } else if ((c[i - 1][j] as number) >= (c[i][j - 1] as number)) i--;
    else j--;
  }
  F.push({ scene: sc(null, null), line: 'trace', say: `Trace back from c[${m}][${n}] = ${c[m][n]} (diagonal on a match; otherwise up if up ≥ left, else left). LCS = "${seq}".`, sfx: 'found' });
  return F;
}

export function editFrames(a: string, b: string): Frame[] {
  const m = a.length;
  const n = b.length;
  const d: (number | null)[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : null)));
  const F: Frame[] = [];
  const sc = (ci: number | null, cj: number | null, deps: [number, number][] = []): Scene => {
    const g = grid(d, { x: 70, y: 60, cw: 36, rowHead: ['', ...a], colHead: ['', ...b], key: 'd', tone: cellTone(ci === null ? [] : [[ci, cj!]], deps) });
    return { w: g.w + 20, h: g.h + 10, nodes: g.nodes };
  };
  F.push({ scene: sc(null, null), line: 'col0', say: `Turn "${a}" into "${b}". d[i][0] = i (delete everything), d[0][j] = j (insert everything).` });
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const same = a[i - 1] === b[j - 1];
      const del = d[i - 1][j] as number;
      const ins = d[i][j - 1] as number;
      const sub = d[i - 1][j - 1] as number;
      d[i][j] = same ? sub : 1 + Math.min(del, ins, sub);
      F.push({ scene: sc(i, j, same ? [[i - 1, j - 1]] : [[i - 1, j], [i, j - 1], [i - 1, j - 1]]), line: same ? 'same' : 'ops', say: same ? `'${a[i - 1]}' = '${b[j - 1]}': no operation, copy the diagonal ${sub}.` : `'${a[i - 1]}' ≠ '${b[j - 1]}': 1 + min(delete ${del}, insert ${ins}, substitute ${sub}) = ${d[i][j]}.`, sfx: 'tick' });
    }
  F.push({ scene: sc(m, n), say: `Edit distance = ${d[m][n]}.`, sfx: 'found' });
  return F;
}

export function knapFrames(W: number, wt: number[], val: number[]): Frame[] {
  const n = wt.length;
  const K: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: W + 1 }, () => (i === 0 ? 0 : null)));
  const F: Frame[] = [];
  const chosen = new Set<string>();
  const sc = (ci: number | null, cj: number | null, deps: [number, number][] = []): Scene => {
    const g = grid(K, { x: 130, y: 60, cw: Math.max(30, Math.min(40, 560 / (W + 1))), rowHead: ['∅', ...wt.map((w, i) => `#${i + 1} w${w} v${val[i]}`)], colHead: [...Array(W + 1).keys()], key: 'K', tone: (r, c) => (r === ci && c === cj ? 'active' : deps.some(([a, b]) => a === r && b === c) ? 'compare' : chosen.has(`${r},${c}`) ? 'done' : undefined) });
    return { w: g.w + 20, h: g.h + 10, nodes: g.nodes };
  };
  F.push({ scene: sc(null, null), say: `Capacity ${W}. Row i considers items 1…i. K[0][w] = 0.` });
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      const skip = K[i - 1][w] as number;
      const can = wt[i - 1] <= w;
      const take = can ? (K[i - 1][w - wt[i - 1]] as number) + val[i - 1] : -Infinity;
      K[i][w] = Math.max(skip, take);
      if (w === W || (can && take > skip))
        F.push({ scene: sc(i, w, can ? [[i - 1, w], [i - 1, w - wt[i - 1]]] : [[i - 1, w]]), line: can ? 'take' : 'skip', say: can ? `K[${i}][${w}] = max(skip ${skip}, take ${K[i - 1][w - wt[i - 1]]} + ${val[i - 1]} = ${take}) = ${K[i][w]}.` : `Item ${i} (w ${wt[i - 1]}) doesn't fit in ${w}: K[${i}][${w}] = ${skip}.`, sfx: 'tick' });
    }
    F.push({ scene: sc(i, W), say: `Row ${i} done.` });
  }
  const r = knapsack01(W, wt, val);
  for (let i = n, w = W; i > 0; i--) {
    chosen.add(`${i},${w}`);
    if (r.K[i][w] !== r.K[i - 1][w]) w -= wt[i - 1];
  }
  F.push({ scene: sc(null, null), line: 'trace', say: `Best value ${r.best}. Trace back: where K[i][w] ≠ K[i−1][w], item i was taken → items ${r.chosen.map((x) => `#${x + 1}`).reverse().join(', ') || 'none'}. Θ(nW).`, sfx: 'found' });
  return F;
}

export function tspFrames(d: number[][]): Frame[] {
  const n = d.length;
  const FULL = 1 << n;
  const dp = Array.from({ length: FULL }, () => Array(n).fill(Infinity));
  dp[1][0] = 0;
  const masks = [...Array(FULL).keys()].filter((m) => m & 1).sort((a, b) => popcount(a) - popcount(b) || a - b);
  const setName = (m: number) => `{${[...Array(n).keys()].filter((i) => m & (1 << i)).join(',')}}`;
  const F: Frame[] = [];
  const sc = (hiMask: number | null): Scene => {
    const cells = masks.map((mk) => [...Array(n).keys()].map((u) => (dp[mk][u] === Infinity ? null : dp[mk][u])));
    const g = grid(cells, { x: 110, y: 60, cw: 46, ch: 26, rowHead: masks.map(setName), colHead: [...Array(n).keys()].map((u) => `end ${u}`), key: 'T', tone: (r) => (masks[r] === hiMask ? 'active' : undefined) });
    const pos = circlePos(n, 0, 0, 90).map(([x, y]) => [x + g.w + 140, y + 150] as [number, number]);
    const edges: { u: number; v: number; w: number }[] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push({ u: i, v: j, w: d[i][j] });
    const gs = graphScene({ n, pos, edges }, { w: g.w + 280, h: Math.max(g.h, 280) });
    return { w: g.w + 280, h: Math.max(g.h + 10, 280), nodes: [...g.nodes, ...gs.nodes], edges: gs.edges };
  };
  F.push({ scene: sc(1), line: 'start', say: 'dp[S][u] = cheapest path from 0 through exactly the cities in S, ending at u. Start: dp[{0}][0] = 0.' });
  let lastSize = 1;
  for (const mask of masks) {
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u)) || dp[mask][u] === Infinity) continue;
      for (let v = 0; v < n; v++) if (!(mask & (1 << v)) && dp[mask][u] + d[u][v] < dp[mask | (1 << v)][v]) dp[mask | (1 << v)][v] = dp[mask][u] + d[u][v];
    }
    if (popcount(mask) !== lastSize || mask === masks[masks.length - 1]) {
      lastSize = popcount(mask);
    }
    F.push({ scene: sc(mask), line: 'extend', say: `Extend every path in S = ${setName(mask)} by one unvisited city.`, sfx: 'tick' });
  }
  const r = tsp(d);
  F.push({ scene: sc(FULL - 1), line: 'close', say: `Close the tour back to 0: best = min over u of dp[all][u] + d[u][0] = ${r.cost}. Tour ${r.tour.join(' → ')}. Θ(n²2ⁿ) — exponential, but far better than (n−1)! permutations.`, sfx: 'found' });
  return F;
}
const popcount = (x: number) => {
  let c = 0;
  while (x) {
    c += x & 1;
    x >>= 1;
  }
  return c;
};
