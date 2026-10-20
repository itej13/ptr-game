import type { Frame, Scene, SNode, Ask } from '../core/types';

/**
 * Polish notation (Level 11). toPostfix/toPrefix/evalPostfix mirror the C++ snippets exactly.
 * parseInfix builds an expression tree independently (precedence climbing) so tests can check
 * the stack algorithms against tree traversals.
 */

export const prec = (op: string) => (op === '^' ? 3 : op === '*' || op === '/' ? 2 : op === '+' || op === '-' ? 1 : 0);
const isOperand = (c: string) => /^[a-z0-9]$/i.test(c);
const isOp = (c: string) => '+-*/^'.includes(c);

export function validateInfix(s: string): string | null {
  if (!s.length) return 'Enter an expression.';
  if (s.length > 32) return 'Keep it to 32 characters.';
  if (!/^[a-z0-9+\-*/^()]+$/i.test(s)) return 'Use single-letter/digit operands, + - * / ^ and parentheses (no spaces).';
  let depth = 0;
  let expectOperand = true;
  for (const c of s) {
    if (isOperand(c)) {
      if (!expectOperand) return 'Two operands in a row — operands are single characters.';
      expectOperand = false;
    } else if (c === '(') {
      if (!expectOperand) return 'Missing operator before "(".';
      depth++;
    } else if (c === ')') {
      if (expectOperand) return 'Empty or incomplete parentheses.';
      if (--depth < 0) return 'Unbalanced parentheses.';
    } else {
      if (expectOperand) return 'Operator without a left operand (no unary minus).';
      expectOperand = true;
    }
  }
  if (depth !== 0) return 'Unbalanced parentheses.';
  if (expectOperand) return 'Expression ends with an operator.';
  return null;
}

export function toPostfix(infix: string): string {
  const st: string[] = [];
  let out = '';
  for (const c of infix) {
    if (isOperand(c)) out += c;
    else if (c === '(') st.push(c);
    else if (c === ')') {
      while (st[st.length - 1] !== '(') out += st.pop();
      st.pop();
    } else {
      while (st.length && (prec(st[st.length - 1]) > prec(c) || (prec(st[st.length - 1]) === prec(c) && c !== '^'))) out += st.pop();
      st.push(c);
    }
  }
  while (st.length) out += st.pop();
  return out;
}

export function toPrefix(infix: string): string {
  const rev = [...infix].reverse().map((c) => (c === '(' ? ')' : c === ')' ? '(' : c));
  const st: string[] = [];
  let out = '';
  for (const c of rev) {
    if (isOperand(c)) out += c;
    else if (c === '(') st.push(c);
    else if (c === ')') {
      while (st[st.length - 1] !== '(') out += st.pop();
      st.pop();
    } else {
      while (st.length && (prec(st[st.length - 1]) > prec(c) || (prec(st[st.length - 1]) === prec(c) && c === '^'))) out += st.pop();
      st.push(c);
    }
  }
  while (st.length) out += st.pop();
  return [...out].reverse().join('');
}

/** C++ semantics: integer division truncates toward zero. Returns null on division by zero. */
export function evalPostfix(p: string): number | null {
  const st: number[] = [];
  for (const c of p) {
    if (/[0-9]/.test(c)) st.push(+c);
    else {
      const b = st.pop()!;
      const a = st.pop()!;
      if (c === '/' && b === 0) return null;
      st.push(c === '+' ? a + b : c === '-' ? a - b : c === '*' ? a * b : Math.trunc(a / b));
    }
  }
  return st[st.length - 1];
}

export function evalPrefix(p: string): number | null {
  const st: number[] = [];
  for (const c of [...p].reverse()) {
    if (/[0-9]/.test(c)) st.push(+c);
    else {
      const a = st.pop()!;
      const b = st.pop()!;
      if (c === '/' && b === 0) return null;
      st.push(c === '+' ? a + b : c === '-' ? a - b : c === '*' ? a * b : Math.trunc(a / b));
    }
  }
  return st[st.length - 1];
}

/* ---------- independent reference: expression tree ---------- */
export interface ENode {
  v: string;
  l?: ENode;
  r?: ENode;
}
export function parseInfix(s: string): ENode {
  let i = 0;
  const primary = (): ENode => {
    const c = s[i++];
    if (c === '(') {
      const e = expr(1);
      i++; // ')'
      return e;
    }
    return { v: c };
  };
  const expr = (minPrec: number): ENode => {
    let lhs = primary();
    while (i < s.length && isOp(s[i]) && prec(s[i]) >= minPrec) {
      const op = s[i++];
      const rhs = expr(op === '^' ? prec(op) : prec(op) + 1);
      lhs = { v: op, l: lhs, r: rhs };
    }
    return lhs;
  };
  return expr(1);
}
export const postorder = (n: ENode): string => (n.l ? postorder(n.l) + postorder(n.r!) + n.v : n.v);
export const preorder = (n: ENode): string => (n.l ? n.v + preorder(n.l) + preorder(n.r!) : n.v);

/* ---------- frames ---------- */
const TW = 30;
function tokenRow(s: string, at: number, y: number, key: string): SNode[] {
  return [...s].map((c, k) => ({ id: `${key}${k}`, x: 40 + k * TW, y, w: TW - 3, h: 32, shape: 'rect' as const, label: c, tone: k === at ? ('active' as const) : k < at ? ('muted' as const) : ('base' as const) }));
}
function stackCol(st: string[] | number[], x: number, yBottom: number, key: string, hiTop = false): SNode[] {
  const nodes: SNode[] = [{ id: `${key}lbl`, x, y: yBottom + 30, shape: 'text', label: 'stack', tone: 'muted', fontSize: 11 }];
  st.forEach((v, i) => nodes.push({ id: `${key}${i}`, x, y: yBottom - i * 36, w: 48, h: 32, shape: 'rect', label: v, tone: hiTop && i === st.length - 1 ? 'active' : 'base' }));
  return nodes;
}

export function postfixFrames(infix: string, mode: 'postfix' | 'prefix' = 'postfix', predict = false): Frame[] {
  const work = mode === 'postfix' ? [...infix] : [...infix].reverse().map((c) => (c === '(' ? ')' : c === ')' ? '(' : c));
  const ws = work.join('');
  const st: string[] = [];
  let out = '';
  const F: Frame[] = [];
  const H = Math.max(260, 150 + 36 * Math.min(10, infix.length));
  const sc = (at: number, hiTop = false): Scene => ({
    w: Math.max(420, 80 + ws.length * TW, 120 + out.length * TW),
    h: H,
    nodes: [
      { id: 'inlbl', x: 40 - 14, y: 22, shape: 'text', label: mode === 'prefix' ? 'reversed input (parens swapped)' : 'input', anchor: 'start', tone: 'muted', fontSize: 11 },
      ...tokenRow(ws, at, 50, 'in'),
      { id: 'outlbl', x: 26, y: 102, shape: 'text', label: 'output', anchor: 'start', tone: 'muted', fontSize: 11 },
      ...[...out].map((c, k) => ({ id: `out${k}`, x: 40 + k * TW, y: 130, w: TW - 3, h: 32, shape: 'rect' as const, label: c, tone: 'done' as const })),
      ...stackCol(st, 60 + Math.max(ws.length, 8) * TW + 30 > 400 ? 380 : 380, H - 50, 'st', hiTop),
    ],
  });
  if (mode === 'prefix') F.push({ scene: sc(-1), say: `Infix → prefix: reverse "${infix}" and swap ( with ) to get "${ws}", convert, then reverse the output.`, vars: {} });
  else F.push({ scene: sc(-1), say: 'Scan left to right. Operands go straight to the output; operators wait on the stack until something of lower precedence (or a ")") arrives.', vars: {} });
  work.forEach((c, k) => {
    let ask: Ask | undefined;
    if (isOperand(c)) {
      if (predict) ask = { prompt: `Token '${c}': what happens?`, options: ['Append to output', 'Push on the stack', 'Pop the stack'], answer: 0 };
      out += c;
      F.push({ scene: sc(k), line: mode === 'postfix' ? 'operand' : undefined, say: `'${c}' is an operand → output.`, vars: { token: c }, ask, sfx: 'tick' });
    } else if (c === '(') {
      if (predict) ask = { prompt: `Token '('?`, options: ['Push on the stack', 'Append to output', 'Pop until ")"'], answer: 0 };
      st.push(c);
      F.push({ scene: sc(k, true), line: mode === 'postfix' ? 'lparen' : undefined, say: `'(' is always pushed (lowest priority once inside the stack).`, vars: { token: c }, ask, sfx: 'push' });
    } else if (c === ')') {
      const popped: string[] = [];
      while (st[st.length - 1] !== '(') {
        const o = st.pop()!;
        out += o;
        popped.push(o);
      }
      st.pop();
      if (predict) ask = { prompt: `Token ')': which operators move to the output?`, options: [popped.join(' ') || 'none', ...['none', '+', '*', popped.slice(0, -1).join(' ') || 'none'].filter((o) => o !== (popped.join(' ') || 'none'))].slice(0, 3), answer: 0, hint: 'Pop everything above the matching "(".' };
      F.push({ scene: sc(k), line: mode === 'postfix' ? 'rparen' : undefined, say: `')' → pop to output until '(' ${popped.length ? `(popped ${popped.join(', ')})` : '(nothing to pop)'}, then discard the '('.`, vars: { token: c }, ask, sfx: 'pop' });
    } else {
      const popped: string[] = [];
      const rule = mode === 'postfix' ? (t: string) => prec(t) > prec(c) || (prec(t) === prec(c) && c !== '^') : (t: string) => prec(t) > prec(c) || (prec(t) === prec(c) && c === '^');
      while (st.length && rule(st[st.length - 1])) {
        const o = st.pop()!;
        out += o;
        popped.push(o);
      }
      st.push(c);
      if (predict) {
        const right = popped.length ? `Pop ${popped.join(' ')}, then push '${c}'` : `Push '${c}' (nothing popped)`;
        const alt = popped.length ? `Push '${c}' (nothing popped)` : `Pop the top, then push '${c}'`;
        ask = { prompt: `Operator '${c}' arrives with stack [${[...st.slice(0, -1), ...popped.slice().reverse()].join(' ') || 'empty'}]. What happens?`, options: [right, alt, `Append '${c}' to output`], answer: 0, hint: mode === 'postfix' ? 'Pop while the top has higher precedence, or equal precedence and the operator is left-associative.' : 'Reversed scan: pop on strictly higher precedence; on equal precedence pop only for ^.' };
      }
      const why =
        mode === 'postfix'
          ? `pop while top has higher precedence, or equal precedence and '${c}' is left-associative${c === '^' ? " (^ is right-associative, so equal ^ stays)" : ''}`
          : `reversed scan: pop while top has higher precedence, or equal precedence only when '${c}' is ^`;
      F.push({ scene: sc(k, true), line: mode === 'postfix' ? 'pushop' : undefined, say: `'${c}' (prec ${prec(c)}): ${why}. ${popped.length ? `Popped ${popped.join(', ')}.` : 'Nothing popped.'} Push '${c}'.`, vars: { token: c }, ask, sfx: 'push' });
    }
  });
  while (st.length) out += st.pop();
  F.push({ scene: sc(work.length), line: mode === 'postfix' ? 'flush' : undefined, say: `End of input: pop everything left. ${mode === 'postfix' ? `Postfix = ${out}` : `Output "${out}" reversed → prefix = ${[...out].reverse().join('')}`}.`, sfx: 'found' });
  return F;
}

export function evalFrames(postfix: string): Frame[] {
  const st: number[] = [];
  const F: Frame[] = [];
  const sc = (at: number): Scene => ({ w: Math.max(400, 80 + postfix.length * TW), h: 330, nodes: [...tokenRow(postfix, at, 50, 'in'), ...stackCol(st, 300, 270, 'st', true)] });
  F.push({ scene: sc(-1), say: 'Scan the postfix left to right. Operands are pushed; an operator pops two, applies itself, pushes the result.', vars: {} });
  [...postfix].forEach((c, k) => {
    if (/[0-9]/.test(c)) {
      st.push(+c);
      F.push({ scene: sc(k), line: 'operand', say: `Push ${c}.`, vars: { token: c }, sfx: 'push' });
    } else {
      const b = st.pop()!;
      const a = st.pop()!;
      const r = c === '+' ? a + b : c === '-' ? a - b : c === '*' ? a * b : Math.trunc(a / b);
      st.push(r);
      F.push({ scene: sc(k), line: 'apply', say: `'${c}': b = pop() = ${b}, a = pop() = ${a}; push a ${c} b = ${r}. (Order matters for − and /.)`, vars: { a, b, result: r }, sfx: 'swap' });
    }
  });
  F.push({ scene: sc(postfix.length), line: 'result', say: `Done: the single value left is ${st[st.length - 1]}.`, sfx: 'found' });
  return F;
}
