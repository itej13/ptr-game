import type { Frame, Scene, SNode, Tone } from '../core/types';

/** String algorithms of Level 8, mirroring cpp/string_ops.cpp, pattern_match.cpp, kmp_search.cpp. */

export const substring = (s: string, pos: number, len: number) => s.slice(pos, pos + len);

/** Naive matching; comps counts every evaluation of text[i+j] == pat[j]. */
export function naiveMatch(text: string, pat: string): { idx: number; comps: number; shifts: number } {
  const n = text.length;
  const m = pat.length;
  let comps = 0;
  let shifts = 0;
  for (let i = 0; i + m <= n; i++) {
    shifts++;
    let j = 0;
    while (j < m) {
      comps++;
      if (text[i + j] !== pat[j]) break;
      j++;
    }
    if (j === m) return { idx: i, comps, shifts };
  }
  return { idx: -1, comps, shifts };
}

export function lps(pat: string): number[] {
  const m = pat.length;
  const t = Array(m).fill(0);
  for (let i = 1, len = 0; i < m; ) {
    if (pat[i] === pat[len]) t[i++] = ++len;
    else if (len > 0) len = t[len - 1];
    else t[i++] = 0;
  }
  return t;
}

export function kmpSearch(text: string, pat: string): number {
  const n = text.length;
  const m = pat.length;
  if (m === 0) return 0;
  const t = lps(pat);
  for (let i = 0, j = 0; i < n; ) {
    if (text[i] === pat[j]) {
      i++;
      j++;
      if (j === m) return i - m;
    } else if (j > 0) j = t[j - 1];
    else i++;
  }
  return -1;
}

const CW = 34;
function strRow(s: string, y: number, x0: number, key: string, tone: (k: number) => Tone | undefined, index = false): SNode[] {
  const nodes: SNode[] = [];
  [...s].forEach((ch, k) => {
    nodes.push({ id: `${key}${k}`, x: x0 + k * CW + CW / 2, y, w: CW - 3, h: 34, shape: 'rect', label: ch, tone: tone(k) ?? 'base' });
    if (index) nodes.push({ id: `${key}ix${k}`, x: x0 + k * CW + CW / 2, y: y - 26, shape: 'text', label: k, tone: 'muted', fontSize: 11 });
  });
  return nodes;
}

export function naiveFrames(text: string, pat: string, predict = false): Frame[] {
  const n = text.length;
  const m = pat.length;
  const F: Frame[] = [];
  let comps = 0;
  const sc = (i: number, j: number, state: 'cmp' | 'hit' | 'miss' | 'found' | 'idle'): Scene => ({
    w: Math.max(360, 60 + n * CW),
    h: 170,
    nodes: [
      ...strRow(text, 60, 30, 't', (k) => (state === 'found' && k >= i && k < i + m ? 'done' : k >= i && k < i + j ? 'done' : k === i + j && state !== 'idle' ? (state === 'miss' ? 'warn' : 'compare') : undefined), true),
      ...strRow(pat, 120, 30 + i * CW, 'p', (k) => (state === 'found' ? 'done' : k < j ? 'done' : k === j && state !== 'idle' ? (state === 'miss' ? 'warn' : 'compare') : undefined)),
    ],
  });
  F.push({ scene: sc(0, 0, 'idle'), line: 'init', say: `n = ${n}, m = ${m}. Try every alignment i = 0 … n − m = ${n - m}.`, vars: { n, m } });
  for (let i = 0; i + m <= n; i++) {
    let j = 0;
    F.push({
      scene: sc(i, 0, 'idle'),
      line: 'reset',
      say: `Align pattern at i = ${i}; j = 0.`,
      vars: { i, j, comparisons: comps },
    });
    while (j < m) {
      comps++;
      const eq = text[i + j] === pat[j];
      F.push({
        scene: sc(i, j, eq ? 'cmp' : 'miss'),
        line: 'cmp',
        say: `text[${i + j}] = '${text[i + j]}' ${eq ? '==' : '≠'} pat[${j}] = '${pat[j]}'.`,
        vars: { i, j, comparisons: comps },
        sfx: eq ? 'compare' : 'wrong',
        ask: predict && j === 0 ? { prompt: `At shift i = ${i}, does the first character match?`, options: eq ? ['Yes', 'No'] : ['No', 'Yes'], answer: 0 } : undefined,
      });
      if (!eq) break;
      j++;
    }
    if (j === m) {
      F.push({ scene: sc(i, m, 'found'), line: 'found', say: `j == m: pattern found at index ${i} after ${comps} character comparisons.`, vars: { result: i, comparisons: comps }, sfx: 'found' });
      return F;
    }
  }
  F.push({ scene: sc(Math.max(0, n - m), 0, 'idle'), line: 'notfound', say: `No alignment matched: return -1 (${comps} comparisons). Worst case is (n − m + 1)·m.`, vars: { result: -1, comparisons: comps }, sfx: 'wrong' });
  return F;
}

export function lpsFrames(pat: string): Frame[] {
  const m = pat.length;
  const t: (number | null)[] = Array(m).fill(null);
  t[0] = 0;
  const F: Frame[] = [];
  const sc = (i: number, len: number): Scene => ({
    w: Math.max(360, 80 + m * CW),
    h: 190,
    nodes: [
      ...strRow(pat, 60, 50, 'p', (k) => (k === i ? 'compare' : k === len && i < m ? 'path' : undefined), true),
      ...[...pat].map((_, k) => ({ id: `l${k}`, x: 50 + k * CW + CW / 2, y: 120, w: CW - 3, h: 32, shape: 'rect' as const, label: t[k] ?? '', tone: (t[k] === null ? 'ghost' : k === i - 1 ? 'active' : 'base') as Tone })),
      { id: 'lbl', x: 10, y: 120, shape: 'text', label: 'lps', anchor: 'start', tone: 'muted', fontSize: 12 },
    ],
  });
  F.push({ scene: sc(1, 0), line: 'lps', say: `lps[0] = 0 always (a proper prefix of a 1-char string is empty). i = 1, len = 0.`, vars: { i: 1, len: 0 } });
  for (let i = 1, len = 0; i < m; ) {
    if (pat[i] === pat[len]) {
      t[i] = ++len;
      F.push({ scene: sc(i + 1, len), line: 'lps', say: `pat[${i}] == pat[${len - 1}] ('${pat[i]}'): extend → lps[${i}] = ${len}.`, vars: { i, len } });
      i++;
    } else if (len > 0) {
      const old = len;
      len = t[len - 1] as number;
      F.push({ scene: sc(i, len), line: 'lps', say: `Mismatch '${pat[i]}' vs '${pat[old]}': fall back len = lps[${old - 1}] = ${len} (don't advance i).`, vars: { i, len } });
    } else {
      t[i] = 0;
      F.push({ scene: sc(i + 1, 0), line: 'lps', say: `Mismatch with len = 0: lps[${i}] = 0.`, vars: { i, len } });
      i++;
    }
  }
  F.push({ scene: sc(m, 0), line: 'scan', say: `lps = [${t.join(', ')}]. During the scan, on a mismatch after j matches, jump j = lps[j−1] instead of restarting.`, sfx: 'found' });
  return F;
}
