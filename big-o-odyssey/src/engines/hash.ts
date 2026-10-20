import type { Frame, Scene, SNode, SEdge, Tone } from '../core/types';

/* =====================================================================
   Hash functions (Level 32)
   ===================================================================== */
export const hDivision = (k: number, m: number) => ((k % m) + m) % m;

/** Mid-square on 4-digit keys: square, left-pad to 8 digits, take the 4th and 5th digits (Lipschutz's convention). */
export function hMidSquare(k: number): { sq: string; addr: number } {
  const sq = String(k * k).padStart(8, '0');
  return { sq, addr: Number(sq.slice(3, 5)) };
}

/** Split the decimal key into parts of `size` digits from the left. */
export function foldParts(key: string, size: number): string[] {
  const parts: string[] = [];
  for (let i = 0; i < key.length; i += size) parts.push(key.slice(i, i + size));
  return parts;
}
export const foldShift = (key: string, size: number) => foldParts(key, size).reduce((s, p) => s + Number(p), 0);
export const foldBoundary = (key: string, size: number) => foldParts(key, size).reduce((s, p, i) => s + Number(i % 2 === 1 ? [...p].reverse().join('') : p), 0);

/** Multiplication method with A given to 6 decimals (exact integer arithmetic). */
export function hMultiplication(k: number, m: number, A6 = 618034): number {
  const frac = (k * A6) % 1_000_000; // k·A = integer part + frac/1e6
  return Math.floor((m * frac) / 1_000_000);
}

/* =====================================================================
   Collision resolution (Level 33)
   ===================================================================== */
export type Scheme = 'linear' | 'quadratic' | 'double';
export function probeAt(scheme: Scheme, k: number, i: number, m: number, R = 7): number {
  const h = hDivision(k, m);
  if (scheme === 'linear') return (h + i) % m;
  if (scheme === 'quadratic') return (h + i * i) % m;
  const h2 = R - (k % R);
  return (h + i * h2) % m;
}

export interface OAResult {
  table: (number | null)[];
  probes: number[][]; // slots examined per key, in order
  placed: boolean[];
}
export function openAddress(keys: number[], m: number, scheme: Scheme, R = 7): OAResult {
  const table: (number | null)[] = Array(m).fill(null);
  const probes: number[][] = [];
  const placed: boolean[] = [];
  for (const k of keys) {
    const seen: number[] = [];
    let ok = false;
    for (let i = 0; i < m; i++) {
      const j = probeAt(scheme, k, i, m, R);
      seen.push(j);
      if (table[j] === null || table[j] === k) {
        table[j] = k;
        ok = true;
        break;
      }
    }
    probes.push(seen);
    placed.push(ok);
  }
  return { table, probes, placed };
}
export function probeSearch(table: (number | null)[], k: number, scheme: Scheme, R = 7): { slot: number; probes: number } {
  const m = table.length;
  for (let i = 0; i < m; i++) {
    const j = probeAt(scheme, k, i, m, R);
    if (table[j] === null) return { slot: -1, probes: i + 1 };
    if (table[j] === k) return { slot: j, probes: i + 1 };
  }
  return { slot: -1, probes: m };
}

/** Separate chaining with insertion at the front of each chain. */
export function chain(keys: number[], b: number): number[][] {
  const buckets: number[][] = Array.from({ length: b }, () => []);
  for (const k of keys) buckets[hDivision(k, b)].unshift(k);
  return buckets;
}

/* ---------------- frames ---------------- */
function tableScene(table: ({ id: string; v: number } | null)[], tone: (i: number) => Tone | undefined, extra: SNode[] = [], edges: SEdge[] = []): Scene {
  const m = table.length;
  const nodes: SNode[] = [];
  table.forEach((c, i) => {
    nodes.push({ id: `ix${i}`, x: 40 + i * 52, y: 40, shape: 'text', label: i, tone: 'muted', fontSize: 11 });
    if (c) nodes.push({ id: c.id, x: 40 + i * 52, y: 80, w: 48, h: 40, shape: 'rect', label: c.v, tone: tone(i) ?? 'base' });
    else nodes.push({ id: `slot${i}`, x: 40 + i * 52, y: 80, w: 48, h: 40, shape: 'rect', tone: tone(i) ?? 'ghost' });
  });
  return { w: Math.max(420, 60 + m * 52), h: 190, nodes: [...nodes, ...extra], edges };
}

export function openAddressFrames(keys: number[], m: number, scheme: Scheme, R = 7, predict = false): Frame[] {
  const table: ({ id: string; v: number } | null)[] = Array(m).fill(null);
  const F: Frame[] = [];
  const formula = scheme === 'linear' ? '(h + i) mod M' : scheme === 'quadratic' ? '(h + i²) mod M' : `(h + i·h₂) mod M, h₂(k) = ${R} − (k mod ${R})`;
  F.push({ scene: tableScene(table, () => undefined), say: `M = ${m}, h(k) = k mod ${m}. Probe sequence for attempt i = 0, 1, 2, …: ${formula}.` });
  keys.forEach((k, n) => {
    const h = hDivision(k, m);
    const card = (j: number): SNode => ({ id: `new${n}`, x: 40 + j * 52, y: 150, w: 48, h: 34, shape: 'rect', label: k, tone: 'active', sub: 'inserting', subPos: 'right' });
    for (let i = 0; i < m; i++) {
      const j = probeAt(scheme, k, i, m, R);
      const free = table[j] === null || table[j]!.v === k;
      const sayProbe = i === 0 ? `insert ${k}: h(${k}) = ${k} mod ${m} = ${h}.` : `i = ${i}: probe ${scheme === 'linear' ? `(${h} + ${i}) mod ${m}` : scheme === 'quadratic' ? `(${h} + ${i * i}) mod ${m}` : `(${h} + ${i}·${R - (k % R)}) mod ${m}`} = ${j}.`;
      F.push({
        scene: tableScene(table, (x) => (x === j ? (free ? 'compare' : 'warn') : undefined), [card(j)]),
        line: i === 0 ? 'ins-hash' : 'ins-probe',
        say: `${sayProbe} Slot ${j} is ${table[j] === null ? 'empty' : free ? `already ${k}` : `taken by ${table[j]!.v} — collision`}.`,
        sfx: free ? 'compare' : 'wrong',
        vars: { key: k, h, i, slot: j },
        ask: predict && i === 0 ? { prompt: `Where will ${k} finally be stored?`, options: [...new Set([openAddress([...keys.slice(0, n + 1)], m, scheme, R).probes[n].at(-1)!, h, (h + 1) % m, (h + 2) % m])].map(String), answer: 0, hint: 'Follow the probe sequence until an empty slot.' } : undefined,
      });
      if (free) {
        table[j] = { id: `k${n}`, v: k };
        F.push({ scene: tableScene(table, (x) => (x === j ? 'done' : undefined)), line: 'ins-store', say: `Stored ${k} in slot ${j} after ${i + 1} probe(s).`, sfx: 'push' });
        return;
      }
    }
    F.push({ scene: tableScene(table, () => 'warn'), line: 'ins-full', say: `No free slot reached for ${k} after ${m} probes — insertion fails${scheme === 'quadratic' ? ' (quadratic probing may miss free slots)' : ''}.`, sfx: 'wrong' });
  });
  const used = table.filter(Boolean).length;
  F.push({ scene: tableScene(table, () => undefined), say: `Load factor α = n/M = ${used}/${m} = ${(used / m).toFixed(2)}.`, sfx: 'found' });
  return F;
}

export function chainFrames(keys: number[], b: number): Frame[] {
  const buckets: { id: string; v: number }[][] = Array.from({ length: b }, () => []);
  const F: Frame[] = [];
  const sc = (hiB: number | null, hiK?: string): Scene => {
    const nodes: SNode[] = [];
    const edges: SEdge[] = [];
    let maxLen = 0;
    buckets.forEach((ch, i) => {
      const y = 30 + i * 40;
      nodes.push({ id: `b${i}`, x: 50, y, w: 44, h: 32, shape: 'rect', label: i, tone: i === hiB ? 'compare' : 'accent' });
      ch.forEach((it, j) => {
        nodes.push({ id: it.id, x: 130 + j * 70, y, w: 50, h: 30, shape: 'rect', label: it.v, tone: it.id === hiK ? 'active' : 'base' });
        edges.push({ from: j === 0 ? `b${i}` : ch[j - 1].id, to: it.id, directed: true });
      });
      maxLen = Math.max(maxLen, ch.length);
    });
    return { w: Math.max(420, 170 + maxLen * 70), h: 40 + b * 40, nodes, edges };
  };
  F.push({ scene: sc(null), say: `${b} buckets, h(k) = k mod ${b}. Each bucket heads a linked list.` });
  keys.forEach((k, n) => {
    const h = hDivision(k, b);
    const it = { id: `c${n}`, v: k };
    buckets[h].unshift(it);
    F.push({ scene: sc(h, it.id), line: 'ins-front', say: `insert ${k}: h = ${k} mod ${b} = ${h}; new node goes to the front of chain ${h}${buckets[h].length > 1 ? ' (collision handled by chaining)' : ''}.`, sfx: 'push' });
  });
  const longest = Math.max(...buckets.map((c) => c.length));
  F.push({ scene: sc(null), say: `α = n/B = ${keys.length}/${b} = ${(keys.length / b).toFixed(2)} (may exceed 1 with chaining). Longest chain: ${longest}.`, sfx: 'found' });
  return F;
}
