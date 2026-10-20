import type { Frame, Scene, SNode, SEdge, Tone } from '../core/types';
import { treeScene, type BNode } from '../core/layouts';

/* =====================================================================
   Fractional knapsack (Level 47)
   ===================================================================== */
export interface KItem {
  value: number;
  weight: number;
  name?: string;
}
export function fractionalKnapsack(W: number, items: KItem[]): { total: number; taken: { item: KItem; fraction: number }[] } {
  const sorted = [...items].sort((a, b) => b.value * a.weight - a.value * b.weight);
  let total = 0;
  const taken: { item: KItem; fraction: number }[] = [];
  for (const it of sorted) {
    if (W === 0) break;
    if (it.weight <= W) {
      total += it.value;
      W -= it.weight;
      taken.push({ item: it, fraction: 1 });
    } else {
      total += (it.value * W) / it.weight;
      taken.push({ item: it, fraction: W / it.weight });
      W = 0;
    }
  }
  return { total, taken };
}

export function knapsackFrames(W: number, items: KItem[]): Frame[] {
  const named = items.map((it, i) => ({ ...it, name: it.name ?? `I${i + 1}` }));
  const sorted = [...named].sort((a, b) => b.value * a.weight - a.value * b.weight);
  const F: Frame[] = [];
  let cap = W;
  let total = 0;
  const fill: { name: string; w: number; frac: number }[] = [];
  const sc = (cur: number | null): Scene => {
    const nodes: SNode[] = [];
    sorted.forEach((it, i) => {
      const t = fill.find((f) => f.name === it.name);
      nodes.push({ id: `it${it.name}`, x: 70, y: 40 + i * 40, w: 110, h: 32, shape: 'rect', label: `${it.name}: v${it.value} w${it.weight}`, fontSize: 12, tone: i === cur ? 'active' : t ? 'done' : 'base' });
      nodes.push({ id: `ra${it.name}`, x: 140, y: 40 + i * 40, shape: 'text', label: `v/w = ${(it.value / it.weight).toFixed(2)}${t && t.frac < 1 ? `  (took ${(t.frac * 100).toFixed(0)}%)` : ''}`, anchor: 'start', tone: 'muted', fontSize: 12 });
    });
    // knapsack bar
    const barX = 380;
    const barH = 260;
    nodes.push({ id: 'sack', x: barX, y: 40 + barH / 2, w: 60, h: barH, shape: 'rect', tone: 'ghost' });
    let y = 40 + barH;
    fill.forEach((f) => {
      const h = (f.w / W) * barH;
      nodes.push({ id: `bar${f.name}`, x: barX, y: y - h / 2, w: 56, h: Math.max(4, h - 2), shape: 'rect', label: f.name, tone: f.frac < 1 ? 'compare' : 'done', fontSize: 11 });
      y -= h;
    });
    nodes.push({ id: 'caplbl', x: barX + 40, y: 40, shape: 'text', label: `capacity ${W}, left ${+cap.toFixed(3)}`, anchor: 'start', tone: 'accent', fontSize: 12 });
    nodes.push({ id: 'val', x: barX + 40, y: 66, shape: 'text', label: `value ${+total.toFixed(3)}`, anchor: 'start', tone: 'accent', fontSize: 12 });
    return { w: 600, h: Math.max(60 + sorted.length * 40, 330), nodes };
  };
  F.push({ scene: sc(null), line: 'sort', say: `Sort by value/weight, highest first: ${sorted.map((s) => s.name).join(', ')}.` });
  for (let i = 0; i < sorted.length; i++) {
    const it = sorted[i];
    if (cap === 0) {
      F.push({ scene: sc(null), line: 'full', say: 'Knapsack full — stop.' });
      break;
    }
    if (it.weight <= cap) {
      cap -= it.weight;
      total += it.value;
      fill.push({ name: it.name, w: it.weight, frac: 1 });
      F.push({ scene: sc(i), line: 'whole', say: `${it.name} (w ${it.weight}) fits: take all of it. Value +${it.value}.`, sfx: 'push' });
    } else {
      const frac = cap / it.weight;
      total += (it.value * cap) / it.weight;
      fill.push({ name: it.name, w: cap, frac });
      F.push({ scene: sc(i), line: 'part', say: `${it.name} doesn't fit: take ${cap}/${it.weight} of it, value +${+((it.value * cap) / it.weight).toFixed(3)}.`, sfx: 'swap' });
      cap = 0;
    }
  }
  F.push({ scene: sc(null), say: `Maximum value ${+total.toFixed(4)}. O(n log n) for the sort.`, sfx: 'found' });
  return F;
}

/* =====================================================================
   Activity selection & job sequencing (Level 48)
   ===================================================================== */
export function selectActivities(s: number[], f: number[]): number[] {
  const idx = s.map((_, i) => i).sort((a, b) => f[a] - f[b]);
  const chosen: number[] = [];
  let last = -Infinity;
  for (const i of idx)
    if (s[i] >= last) {
      chosen.push(i);
      last = f[i];
    }
  return chosen;
}
export function jobSequencing(d: number[], p: number[]): { total: number; slot: number[] } {
  const idx = d.map((_, i) => i).sort((a, b) => p[b] - p[a]);
  const maxD = Math.max(...d);
  const slot = Array(maxD + 1).fill(-1);
  let total = 0;
  for (const j of idx)
    for (let t = d[j]; t >= 1; t--)
      if (slot[t] === -1) {
        slot[t] = j;
        total += p[j];
        break;
      }
  return { total, slot };
}

export function activityFrames(s: number[], f: number[], predict = false): Frame[] {
  const n = s.length;
  const idx = s.map((_, i) => i).sort((a, b) => f[a] - f[b]);
  const T = Math.max(...f, 1);
  const unit = Math.min(36, 560 / T);
  const chosen = new Set<number>();
  const rejected = new Set<number>();
  const F: Frame[] = [];
  let last = -Infinity;
  const sc = (cur: number | null): Scene => {
    const nodes: SNode[] = [];
    idx.forEach((i, row) => {
      const x0 = 60 + s[i] * unit;
      const w = Math.max(6, (f[i] - s[i]) * unit);
      nodes.push({ id: `a${i}`, x: x0 + w / 2, y: 40 + row * 34, w, h: 26, shape: 'rect', label: `a${i}`, fontSize: 11, tone: i === cur ? 'active' : chosen.has(i) ? 'done' : rejected.has(i) ? 'muted' : 'base' });
      nodes.push({ id: `t${i}`, x: 20, y: 40 + row * 34, shape: 'text', label: `${s[i]}–${f[i]}`, anchor: 'start', tone: 'muted', fontSize: 10 });
    });
    for (let t = 0; t <= T; t++) nodes.push({ id: `tick${t}`, x: 60 + t * unit, y: 52 + n * 34, shape: 'text', label: t, tone: 'muted', fontSize: 10 });
    if (last > -Infinity) nodes.push({ id: 'last', x: 60 + last * unit, y: 22, w: 64, h: 18, shape: 'tag', label: `free @${last}`, tone: 'accent' });
    return { w: Math.max(420, 100 + T * unit), h: 80 + n * 34, nodes };
  };
  F.push({ scene: sc(null), line: 'sort', say: 'Activities sorted by finish time (rows). Greedy choice: the activity that finishes first leaves the most room for the rest.' });
  for (const i of idx) {
    const ok = s[i] >= last;
    const ask = predict ? { prompt: `a${i} runs ${s[i]}–${f[i]}; the resource is free from ${last === -Infinity ? 'the start' : last}. Take it?`, options: ok ? ['Take it', 'Skip it'] : ['Skip it', 'Take it'], answer: 0, hint: 'Take it iff it starts no earlier than the last chosen activity finishes.' } : undefined;
    if (ok) {
      chosen.add(i);
      last = f[i];
    } else rejected.add(i);
    F.push({ scene: sc(i), line: ok ? 'take' : 'check', say: ok ? `a${i} (${s[i]}–${f[i]}) starts at ${s[i]} ≥ last finish: select it.` : `a${i} (${s[i]}–${f[i]}) overlaps the last selected activity: skip.`, sfx: ok ? 'push' : 'wrong', ask });
  }
  F.push({ scene: sc(null), say: `Selected ${chosen.size} activities: ${[...chosen].map((i) => `a${i}`).join(', ')} — the maximum possible. O(n log n).`, sfx: 'found' });
  return F;
}

export function jobFrames(d: number[], p: number[], predict = false): Frame[] {
  const n = d.length;
  const idx = d.map((_, i) => i).sort((a, b) => p[b] - p[a]);
  const maxD = Math.max(...d);
  const slot = Array(maxD + 1).fill(-1);
  const F: Frame[] = [];
  const skipped = new Set<number>();
  const sc = (cur: number | null, at?: number): Scene => {
    const nodes: SNode[] = [];
    idx.forEach((j, r) => nodes.push({ id: `j${j}`, x: 70, y: 40 + r * 34, w: 120, h: 28, shape: 'rect', label: `J${j + 1}: d${d[j]} p${p[j]}`, fontSize: 12, tone: j === cur ? 'active' : slot.includes(j) ? 'done' : skipped.has(j) ? 'muted' : 'base' }));
    for (let t = 1; t <= maxD; t++) {
      nodes.push({ id: `sl${t}`, x: 220 + t * 64, y: 60, w: 60, h: 40, shape: 'rect', label: slot[t] >= 0 ? `J${slot[t] + 1}` : '', tone: t === at ? 'compare' : slot[t] >= 0 ? 'done' : 'ghost' });
      nodes.push({ id: `tl${t}`, x: 220 + t * 64 - 30, y: 98, shape: 'text', label: t - 1, tone: 'muted', fontSize: 10 });
    }
    nodes.push({ id: `tl${maxD + 1}`, x: 220 + maxD * 64 + 30, y: 98, shape: 'text', label: maxD, tone: 'muted', fontSize: 10 });
    nodes.push({ id: 'gl', x: 254, y: 24, shape: 'text', label: 'Gantt chart (time slots)', anchor: 'start', tone: 'muted', fontSize: 11 });
    return { w: Math.max(420, 280 + maxD * 64), h: Math.max(140, 60 + n * 34), nodes };
  };
  F.push({ scene: sc(null), line: 'sort', say: `Jobs in decreasing profit. Gantt chart has max deadline = ${maxD} unit slots (your deck's Step-02).` });
  for (const j of idx) {
    let placed = -1;
    for (let t = d[j]; t >= 1; t--)
      if (slot[t] === -1) {
        placed = t;
        break;
      }
    const ask = predict ? { prompt: `J${j + 1} (deadline ${d[j]}, profit ${p[j]}): which slot does it get?`, options: [placed === -1 ? 'none — rejected' : `slot ${placed - 1}–${placed}`, ...[...Array(maxD).keys()].map((t) => `slot ${t}–${t + 1}`).filter((x) => x !== `slot ${placed - 1}–${placed}`), 'none — rejected'].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4), answer: 0, hint: 'The latest free slot at or before its deadline.' } : undefined;
    if (placed === -1) {
      skipped.add(j);
      F.push({ scene: sc(j), line: 'scan', say: `J${j + 1}: no free slot at or before deadline ${d[j]} — reject.`, sfx: 'wrong', ask });
    } else {
      slot[placed] = j;
      F.push({ scene: sc(j, placed), line: 'place', say: `J${j + 1}: latest free slot ≤ ${d[j]} is ${placed - 1}–${placed}. Schedule it (profit +${p[j]}).`, sfx: 'push', ask });
    }
  }
  const total = slot.reduce((s, j) => s + (j >= 0 ? p[j] : 0), 0);
  F.push({ scene: sc(null), say: `Total profit ${total}. Sequence: ${slot.slice(1).filter((j) => j >= 0).map((j) => `J${j + 1}`).join(' → ')}.`, sfx: 'found' });
  return F;
}

/* =====================================================================
   Huffman coding (Level 49) — mirrors cpp/huffman.cpp tie-breaking
   ===================================================================== */
interface HT {
  id: number;
  freq: number;
  ch?: string;
  left?: HT;
  right?: HT;
}
export function huffmanTree(chars: string[], freq: number[]): { root: HT; merges: [HT, HT, HT][] } {
  let id = 0;
  const pq: HT[] = chars.map((c, i) => ({ id: id++, freq: freq[i], ch: c }));
  const merges: [HT, HT, HT][] = [];
  const popMin = () => {
    let k = 0;
    for (let i = 1; i < pq.length; i++) if (pq[i].freq < pq[k].freq || (pq[i].freq === pq[k].freq && pq[i].id < pq[k].id)) k = i;
    return pq.splice(k, 1)[0];
  };
  while (pq.length > 1) {
    const a = popMin();
    const b = popMin();
    const m: HT = { id: id++, freq: a.freq + b.freq, left: a, right: b };
    merges.push([a, b, m]);
    pq.push(m);
  }
  return { root: pq[0], merges };
}
export function huffmanCodes(chars: string[], freq: number[]): Record<string, string> {
  const { root } = huffmanTree(chars, freq);
  const codes: Record<string, string> = {};
  const go = (t: HT, c: string) => {
    if (!t.left) {
      codes[t.ch!] = c || '0';
      return;
    }
    go(t.left, c + '0');
    go(t.right!, c + '1');
  };
  go(root, '');
  return codes;
}
export const weightedLength = (chars: string[], freq: number[]) => {
  const c = huffmanCodes(chars, freq);
  return chars.reduce((s, ch, i) => s + freq[i] * c[ch].length, 0);
};

export function huffmanFrames(chars: string[], freq: number[], predict = false): Frame[] {
  const { merges } = huffmanTree(chars, freq);
  let forest: HT[] = chars.map((c, i) => ({ id: i, freq: freq[i], ch: c }));
  const F: Frame[] = [];
  const toB = (t: HT): BNode => ({ id: `h${t.id}`, v: t.ch ? `${t.ch}:${t.freq}` : t.freq, left: t.left ? toB(t.left) : null, right: t.right ? toB(t.right) : null });
  const sc = (hi: number[] = []): Scene => {
    const nodes: SNode[] = [];
    const edges: SEdge[] = [];
    let x = 0;
    const sorted = [...forest].sort((a, b) => a.freq - b.freq || a.id - b.id);
    let maxH = 0;
    for (const t of sorted) {
      const s = treeScene(toB(t), { dx: 48, dy: 60, r: 44, minW: 60, tone: (n) => (hi.includes(Number(String(n.id).slice(1))) ? 'active' : String(n.v).includes(':') ? 'accent' : undefined) as Tone | undefined });
      const off = x - 30 + 10;
      s.nodes.forEach((nd) => nodes.push({ ...nd, x: nd.x + off, fontSize: 11 }));
      (s.edges ?? []).forEach((e) => edges.push({ ...e, label: undefined }));
      x += s.w - 40;
      maxH = Math.max(maxH, s.h);
    }
    // edge labels 0/1
    const lab = (t: HT) => {
      if (t.left) {
        const e1 = edges.find((e) => e.from === `h${t.id}` && e.to === `h${t.left!.id}`);
        const e2 = edges.find((e) => e.from === `h${t.id}` && e.to === `h${t.right!.id}`);
        if (e1) e1.label = 0;
        if (e2) e2.label = 1;
        lab(t.left);
        lab(t.right!);
      }
    };
    forest.forEach(lab);
    return { w: Math.max(420, x + 40), h: maxH + 10, nodes, edges };
  };
  F.push({ scene: sc(), line: 'leaves', say: `Start: one single-node tree per symbol (weight = frequency).` });
  for (const [a, b, m] of merges) {
    const cand = [...forest].sort((x, y) => x.freq - y.freq || x.id - y.id);
    F.push({
      scene: sc([a.id, b.id]),
      line: 'pop',
      say: `Two smallest weights: ${a.ch ?? a.freq}${a.ch ? `:${a.freq}` : ''} and ${b.ch ?? b.freq}${b.ch ? `:${b.freq}` : ''}. Merge them (first → left = 0, second → right = 1).`,
      sfx: 'compare',
      ask: predict ? { prompt: 'Which two weights are merged next?', options: [`${a.freq} and ${b.freq}`, ...cand.slice(1, 4).map((c, i) => `${cand[i].freq} and ${c.freq}`).filter((o) => o !== `${a.freq} and ${b.freq}`), cand.length > 2 ? `${cand[1].freq} and ${cand[2].freq}` : `${a.freq + b.freq} and ${a.freq}`].filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 3), answer: 0, hint: 'Always the two smallest.' } : undefined,
    });
    forest = forest.filter((t) => t !== a && t !== b && t.id !== a.id && t.id !== b.id);
    forest.push(m);
    F.push({ scene: sc([m.id]), line: 'merge', say: `New internal node of weight ${m.freq}.`, sfx: 'swap' });
  }
  const codes = huffmanCodes(chars, freq);
  const wl = chars.reduce((s, c, i) => s + freq[i] * codes[c].length, 0);
  F.push({ scene: sc(), line: 'codes', say: `Codes: ${chars.map((c) => `${c}=${codes[c]}`).join(', ')}. Total bits Σ f·len = ${wl} (fixed-length would need ${Math.max(1, Math.ceil(Math.log2(chars.length))) * freq.reduce((a, b) => a + b, 0)}).`, sfx: 'found' });
  return F;
}
