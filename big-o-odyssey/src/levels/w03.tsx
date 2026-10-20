import type { Level, QGen } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, int } from '../core/vizkit';
import { mcq, num, seq, txt, tf, bank } from '../core/qhelp';
import * as Q from '../engines/stackq';
import * as E from '../engines/expr';
import { randomTree, toInfix } from '../engines/exprgen';
import * as R from '../engines/recursion';
import type { Rng } from '../core/rng';

/* =====================================================================
   Level 9 — Stack ADT on an array
   ===================================================================== */

const opsStr = (ops: Q.Op[]) => ops.map((o) => ('x' in o ? `${o.op}(${o.x})` : `${o.op}()`)).join(', ');

function randOps(rng: Rng, add: 'push' | 'enq' | 'ins', rem: 'pop' | 'deq' | 'del', k: number, peek = false): Q.Op[] {
  const ops: Q.Op[] = [];
  let size = 0;
  for (let i = 0; i < k; i++) {
    if (size === 0 || rng.chance(0.6)) {
      ops.push({ op: add, x: rng.int(1, 60) });
      size++;
    } else if (peek && rng.chance(0.2)) ops.push({ op: 'peek' });
    else {
      ops.push({ op: rem });
      size--;
    }
  }
  return ops;
}

function L9Lesson() {
  return (
    <>
      <Sec title="The stack ADT — last in, first out">
        <p>
          A <b>stack</b> is an ordered list in which all insertions and deletions happen at one end, the <b>top</b>. The last element pushed is the first one
          popped (LIFO). Think of a pile of plates.
        </p>
        <Table
          head={['Operation', 'Meaning', 'Array cost']}
          rows={[
            ['push(x)', 'add x on top (error "overflow" if full)', 'O(1)'],
            ['pop()', 'remove and return the top (error "underflow" if empty)', 'O(1)'],
            ['peek() / top()', 'return the top without removing it', 'O(1)'],
            ['isEmpty(), isFull()', 'top == −1, top == MAX − 1', 'O(1)'],
          ]}
        />
      </Sec>
      <Sec title="Array representation">
        <p>
          Horowitz &amp; Sahni keep a global array and an integer <code>top</code> that indexes the current top element; <code>top = −1</code> means empty.
          Pushing increments first and then stores (<code>stk[++top] = x</code>); popping reads first and then decrements (<code>return stk[top--]</code>).
        </p>
        <Code id="stack_array" />
        <Callout kind="pitfall">
          <p>
            <code>stk[++top]</code> and <code>stk[top++]</code> are different! With top starting at −1, <code>top++</code> would write to stk[−1]. Pre-increment
            on push, post-decrement on pop.
          </p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Drive a stack (capacity 6 so you can trigger overflow)"
        note='Operations separated by commas: push 5, push 3, pop, peek …'
        fields={[{ name: 'ops', label: 'operations', initial: 'push 10, push 20, push 30, pop, peek, push 40, pop, pop, pop, pop', width: 460, random: (r) => opsStr(randOps(r, 'push', 'pop', 10, true)).replace(/\(|\)/g, ' ').replace(/ ,/g, ',') }]}
        build={(v) => Q.stackFrames(Q.parseOps(v.ops, { add: 'push', rem: 'pop', peek: true }), 6)}
        code="stack_array"
      />
      <Sec title="Applications of stacks">
        <ul>
          <li>
            <b>Recursion and function calls</b> — every call pushes an activation record (Level 10).
          </li>
          <li>
            <b>Expression conversion and evaluation</b> — infix → postfix/prefix, evaluating postfix (Level 11).
          </li>
          <li>
            <b>Balanced brackets</b> — push each opener, pop and match on each closer.
          </li>
          <li>Undo/redo, browser back button, depth-first search and backtracking (Levels 39, 57).</li>
          <li>Reversing a sequence: push all, pop all.</li>
        </ul>
        <Code id="balanced_parens" />
      </Sec>
      <Callout kind="exam">
        <p>
          Classic: "Elements 1, 2, 3, 4 are pushed in that order (pops may be interleaved). Which output sequence is impossible?" Rule: once a number is
          popped, every smaller number still on the stack must come out in decreasing order.
        </p>
      </Callout>
    </>
  );
}

/** Can `out` be produced by pushing 1..n in order with interleaved pops? */
function stackRealizable(out: number[]): boolean {
  const st: number[] = [];
  let next = 1;
  for (const x of out) {
    while (next <= x) st.push(next++);
    if (st.pop() !== x) return false;
  }
  return true;
}
const permsOf = (n: number): number[][] => (n === 1 ? [[1]] : permsOf(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n, ...p.slice(i)])));

const stackOpsQ: QGen = (rng) => {
  const ops = randOps(rng, 'push', 'pop', rng.int(6, 9), true);
  const r = Q.runStack(ops, 100);
  return rng.chance(0.5)
    ? seq(`Starting from an empty stack: ${opsStr(ops)}. Write the stack contents from bottom to top.`, r.contents.length ? r.contents : ['empty'], `Final stack (bottom → top): ${r.contents.join(', ') || 'empty'}.`)
    : seq(`Starting from an empty stack: ${opsStr(ops)}. List the values returned by pop()/peek(), in order.`, r.outputs.length ? r.outputs : ['none'], `Returned: ${r.outputs.join(', ') || 'none'}.`);
};
const impossibleQ: QGen = (rng) => {
  const n = rng.int(4, 5);
  const ps = rng.shuffle(permsOf(n));
  const bad = ps.find((p) => !stackRealizable(p))!;
  const good = ps.filter((p) => stackRealizable(p)).slice(0, 3);
  return mcq(`1, 2, …, ${n} are pushed in increasing order; pops may happen at any time. Which output sequence is IMPOSSIBLE?`, bad.join(' '), good.map((g) => g.join(' ')), `Simulate: to output ${bad.join(' ')} you would need to pop an element that is buried under a larger one.`);
};
const balQ: QGen = (rng) => {
  const s = Array.from({ length: rng.int(4, 8) }, () => rng.pick(['(', ')', '[', ']', '{', '}', '(', ')'])).join('');
  const st: string[] = [];
  const pair: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  let ok = true;
  for (const c of s) {
    if ('([{'.includes(c)) st.push(c);
    else if (st.pop() !== pair[c]) {
      ok = false;
      break;
    }
  }
  ok = ok && st.length === 0;
  return mcq(`Is the bracket string \`${s}\` balanced?`, ok ? 'Yes' : 'No', [ok ? 'No' : 'Yes'], ok ? 'Every closer matches the most recent unmatched opener and the stack ends empty.' : 'Either a closer meets the wrong opener/an empty stack, or openers remain at the end.');
};
const L9_BANK = [
  mcq('With top = −1 meaning empty, push should be written as…', 'stk[++top] = x;', ['stk[top++] = x;', 'stk[top] = x; top--;', 'stk[--top] = x;'], 'Increment first so the first push lands at index 0.'),
  mcq('pop() should be written as…', 'return stk[top--];', ['return stk[--top];', 'return stk[++top];', 'return stk[top++];'], 'Read the current top, then decrement.'),
  mcq('Stack underflow means…', 'popping from an empty stack', ['pushing onto a full stack', 'top exceeds MAX', 'two stacks colliding'], 'Overflow is push on a full stack.'),
  mcq('In an array stack of capacity MAX, the full condition is…', 'top == MAX − 1', ['top == MAX', 'top == 0', 'top == −1'], 'Indices run 0 … MAX − 1.'),
  mcq('Time complexity of push and pop on an array stack?', 'O(1) each', ['O(n) each', 'O(log n)', 'push O(1), pop O(n)'], 'Only the top index changes.'),
  mcq('Which is NOT a typical stack application?', 'CPU round-robin scheduling', ['Function calls', 'Postfix evaluation', 'Undo'], 'Round-robin scheduling uses a queue.'),
  mcq('A stack is also called a…', 'LIFO list', ['FIFO list', 'priority list', 'circular list'], 'Last In, First Out.'),
  tf('Popping a value erases it from the underlying array cell.', false, 'Only top moves; the stale value stays until overwritten.'),
];

const L9: Level = {
  id: 'L09',
  n: 9,
  world: 3,
  title: 'Stack on an Array',
  blurb: 'LIFO, the stack ADT, an array implementation with a top index, overflow/underflow, and where stacks show up.',
  syllabus: ['DS U1 · Introduction to stacks', 'DS U1 · Operations on stacks', 'DS U1 · Array representation of stacks'],
  snippets: ['stack_array'],
  extraSnippets: ['balanced_parens'],
  Lesson: L9Lesson,
  quiz: [stackOpsQ, stackOpsQ, stackOpsQ, impossibleQ, impossibleQ, balQ, bank(L9_BANK), bank(L9_BANK), bank(L9_BANK)],
  cards: [
    { q: 'Array stack push / pop one-liners?', a: 'stk[++top] = x;   return stk[top--];   (top = −1 when empty)' },
    { q: 'Full / empty tests?', a: 'top == MAX − 1 / top == −1' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — The stack ADT.', 'Tanenbaum, Langsam & Augenstein, Data Structures Using C — chapter 2: The stack.'],
};

/* =====================================================================
   Level 10 — Recursion and the call stack
   ===================================================================== */

function L10Lesson() {
  return (
    <>
      <Sec title="Recursion">
        <p>
          A function is <b>recursive</b> if it calls itself (directly, or indirectly through other functions). Every correct recursive function has a{' '}
          <b>base case</b> that is answered without recursion and a <b>recursive case</b> that moves strictly closer to the base case.
        </p>
        <Code id="factorial" />
        <p>
          Each call gets an <b>activation record</b> (stack frame) holding its parameters, local variables and return address. The records live on the
          run-time <b>stack</b> — calls push, returns pop. That's why recursion is listed as an application of stacks: the compiler implements it with one.
        </p>
      </Sec>
      <AlgoViz title="Watch the call stack grow and unwind" fields={[{ name: 'n', label: 'n', initial: '5', width: 70, random: (r) => String(r.int(2, 7)) }]} build={(v) => R.factorialFrames(int(v.n, 'n', 0, 9))} code="factorial" />
      <Sec title="Kinds of recursion">
        <Table
          head={['Kind', 'Example', 'Note']}
          rows={[
            ['Direct', 'factorial calls factorial', 'most common'],
            ['Indirect', 'isEven(n) calls isOdd(n−1), which calls isEven(n−2)', 'cycle of calls'],
            ['Tail', 'the recursive call is the very last action', 'easily turned into a loop'],
            ['Tree / multiple', 'Fibonacci: fib(n−1) + fib(n−2)', 'exponential calls unless memoised (DP, World 11)'],
          ]}
        />
        <p>
          Recursion vs iteration: recursion often mirrors the definition (trees, divide-and-conquer) but costs a stack frame per active call — Θ(depth) extra
          space and call overhead. A missing or unreachable base case recurses until the stack overflows.
        </p>
      </Sec>
      <Sec title="Tower of Hanoi">
        <p>
          Move n disks from peg A to peg C using B, one disk at a time, never placing a larger disk on a smaller one. Recursive insight: to move n disks,
          move the top n−1 to the spare peg, move the biggest disk, then move the n−1 back on top of it.
        </p>
        <Code id="hanoi" />
        <F>T(n) = 2·T(n − 1) + 1, T(0) = 0  ⇒  T(n) = 2ⁿ − 1 moves</F>
        <p>
          Solve by iteration: T(n) = 2T(n−1) + 1 = 4T(n−2) + 2 + 1 = … = 2ᵏT(n−k) + (2ᵏ − 1); at k = n, T(n) = 2ⁿ − 1. The smallest disk moves on every odd
          move.
        </p>
      </Sec>
      <AlgoViz title="Tower of Hanoi" fields={[{ name: 'n', label: 'disks', initial: '3', width: 70, random: (r) => String(r.int(2, 4)) }]} build={(v) => R.hanoiFrames(int(v.n, 'disks', 1, 5))} code="hanoi" />
      <Callout kind="daa">
        <p>
          T(n) = 2T(n−1) + 1 is a "decreasing function" recurrence — your Recurrence deck's Master theorem for decreasing functions gives Θ(2ⁿ) directly (a =
          2 &gt; 1, f(n) = Θ(1) ⇒ Θ(aⁿ)). Level 19 covers that theorem.
        </p>
      </Callout>
    </>
  );
}

const hanoiCountQ: QGen = (rng) => {
  const n = rng.int(3, 12);
  return num(`How many moves does Tower of Hanoi make with ${n} disks?`, 2 ** n - 1, `2ⁿ − 1 = 2^${n} − 1 = ${2 ** n - 1}.`);
};
const hanoiMoveQ: QGen = (rng) => {
  const n = rng.int(3, 4);
  const mv = R.hanoiMoves(n);
  const k = rng.int(1, mv.length);
  const [d, f, t] = mv[k - 1];
  return mcq(`hanoi(${n}, 'A', 'C', 'B') — what is move number ${k}?`, `disk ${d}: ${f} → ${t}`, [...new Set(mv.map(([dd, ff, tt]) => `disk ${dd}: ${ff} → ${tt}`))].filter((m) => m !== `disk ${d}: ${f} → ${t}`).slice(0, 3), `Moves: ${mv.map(([dd, ff, tt], i) => `${i + 1}) ${dd}:${ff}→${tt}`).join(' ')}.`);
};
const traceQ: QGen = (rng) => {
  const n = rng.int(2, 4);
  const kind = rng.int(0, 2);
  const out: number[] = [];
  const codes = [
    'void f(int n) {\n    if (n == 0) return;\n    cout << n << " ";\n    f(n - 1);\n}',
    'void f(int n) {\n    if (n == 0) return;\n    f(n - 1);\n    cout << n << " ";\n}',
    'void f(int n) {\n    if (n == 0) return;\n    cout << n << " ";\n    f(n - 1);\n    cout << n << " ";\n}',
  ];
  const run = (k: number) => {
    if (k === 0) return;
    if (kind !== 1) out.push(k);
    run(k - 1);
    if (kind !== 0) out.push(k);
  };
  run(n);
  return seq(`What does f(${n}) print?`, out, kind === 0 ? 'Prints on the way down: n, n−1, …, 1.' : kind === 1 ? 'Prints after the recursive call returns — on the way back up: 1, 2, …, n.' : 'Prints both before and after the call.', { code: codes[kind] });
};
const factQ: QGen = (rng) => {
  const n = rng.int(3, 10);
  return rng.chance(0.5)
    ? num(`factorial(${n}) returns?`, R.factorial(n), `${n}! = ${R.factorial(n)}.`)
    : num(`Calling factorial(${n}) — what is the maximum number of factorial activation records on the stack at once?`, n, `factorial(${n}) … factorial(1): ${n} records before the base case returns.`);
};
const L10_BANK = [
  mcq('What happens if a recursive function has no reachable base case?', 'Stack overflow (infinite recursion)', ['It returns 0', 'The compiler rejects it', 'It loops forever using O(1) memory'], 'Each call pushes a record; memory runs out.'),
  mcq('An activation record holds…', 'parameters, local variables and the return address', ['only the return value', 'the whole program', 'only global variables'], 'One per active call, on the run-time stack.'),
  mcq('Tower of Hanoi recurrence?', 'T(n) = 2T(n − 1) + 1', ['T(n) = T(n − 1) + 1', 'T(n) = 2T(n/2) + 1', 'T(n) = T(n/2) + 1'], 'Two subproblems of size n−1 plus one move.'),
  mcq('A function whose recursive call is its last action is…', 'tail recursive', ['indirectly recursive', 'non-terminating', 'iterative'], 'Tail calls can be replaced by a loop.'),
  mcq('isEven(n) calls isOdd(n − 1) which calls isEven(n − 2). This is…', 'indirect recursion', ['direct recursion', 'tail-free recursion', 'not recursion'], 'The cycle goes through another function.'),
  mcq('Extra space of recursive factorial(n)?', 'Θ(n)', ['O(1)', 'Θ(log n)', 'Θ(n²)'], 'n activation records at the deepest point.'),
  tf('Recursion is implemented by the compiler/runtime using a stack.', true, 'That is why it is a stack application.'),
];

const L10: Level = {
  id: 'L10',
  n: 10,
  world: 3,
  title: 'Recursion & the Call Stack',
  blurb: 'Base and recursive cases, activation records on the run-time stack, kinds of recursion, factorial and the Tower of Hanoi (2ⁿ − 1).',
  syllabus: ['DS U1 · Applications of stacks: recursion'],
  snippets: ['factorial', 'hanoi'],
  Lesson: L10Lesson,
  quiz: [hanoiCountQ, hanoiMoveQ, hanoiMoveQ, traceQ, traceQ, factQ, bank(L10_BANK), bank(L10_BANK), bank(L10_BANK)],
  cards: [
    { q: 'Hanoi moves for n disks and the recurrence?', a: '2ⁿ − 1, from T(n) = 2T(n−1) + 1, T(0) = 0.' },
    { q: 'Three steps of hanoi(n, from, to, via)?', a: 'hanoi(n−1, from, via, to); move disk n from→to; hanoi(n−1, via, to, from).' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Recursive algorithms.', 'Tanenbaum, Langsam & Augenstein, Data Structures Using C — chapter 3: Recursion (Towers of Hanoi).'],
};

/* =====================================================================
   Level 11 — Polish notation
   ===================================================================== */

function infixField(initial: string) {
  return { name: 'e', label: 'infix (no spaces)', initial, width: 320, random: (r: Rng) => toInfix(randomTree(r, 3, () => r.pick([...'abcdefgh'])), r) };
}
const checkInfix = (s: string) => {
  const err = E.validateInfix(s.trim());
  if (err) throw new Error(err);
  return s.trim();
};

function L11Lesson() {
  return (
    <>
      <Sec title="Three ways to write an expression">
        <Table
          head={['Notation', 'Operator position', 'a + b * c', '(a + b) * c']}
          rows={[
            ['Infix', 'between operands', 'a + b * c', '(a + b) * c'],
            ['Prefix (Polish)', 'before operands', '+ a * b c', '* + a b c'],
            ['Postfix (reverse Polish)', 'after operands', 'a b c * +', 'a b + c *'],
          ]}
        />
        <p>
          Prefix and postfix need <b>no parentheses and no precedence rules</b>: the order of operators is the order of evaluation. A postfix expression is
          evaluated in one left-to-right scan with a stack. That is how expressions are <b>compiled</b>: a compiler converts infix to postfix (or an equivalent
          tree) and emits stack-machine code — push operand, apply operator.
        </p>
      </Sec>
      <Sec title="Precedence and associativity">
        <Table
          head={['Operator', 'Precedence', 'Associativity']}
          rows={[
            ['^ (power)', 'highest (3)', 'right: a^b^c = a^(b^c)'],
            ['* /', '2', 'left: a/b/c = (a/b)/c'],
            ['+ −', '1', 'left: a−b−c = (a−b)−c'],
          ]}
        />
      </Sec>
      <Sec title="Infix → postfix with a stack">
        <ol className="steps">
          <li>Operand → append to output.</li>
          <li>'(' → push.</li>
          <li>')' → pop to output until '(' ; discard the '('.</li>
          <li>
            Operator o → while the stack top has <b>higher</b> precedence, or <b>equal</b> precedence and o is left-associative, pop it to output; then push o.
          </li>
          <li>End → pop everything to output.</li>
        </ol>
        <Code id="infix_postfix" />
        <Callout kind="convention" title="Horowitz–Sahni's isp / icp tables">
          <p>
            H–S give every token two priorities — in-stack (isp) and incoming (icp) — and pop while isp[top] ≥ icp[token]. For ( ) + − * / % eos: isp = 0, 19, 12,
            12, 13, 13, 13, 0 and icp = 20, 19, 12, 12, 13, 13, 13, 0. '(' has icp 20 (always pushed) but isp 0 (nothing pops it except ')'). Equal isp/icp makes
            + − * / left-associative — the same behaviour as the prec() rule above. (H–S don't include ^; to make it right-associative you'd give it icp &gt;
            isp.)
          </p>
        </Callout>
      </Sec>
      <AlgoViz title="Infix → postfix" fields={[infixField('a+b*c-(d/e^f^g)*h')]} build={(v) => E.postfixFrames(checkInfix(v.e), 'postfix')} code="infix_postfix" />
      <Sec title="Infix → prefix">
        <p>Reverse the infix string, swap '(' and ')', run the same conversion — but with associativity flipped — then reverse the output.</p>
        <Callout kind="pitfall">
          <p>
            In the reversed scan, pop on <b>equal</b> precedence only for the right-associative ^ (and not for + − * /). Using the postfix rule unchanged gives
            the wrong answer for a − b − c: you'd get −a−bc, i.e. a − (b − c). The correct prefix is − − a b c.
          </p>
        </Callout>
        <Code id="infix_prefix" />
        <p>
          Manual method for exams: fully parenthesise by precedence, then move each operator to the left of its parenthesis pair and drop the parentheses.
        </p>
      </Sec>
      <AlgoViz title="Infix → prefix" fields={[infixField('(a-b/c)*(a/k-l)')]} build={(v) => E.postfixFrames(checkInfix(v.e), 'prefix')} code="infix_prefix" />
      <Sec title="Evaluating postfix (and prefix)">
        <p>
          Scan left to right; push operands; on an operator pop <b>b</b> (right operand) then <b>a</b> (left operand), push a op b. The single value left is the
          answer. Prefix is evaluated the same way scanning <b>right to left</b>, where the first pop is the <i>left</i> operand.
        </p>
        <Code id="eval_postfix" />
      </Sec>
      <AlgoViz
        title="Evaluate postfix"
        note="Digits only (each digit is one operand)."
        fields={[{ name: 'p', label: 'postfix', initial: '23*54*+9-', width: 220 }]}
        build={(v) => {
          const p = v.p.trim();
          if (!/^[0-9+\-*/]+$/.test(p)) throw new Error('Digits and + - * / only.');
          let d = 0;
          for (const c of p) {
            d += /[0-9]/.test(c) ? 1 : -1;
            if (d < 1) throw new Error('Not a valid postfix expression (operator lacks operands).');
          }
          if (d !== 1) throw new Error('Not a valid postfix expression (too many operands).');
          if (E.evalPostfix(p) === null) throw new Error('Division by zero.');
          return E.evalFrames(p);
        }}
        code="eval_postfix"
      />
    </>
  );
}

function L11Practice() {
  return (
    <>
      <AlgoViz title="Predict each token's fate (postfix)" fields={[infixField('a*(b+c)-d/e')]} build={(v) => E.postfixFrames(checkInfix(v.e), 'postfix', true)} code="infix_postfix" predict />
      <AlgoViz title="Predict each token's fate (prefix, reversed scan)" fields={[infixField('a-b-c*d')]} build={(v) => E.postfixFrames(checkInfix(v.e), 'prefix', true)} code="infix_prefix" predict />
    </>
  );
}

const randInfix = (rng: Rng) => {
  for (;;) {
    const s = toInfix(randomTree(rng, rng.int(2, 3), () => rng.pick([...'abcdefgh'])), rng);
    if (s.length >= 5 && s.length <= 19) return s;
  }
};
const postQ: QGen = (rng) => {
  const s = randInfix(rng);
  return txt(`Convert to postfix: \`${s}\``, E.toPostfix(s), `Postfix: ${E.toPostfix(s)} (^ right-associative, others left).`, { placeholder: 'e.g. ab+c*' });
};
const preQ: QGen = (rng) => {
  const s = randInfix(rng);
  return txt(`Convert to prefix: \`${s}\``, E.toPrefix(s), `Prefix: ${E.toPrefix(s)}.`, { placeholder: 'e.g. *+abc' });
};
const evalQ: QGen = (rng) => {
  for (;;) {
    const t = randomTree(rng, rng.int(2, 3), () => String(rng.int(1, 9)));
    const strip = (n: E.ENode): E.ENode => (n.l ? { v: n.v === '^' ? '*' : n.v, l: strip(n.l), r: strip(n.r!) } : n);
    const tr = strip(t);
    if (!tr.l) continue;
    const pre = rng.chance(0.35);
    const s = pre ? E.preorder(tr) : E.postorder(tr);
    const v = pre ? E.evalPrefix(s) : E.evalPostfix(s);
    if (v === null || Math.abs(v) > 9999) continue;
    return num(`Evaluate the ${pre ? 'prefix' : 'postfix'} expression \`${s}\` (single-digit operands, C++ integer division).`, v, `${pre ? 'Scan right to left; first pop = left operand.' : 'Scan left to right; first pop = right operand.'} Result ${v}.`);
  }
};
const L11_BANK = [
  mcq('Postfix of (a + b) * c?', 'ab+c*', ['abc*+', 'a+bc*', '*+abc'], 'Parentheses force + first.'),
  mcq('Prefix of a − b − c?', '−−abc', ['−a−bc', 'ab−c−', '−a−cb'], 'Left-associative: (a − b) − c.'),
  mcq('Postfix of a ^ b ^ c?', 'abc^^', ['ab^c^', '^^abc', 'a^bc^'], '^ is right-associative: a ^ (b ^ c).'),
  mcq('When evaluating postfix, on an operator you pop…', 'the right operand first, then the left', ['the left operand first', 'only one operand', 'until the stack is empty'], 'For 8 2 / : pop 2 (b), pop 8 (a), push 8/2 = 4.'),
  mcq('Why do compilers prefer postfix?', 'It needs no parentheses or precedence rules and evaluates in one scan with a stack', ['It is shorter to type', 'It sorts the operands', 'It avoids variables'], 'Order of operators = order of evaluation.'),
  mcq('In H–S, the in-stack priority (isp) of "(" is…', '0', ['20', '19', '12'], 'isp 0 so no incoming operator pops it; icp 20 so it is always pushed.'),
  mcq('During infix → postfix, an incoming "+" meets "*" on top of the stack. What happens?', '"*" is popped to the output, then "+" is pushed', ['"+" is pushed on top of "*"', '"+" goes to the output', 'Both are discarded'], '* has higher precedence.'),
  tf('A valid postfix expression has exactly one more operand than binary operators.', true, 'Each binary operator reduces the stack by one; one value remains.'),
];

const L11: Level = {
  id: 'L11',
  n: 11,
  world: 3,
  title: 'Polish Notation',
  blurb: 'Infix, prefix and postfix; converting with a stack (precedence, associativity, the H–S isp/icp table), and evaluating postfix/prefix.',
  syllabus: ['DS U1 · Polish expressions and their compilation', 'DS U1 · Infix → prefix and postfix'],
  snippets: ['infix_postfix', 'eval_postfix'],
  extraSnippets: ['infix_prefix'],
  Lesson: L11Lesson,
  Practice: L11Practice,
  quiz: [postQ, postQ, postQ, preQ, preQ, evalQ, evalQ, bank(L11_BANK), bank(L11_BANK)],
  cards: [
    { q: 'Pop rule for an incoming operator (infix → postfix)?', a: 'Pop while top has higher precedence, or equal precedence and the incoming operator is left-associative.' },
    { q: 'Infix → prefix recipe?', a: 'Reverse, swap ( and ), convert with flipped associativity (pop on equal only for ^), reverse the output.' },
    { q: 'H–S isp/icp for ( ) + − * / % eos?', a: 'isp 0 19 12 12 13 13 13 0 · icp 20 19 12 12 13 13 13 0' },
  ],
  refs: [
    'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Evaluation of expressions (postfix, isp/icp, ).',
    'e-PG Pathshala, Data Structures — Applications of stacks (infix to postfix, isp/icp table).',
    'Tremblay & Sorenson, An Introduction to Data Structures with Applications — Polish notation and compilation of expressions.',
  ],
};

/* =====================================================================
   Level 12 — Queues: linear, circular, deque
   ===================================================================== */

function L12Lesson() {
  return (
    <>
      <Sec title="The queue ADT — first in, first out">
        <p>
          A <b>queue</b> is an ordered list where insertions happen at the <b>rear</b> and deletions at the <b>front</b> (FIFO) — a ticket line.
          Operations: enqueue (add at rear), dequeue (remove from front), isEmpty, isFull, front/peek.
        </p>
      </Sec>
      <Sec title="Why a plain array queue fails">
        <p>
          With front and rear only ever moving right, after some enqueues and dequeues the rear hits MAX − 1 while the front slots are empty: the queue reports
          "full" with free space available (rightward drift). Shifting everything left on each dequeue fixes it at O(n) per operation. The real fix is to
          treat the array as a circle.
        </p>
      </Sec>
      <Sec title="Circular queue (Horowitz–Sahni convention)">
        <ul>
          <li>
            <code>front</code> points one position <b>behind</b> the first element; <code>rear</code> points <b>at</b> the last element. Start: front = rear = 0.
          </li>
          <li>Advance with modulo: <code>rear = (rear + 1) % MAX</code>.</li>
          <li>
            Empty ⇔ <code>front == rear</code>. Full ⇔ <code>(rear + 1) % MAX == front</code>.
          </li>
          <li>
            One slot is always left unused, so capacity is <b>MAX − 1</b> — otherwise "full" and "empty" would both look like front == rear.
          </li>
          <li>Number of elements = (rear − front + MAX) % MAX.</li>
        </ul>
        <Code id="circular_queue" />
        <Callout kind="convention">
          <p>
            Other books start with front = rear = −1 and keep front at the first element, or keep a separate <code>count</code> so all MAX slots are usable.
            Exam answers must state the convention; the formulas for full/empty change with it.
          </p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Circular queue (MAX = 8 → holds 7)"
        note="enq 5, deq, … — fill it up to see the full condition."
        fields={[{ name: 'ops', label: 'operations', initial: 'enq 1, enq 2, enq 3, deq, deq, enq 4, enq 5, enq 6, enq 7, enq 8, enq 9, enq 10, deq', width: 460, random: (r) => opsStr(randOps(r, 'enq', 'deq', 12)).replace(/\(|\)/g, ' ').replace(/ ,/g, ',') }]}
        build={(v) => Q.circularFrames(Q.parseOps(v.ops, { add: 'enq', rem: 'deq' }), 8)}
        code="circular_queue"
      />
      <Sec title="Deque and applications">
        <p>
          A <b>deque</b> (double-ended queue) allows insertion and deletion at both ends. An <b>input-restricted</b> deque allows insertion at one end only; an{' '}
          <b>output-restricted</b> deque allows deletion at one end only. A circular array with front/rear moving both ways implements all four operations in
          O(1).
        </p>
        <p>
          Queue applications: CPU and printer scheduling (round robin), buffers between producer and consumer, breadth-first search (Level 39), simulation of
          waiting lines, level-order tree traversal.
        </p>
      </Sec>
    </>
  );
}

function L12Practice() {
  return (
    <AlgoViz
      title="Predict where each enqueue lands (or if it is rejected)"
      fields={[{ name: 'ops', label: 'operations', initial: 'enq 4, enq 8, deq, enq 15, enq 16, enq 23, enq 42, enq 7, enq 9, enq 11, deq, enq 12', width: 460, random: (r) => opsStr(randOps(r, 'enq', 'deq', 12)).replace(/\(|\)/g, ' ').replace(/ ,/g, ',') }]}
      build={(v) => Q.circularFrames(Q.parseOps(v.ops, { add: 'enq', rem: 'deq' }), 8, true)}
      code="circular_queue"
      predict
    />
  );
}

const cqQ: QGen = (rng) => {
  const MAX = rng.pick([5, 6, 8]);
  const ops = randOps(rng, 'enq', 'deq', rng.int(7, 11));
  const r = Q.runCircular(ops, MAX);
  const k = rng.int(0, 2);
  const intro = `Circular queue (H–S convention: front = rear = 0 initially, capacity MAX − 1) with MAX = ${MAX}: ${opsStr(ops)}.`;
  if (k === 0) return seq(`${intro} Give the final values of front and rear.`, [r.front, r.rear], `front = ${r.front}, rear = ${r.rear}${r.full ? ` (${r.full} enqueue(s) rejected as full)` : ''}.`, { placeholder: 'front, rear' });
  if (k === 1) return seq(`${intro} Write the queue contents from front to rear.`, r.contents.length ? r.contents : ['empty'], `Queue: ${r.contents.join(', ') || 'empty'}.`);
  return num(`${intro} How many enqueue calls were rejected as full?`, r.full, `Full when (rear + 1) % MAX == front; ${r.full} rejection(s).`);
};
const countQ: QGen = (rng) => {
  const MAX = rng.pick([8, 10, 12]);
  const front = rng.int(0, MAX - 1);
  const rear = rng.int(0, MAX - 1);
  return num(`Circular queue (H–S convention) with MAX = ${MAX}, front = ${front}, rear = ${rear}. How many elements are stored?`, (rear - front + MAX) % MAX, `(rear − front + MAX) % MAX = (${rear} − ${front} + ${MAX}) % ${MAX} = ${(rear - front + MAX) % MAX}.`);
};
const L12_BANK = [
  mcq('H–S circular queue: full condition?', '(rear + 1) % MAX == front', ['rear == MAX − 1', 'front == rear', 'rear == front − 1 without modulo'], 'One slot stays empty.'),
  mcq('H–S circular queue: empty condition?', 'front == rear', ['rear == −1', '(rear + 1) % MAX == front', 'front == 0'], 'front points one behind the first element.'),
  mcq('Maximum number of elements in an H–S circular queue of size MAX?', 'MAX − 1', ['MAX', 'MAX + 1', 'MAX / 2'], 'Leaving a slot empty distinguishes full from empty.'),
  mcq('A linear (non-circular) array queue can report "full" while free slots exist because…', 'front and rear only move right, leaving dead slots at the start', ['the array is sorted', 'MAX is too large', 'dequeue is O(n)'], 'Rightward drift.'),
  mcq('A deque that allows insertion at only one end is…', 'input-restricted', ['output-restricted', 'a stack', 'a priority queue'], 'Deletion still allowed at both ends.'),
  mcq('Which traversal uses a queue?', 'Breadth-first search / level order', ['Depth-first search', 'Inorder', 'Postorder'], 'FIFO processes nodes level by level.'),
  mcq('enqueue in the H–S circular queue does…', 'rear = (rear + 1) % MAX; q[rear] = x;', ['q[rear] = x; rear++;', 'front = (front + 1) % MAX; q[front] = x;', 'q[++rear] = x;'], 'Advance rear with wrap-around, then store.'),
  tf('A queue is a FIFO structure.', true, 'First In, First Out.'),
];

const L12: Level = {
  id: 'L12',
  n: 12,
  world: 3,
  title: 'Queues, Circular Queues & Deques',
  blurb: 'FIFO, why a plain array queue drifts, the circular queue with the Horowitz–Sahni empty-slot convention, deques and queue applications.',
  syllabus: ['DS U1 · Queues: operations, representations', 'DS U1 · Applications of queues'],
  snippets: ['circular_queue'],
  Lesson: L12Lesson,
  Practice: L12Practice,
  quiz: [cqQ, cqQ, cqQ, cqQ, countQ, bank(L12_BANK), bank(L12_BANK), bank(L12_BANK)],
  cards: [
    { q: 'H–S circular queue: empty, full, count?', a: 'front == rear; (rear+1) % MAX == front; (rear − front + MAX) % MAX. Capacity MAX − 1.' },
    { q: 'enqueue / dequeue lines?', a: 'rear = (rear+1) % MAX; q[rear] = x;  /  front = (front+1) % MAX; return q[front];' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — The queue ADT, circular queues.', 'Tanenbaum, Langsam & Augenstein, Data Structures Using C — Queues and their sequential representation.'],
};

/* =====================================================================
   Level 13 — Priority queues (array)
   ===================================================================== */

function L13Lesson() {
  return (
    <>
      <Sec title="Priority queue">
        <p>
          A <b>priority queue</b> stores elements with priorities and always deletes the element of <b>highest</b> priority (max-PQ) or lowest (min-PQ),
          regardless of arrival order. Equal priorities may be served in any order unless the specification says FIFO.
        </p>
        <Table
          head={['Implementation', 'insert', 'deleteMax', 'findMax']}
          rows={[
            ['Unsorted array / list', 'O(1)', 'O(n)', 'O(n)'],
            ['Sorted array (ascending)', 'O(n) (shift)', 'O(1) (take last)', 'O(1)'],
            ['Sorted linked list', 'O(n)', 'O(1)', 'O(1)'],
            ['Binary heap (Level 29)', 'O(log n)', 'O(log n)', 'O(1)'],
          ]}
        />
        <p>Every simple implementation pays O(n) somewhere; the heap balances both at O(log n).</p>
      </Sec>
      <Sec title="Unsorted-array priority queue">
        <Code id="priority_queue_array" />
        <p>
          deleteMax scans all n elements to find the maximum, then fills the hole with the last element (order doesn't matter in an unsorted array) — the
          O(1) deletion trick from Level 5.
        </p>
      </Sec>
      <AlgoViz
        title="Priority queue on an unsorted array"
        fields={[{ name: 'ops', label: 'operations', initial: 'ins 30, ins 10, ins 50, ins 20, del, ins 40, del, del', width: 420, random: (r) => opsStr(randOps(r, 'ins', 'del', 9)).replace(/\(|\)/g, ' ').replace(/ ,/g, ',') }]}
        build={(v) => Q.pqFrames(Q.parseOps(v.ops, { add: 'ins', rem: 'del' }))}
        code="priority_queue_array"
      />
      <Sec title="Applications">
        <p>
          OS job scheduling by priority, event-driven simulation (next event = smallest time), Dijkstra's and Prim's algorithms (Levels 42–43), Huffman coding
          (Level 49), A* search, bandwidth management.
        </p>
      </Sec>
    </>
  );
}

function L13Practice() {
  return (
    <AlgoViz
      title="Predict each deleteMax"
      fields={[{ name: 'ops', label: 'operations', initial: 'ins 7, ins 19, ins 3, ins 12, del, ins 25, del, del', width: 420, random: (r) => opsStr(randOps(r, 'ins', 'del', 9)).replace(/\(|\)/g, ' ').replace(/ ,/g, ',') }]}
      build={(v) => Q.pqFrames(Q.parseOps(v.ops, { add: 'ins', rem: 'del' }), true)}
      code="priority_queue_array"
      predict
    />
  );
}

const pqQ: QGen = (rng) => {
  const ops = randOps(rng, 'ins', 'del', rng.int(7, 10));
  const r = Q.runPQ(ops, 100);
  return rng.chance(0.5)
    ? seq(`Unsorted-array max-PQ (the lesson's code): ${opsStr(ops)}. List the values returned by deleteMax, in order.`, r.outputs.length ? r.outputs : ['none'], `Returned: ${r.outputs.join(', ') || 'none'}.`)
    : seq(`Unsorted-array max-PQ (the lesson's code, which fills the hole with the last element): ${opsStr(ops)}. Write the array pq[0..n−1] at the end.`, r.contents.length ? r.contents : ['empty'], `pq = [${r.contents.join(', ')}].`);
};
const L13_BANK = [
  mcq('deleteMax on an unsorted array of n elements costs…', 'O(n)', ['O(1)', 'O(log n)', 'O(n log n)'], 'Must scan to find the maximum.'),
  mcq('insert into a sorted-array priority queue costs…', 'O(n)', ['O(1)', 'O(log n)', 'O(n²)'], 'Elements shift to keep the order (binary search finds the spot in O(log n), but shifting is O(n)).'),
  mcq('Which implementation gives O(log n) for both insert and deleteMax?', 'Binary heap', ['Unsorted array', 'Sorted array', 'Sorted linked list'], 'Level 29.'),
  mcq('A priority queue deletes…', 'the element with the highest priority', ['the oldest element', 'the newest element', 'a random element'], 'Arrival order doesn\'t matter.'),
  mcq('Which algorithm relies on a min-priority queue?', 'Dijkstra\'s shortest paths', ['Binary search', 'Bubble sort', 'Tower of Hanoi'], 'It repeatedly extracts the closest unvisited vertex.'),
  tf('A stack is a priority queue where the most recently inserted element has the highest priority.', true, 'Priority = insertion time gives LIFO; earliest-first gives a FIFO queue.'),
];

const L13: Level = {
  id: 'L13',
  n: 13,
  world: 3,
  title: 'Priority Queues (Array)',
  blurb: 'Max/min priority queues, the cost trade-offs of unsorted and sorted arrays, and why the heap (Level 29) wins.',
  syllabus: ['DS U1 · Priority queues'],
  snippets: ['priority_queue_array'],
  Lesson: L13Lesson,
  Practice: L13Practice,
  quiz: [pqQ, pqQ, pqQ, pqQ, bank(L13_BANK), bank(L13_BANK), bank(L13_BANK)],
  cards: [{ q: 'PQ costs: unsorted array / sorted array / heap?', a: 'insert O(1)/O(n)/O(log n); deleteMax O(n)/O(1)/O(log n).' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Priority queues (heaps) and the comparison with lists/arrays.', 'Cormen et al., Introduction to Algorithms 3e — §6.5 Priority queues.'],
};

export default [L9, L10, L11, L12, L13];
