import type { Rng } from '../core/rng';
import { prec, type ENode } from './expr';

/** Random expression trees → infix strings with exactly the parentheses precedence/associativity require (plus optional extras). */
export function randomTree(rng: Rng, depth: number, leaf: () => string): ENode {
  if (depth === 0 || rng.chance(0.3)) return { v: leaf() };
  return { v: rng.pick(['+', '-', '*', '/', '^']), l: randomTree(rng, depth - 1, leaf), r: randomTree(rng, depth - 1, leaf) };
}

export function toInfix(n: ENode, rng?: Rng): string {
  if (!n.l) return n.v;
  const wrap = (c: ENode, side: 'l' | 'r') => {
    const s = toInfix(c, rng);
    if (!c.l) return s;
    const pc = prec(c.v);
    const pp = prec(n.v);
    const need = pc < pp || (pc === pp && (n.v === '^' ? side === 'l' : side === 'r'));
    return need || (rng && rng.chance(0.15)) ? `(${s})` : s;
  };
  return wrap(n.l, 'l') + n.v + wrap(n.r!, 'r');
}
