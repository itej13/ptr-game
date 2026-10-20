/** C++ tokenizer shared by syntax highlighting and code-recall grading. */

export type TokType = 'kw' | 'type' | 'id' | 'num' | 'str' | 'op' | 'punc' | 'com' | 'ws' | 'pp';
export interface Tok {
  t: TokType;
  s: string;
  line: number; // 1-based
}

const KEYWORDS = new Set(
  'if else for while do return break continue switch case default new delete struct class public private protected template typename using namespace const static void true false nullptr sizeof this operator virtual friend inline auto goto'.split(' '),
);
const TYPES = new Set(
  'int long short char bool float double unsigned signed string vector queue stack priority_queue pair map set unordered_map deque greater less size_t INT_MAX INT_MIN'.split(' '),
);
// longest first
const OPS = ['<<=', '>>=', '...', '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '::'];
const PUNC = new Set(['(', ')', '{', '}', '[', ']', ';', ',']);

export function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  const push = (t: TokType, s: string) => {
    out.push({ t, s, line });
    for (const ch of s) if (ch === '\n') line++;
  };
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) {
      let j = i;
      while (j < n && /\s/.test(src[j])) j++;
      push('ws', src.slice(i, j));
      i = j;
    } else if (src.startsWith('//', i)) {
      let j = src.indexOf('\n', i);
      if (j < 0) j = n;
      push('com', src.slice(i, j));
      i = j;
    } else if (src.startsWith('/*', i)) {
      let j = src.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      push('com', src.slice(i, j));
      i = j;
    } else if (c === '#') {
      // preprocessor directive keyword only: '#include' / '#define'; rest tokenised normally
      let j = i + 1;
      while (j < n && /[A-Za-z]/.test(src[j])) j++;
      push('pp', src.slice(i, j));
      i = j;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      j = Math.min(n, j + 1);
      push('str', src.slice(i, j));
      i = j;
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = /^(0[xX][0-9a-fA-F]+|[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?)[uUlLfF]*/.exec(src.slice(i))!;
      push('num', m[0]);
      i += m[0].length;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < n && /\w/.test(src[j])) j++;
      const w = src.slice(i, j);
      push(KEYWORDS.has(w) ? 'kw' : TYPES.has(w) ? 'type' : 'id', w);
      i = j;
    } else {
      const op = OPS.find((o) => src.startsWith(o, i));
      if (op) {
        push('op', op);
        i += op.length;
      } else {
        push(PUNC.has(c) ? 'punc' : 'op', c);
        i++;
      }
    }
  }
  return out;
}

/**
 * Tokens that matter for grading: no whitespace/comments.
 * '>>' is split into '>' '>' so `vector<vector<int>>` and `vector<vector<int> >` grade the same.
 */
export function gradeTokens(src: string): Tok[] {
  const out: Tok[] = [];
  for (const tk of tokenize(src)) {
    if (tk.t === 'ws' || tk.t === 'com') continue;
    if (tk.s === '>>') out.push({ ...tk, s: '>' }, { ...tk, s: '>' });
    else if (tk.s === '>>=') out.push({ ...tk, s: '>' }, { ...tk, s: '>=' });
    else out.push(tk);
  }
  return out;
}

export type DiffOp =
  | { op: 'keep'; exp: Tok; got: Tok }
  | { op: 'sub'; exp: Tok; got: Tok }
  | { op: 'del'; exp: Tok } // expected token missing from answer
  | { op: 'ins'; got: Tok }; // extra token in answer

/** Token-level Levenshtein diff. errors = number of non-keep ops. */
export function diffCode(expected: string, got: string): { errors: number; ops: DiffOp[] } {
  const a = gradeTokens(expected);
  const b = gradeTokens(got);
  const n = a.length;
  const m = b.length;
  const W = m + 1;
  const d = new Uint32Array((n + 1) * W);
  for (let i = 0; i <= n; i++) d[i * W] = i;
  for (let j = 0; j <= m; j++) d[j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = a[i - 1].s === b[j - 1].s ? 0 : 1;
      d[i * W + j] = Math.min(d[(i - 1) * W + j - 1] + same, d[(i - 1) * W + j] + 1, d[i * W + j - 1] + 1);
    }
  }
  const ops: DiffOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i * W + j] === d[(i - 1) * W + j - 1] + (a[i - 1].s === b[j - 1].s ? 0 : 1)) {
      ops.push(a[i - 1].s === b[j - 1].s ? { op: 'keep', exp: a[i - 1], got: b[j - 1] } : { op: 'sub', exp: a[i - 1], got: b[j - 1] });
      i--;
      j--;
    } else if (i > 0 && d[i * W + j] === d[(i - 1) * W + j] + 1) {
      ops.push({ op: 'del', exp: a[i - 1] });
      i--;
    } else {
      ops.push({ op: 'ins', got: b[j - 1] });
      j--;
    }
  }
  ops.reverse();
  return { errors: ops.filter((o) => o.op !== 'keep').length, ops };
}

/** Human-readable list of the first few mistakes. */
export function describeErrors(ops: DiffOp[], max = 6): string[] {
  const msgs: string[] = [];
  let lastLine = 1; // position in the player's own code
  for (const o of ops) {
    if (msgs.length >= max) break;
    if (o.op === 'keep') lastLine = o.got.line;
    else if (o.op === 'sub') msgs.push(`Line ${(lastLine = o.got.line)}: wrote “${o.got.s}”, expected “${o.exp.s}”`);
    else if (o.op === 'del') msgs.push(`Line ${lastLine}: missing “${o.exp.s}” here`);
    else msgs.push(`Line ${(lastLine = o.got.line)}: unexpected “${o.got.s}”`);
  }
  return msgs;
}
