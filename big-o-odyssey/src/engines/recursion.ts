import type { Frame, Scene, SNode } from '../core/types';

/** Recursion and the call stack (Level 10): factorial and Tower of Hanoi. */

export function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

export function hanoiMoves(n: number, from = 'A', to = 'C', via = 'B'): [number, string, string][] {
  if (n === 0) return [];
  return [...hanoiMoves(n - 1, from, via, to), [n, from, to], ...hanoiMoves(n - 1, via, to, from)];
}

function callStack(calls: string[], hiTop: boolean, x = 120, yBottom = 330): SNode[] {
  return [
    { id: 'cslbl', x, y: yBottom + 32, shape: 'text', label: 'call stack', tone: 'muted', fontSize: 11 },
    ...calls.map((c, i) => ({ id: `cs${i}`, x, y: yBottom - i * 38, w: 190, h: 32, shape: 'rect' as const, label: c, tone: hiTop && i === calls.length - 1 ? ('active' as const) : ('base' as const), fontSize: 13 })),
  ];
}

export function factorialFrames(n: number): Frame[] {
  const F: Frame[] = [];
  const calls: string[] = [];
  const sc = (hi: boolean, note?: string): Scene => ({
    w: 420,
    h: 380,
    nodes: [...callStack(calls, hi), ...(note ? [{ id: 'note', x: 250, y: 60, shape: 'text' as const, label: note, anchor: 'start' as const, tone: 'accent' as const, fontSize: 14 }] : [])],
  });
  const go = (k: number): number => {
    calls.push(`factorial(${k})`);
    F.push({ scene: sc(true), line: 'base', say: `Call factorial(${k}): push a new activation record (parameter n = ${k}, return address).`, vars: { n: k, depth: calls.length }, sfx: 'push' });
    if (k <= 1) {
      F.push({ scene: sc(true, 'returns 1'), line: 'ret1', say: `n = ${k} ≤ 1: base case, return 1. No further call — the stack stops growing.`, vars: { n: k, returns: 1 } });
      calls.pop();
      return 1;
    }
    F.push({ scene: sc(true), line: 'rec', say: `n = ${k} > 1: must compute ${k} * factorial(${k - 1}) — this call waits.`, vars: { n: k } });
    const r = go(k - 1);
    const v = k * r;
    F.push({ scene: sc(true, `${k} * ${r} = ${v}`), line: 'rec', say: `factorial(${k - 1}) returned ${r}; factorial(${k}) returns ${k} × ${r} = ${v} and its record is popped.`, vars: { n: k, returns: v }, sfx: 'pop' });
    calls.pop();
    return v;
  };
  const res = go(n);
  F.push({ scene: sc(false, `factorial(${n}) = ${res}`), say: `Done. Maximum stack depth was ${n} — recursion costs Θ(n) stack space here.`, vars: { result: res }, sfx: 'found' });
  return F;
}

export function hanoiFrames(n: number): Frame[] {
  const pegs: Record<string, number[]> = { A: Array.from({ length: n }, (_, i) => n - i), B: [], C: [] };
  const PX: Record<string, number> = { A: 380, B: 540, C: 700 };
  const F: Frame[] = [];
  const calls: string[] = [];
  let moves = 0;
  const sc = (hiDisk?: number): Scene => {
    const nodes: SNode[] = [...callStack(calls.slice(-8), true, 130, 340)];
    for (const p of ['A', 'B', 'C']) {
      nodes.push({ id: `peg${p}`, x: PX[p], y: 250, w: 8, h: 190, shape: 'rect', tone: 'muted' });
      nodes.push({ id: `base${p}`, x: PX[p], y: 350, w: 150, h: 10, shape: 'rect', tone: 'muted' });
      nodes.push({ id: `pl${p}`, x: PX[p], y: 375, shape: 'text', label: p, tone: 'muted' });
      pegs[p].forEach((d, i) => nodes.push({ id: `disk${d}`, x: PX[p], y: 330 - i * 24, w: 30 + d * 22, h: 20, shape: 'rect', label: d, tone: d === hiDisk ? 'active' : 'accent', fontSize: 11 }));
    }
    return { w: 800, h: 400, nodes };
  };
  F.push({ scene: sc(), say: `${n} disks on A. Goal: move them to C, one at a time, never a larger disk on a smaller one.`, vars: { moves: 0 } });
  const go = (k: number, from: string, to: string, via: string) => {
    calls.push(`hanoi(${k}, ${from}, ${to}, ${via})`);
    if (k === 0) {
      calls.pop();
      return;
    }
    F.push({ scene: sc(), line: 'first', say: `hanoi(${k}, ${from}→${to}): first move the top ${k - 1} disk(s) out of the way onto ${via}.`, vars: { n: k, moves } });
    go(k - 1, from, via, to);
    pegs[to].push(pegs[from].pop()!);
    moves++;
    F.push({ scene: sc(k), line: 'move', say: `Move disk ${k} from ${from} to ${to}. (move #${moves})`, vars: { n: k, moves }, sfx: 'swap' });
    if (k > 1) F.push({ scene: sc(), line: 'second', say: `Now bring the ${k - 1} disk(s) from ${via} onto disk ${k} at ${to}.`, vars: { n: k, moves } });
    go(k - 1, via, to, from);
    calls.pop();
  };
  go(n, 'A', 'C', 'B');
  F.push({ scene: sc(), say: `Done in ${moves} moves = 2^${n} − 1. Recurrence: T(n) = 2T(n−1) + 1, T(0) = 0.`, vars: { moves }, sfx: 'found' });
  return F;
}
