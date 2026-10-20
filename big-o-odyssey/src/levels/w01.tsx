import { useMemo, useState } from 'react';
import type { Frame, Level, QGen, Scene, SNode } from '../core/types';
import { Player } from '../core/Player';
import { Sec, Callout, Table, F, Viz, InputBar } from '../core/lesson';
import { row, items, chain, text } from '../core/layouts';
import { mcq, num, tf, bank } from '../core/qhelp';
import { LOOPS, loopById, countOf } from '../engines/loops';
import { CodeView } from '../core/CodePanel';

/* =====================================================================
   Level 1 — Algorithms, characteristics, ADTs
   ===================================================================== */

const SWAP_CODE = `Algorithm Swap(a, b)
begin
    temp = a;
    a = b;
    b = temp;
end`;

function swapFrames(a: number, b: number): Frame[] {
  const box = (va: number | string, vb: number | string, vt: number | string, hi: 'a' | 'b' | 'temp' | null): Scene => ({
    w: 420,
    h: 150,
    nodes: [
      { id: 'a', x: 90, y: 70, w: 80, h: 50, shape: 'rect', label: va, sub: 'a', tone: hi === 'a' ? 'active' : 'base' },
      { id: 'b', x: 210, y: 70, w: 80, h: 50, shape: 'rect', label: vb, sub: 'b', tone: hi === 'b' ? 'active' : 'base' },
      { id: 't', x: 330, y: 70, w: 80, h: 50, shape: 'rect', label: vt, sub: 'temp', tone: hi === 'temp' ? 'active' : vt === '?' ? 'ghost' : 'base' },
    ],
  });
  return [
    { scene: box(a, b, '?', null), line: '2', say: `Input: a = ${a}, b = ${b}. temp does not hold anything meaningful yet.`, vars: { a, b } },
    { scene: box(a, b, a, 'temp'), line: '3', say: `temp = a copies ${a} into temp — the only copy of a's value we'll still have after the next line.`, vars: { a, b, temp: a } },
    { scene: box(b, b, a, 'a'), line: '4', say: `a = b overwrites a with ${b}. Without temp, ${a} would be lost here.`, vars: { a: b, b, temp: a } },
    { scene: box(b, a, a, 'b'), line: '5', say: `b = temp restores the saved ${a} into b. Swapped in exactly 3 assignments, for every input — finite, definite, effective.`, vars: { a: b, b: a, temp: a }, sfx: 'found' },
  ];
}

function adtFrames(vals: number[], x: number, mode: 'array' | 'list'): Frame[] {
  const frames: Frame[] = [];
  if (mode === 'array') {
    const cap = vals.length + 1;
    const arr: (number | null)[] = [...vals, null];
    const its = arr.map((v, i) => (v === null ? null : { id: `a${i}`, v }));
    const sc = (cells: typeof its, hi: number, say: string, moves: number): Frame => ({
      scene: { w: 60 + cap * 56 + 40, h: 140, nodes: row(cells, { slots: cap, index: true, tone: (i) => (i === hi ? 'active' : undefined), key: 'arr' }) },
      say,
      vars: { 'elements moved': moves },
    });
    frames.push(sc(its, -1, `Array representation: ${vals.length} elements in consecutive slots. Insert ${x} at position 0.`, 0));
    let cells = its.slice();
    let moves = 0;
    for (let i = vals.length - 1; i >= 0; i--) {
      cells = cells.slice();
      cells[i + 1] = cells[i];
      cells[i] = null;
      moves++;
      frames.push(sc(cells, i + 1, `Shift a[${i}] → a[${i + 1}] to open a gap at the front.`, moves));
    }
    cells = cells.slice();
    cells[0] = { id: 'new', v: x };
    frames.push({ ...sc(cells, 0, `Write ${x} into a[0]. Cost grew with n: ${moves} moves — Θ(n).`, moves), sfx: 'found' });
  } else {
    const list = items(vals, 'n');
    const sc = (l: typeof list, extraNew: boolean, say: string, linked: boolean): Frame => {
      const c = chain(l, { key: 'L', tone: (_, it) => (it.id === 'new' ? 'active' : undefined) });
      const nodes = c.nodes.slice();
      const edges = c.edges.slice();
      if (extraNew) {
        nodes.push({ id: 'new', x: 70, y: 170, w: 56, h: 38, shape: 'rect', label: x, tone: 'active' });
        if (linked) edges.push({ from: 'new', to: l[0].id, directed: true, tone: 'active' });
      }
      return { scene: { w: Math.max(c.w, 300), h: 230, nodes, edges }, say, vars: { 'pointers changed': linked ? (extraNew ? 1 : 2) : 0 } };
    };
    frames.push(sc(list, false, `Linked representation: same List ADT, nodes scattered in memory, joined by pointers. Insert ${x} at position 0.`, false));
    frames.push(sc(list, true, `Allocate a new node holding ${x}.`, false));
    frames.push(sc(list, true, `new->next = head: the new node points at the old first node.`, true));
    const l2 = [{ id: 'new', v: x }, ...list];
    frames.push({ ...sc(l2, false, `head = new. Two pointer writes, no matter how long the list is — Θ(1). Same ADT operation, different cost.`, true), sfx: 'found' });
  }
  return frames;
}

function L1Lesson() {
  const [a, setA] = useState('7, 3');
  const ab = a.split(/[\s,]+/).map(Number);
  const valid = ab.length === 2 && ab.every(Number.isFinite);
  const swap = useMemo(() => (valid ? swapFrames(ab[0], ab[1]) : swapFrames(7, 3)), [a]); // eslint-disable-line react-hooks/exhaustive-deps
  const arr = useMemo(() => adtFrames([12, 5, 9, 31], 4, 'array'), []);
  const lst = useMemo(() => adtFrames([12, 5, 9, 31], 4, 'list'), []);
  return (
    <>
      <Sec title="What an algorithm is">
        <p>
          An <b>algorithm</b> is a finite set of instructions that, if followed, accomplishes a particular task. Horowitz &amp; Sahni (your syllabus's first
          textbook) say every algorithm must satisfy five criteria:
        </p>
        <Table
          head={['Criterion', 'Meaning', 'Violated by…']}
          rows={[
            ['Input', 'Zero or more quantities are externally supplied.', '— (zero inputs is allowed, e.g. "print the first 10 primes")'],
            ['Output', 'At least one quantity is produced.', 'A procedure that computes but never reports anything'],
            ['Definiteness', 'Each instruction is clear and unambiguous.', '"Add 6 or 7 to x", "divide by a suitable number"'],
            ['Finiteness', 'For all cases, it terminates after a finite number of steps.', '`while (1) { x++; }` — runs forever'],
            ['Effectiveness', 'Every instruction is basic enough to be carried out, in principle, by a person with pencil and paper — it must be feasible, not just definite.', '"Compute the exact decimal value of π", "divide by zero"'],
          ]}
        />
        <Callout kind="errata">
          <p>
            Your <code>1. Intro</code> slide defines Effectiveness as "don't write unnecessary statements". That's not the textbook meaning. Effectiveness is about{' '}
            <b>feasibility</b>: each step must be something that can actually be done exactly in finite time. An instruction can be perfectly definite
            ("print all digits of √2") and still not effective.
          </p>
        </Callout>
        <p>
          A procedure that has all properties except finiteness (e.g. an operating system's scheduler loop) is called a <b>computational procedure</b>, not an
          algorithm.
        </p>
      </Sec>

      <Viz title="Trace an algorithm: Swap(a, b) from your Intro deck" note="Type two numbers to swap. Use ← → or the buttons to step.">
        <InputBar value={a} onChange={setA} label="a, b" error={valid ? null : 'Enter two numbers, e.g. 7, 3'} />
        <Player frames={swap} codeText={SWAP_CODE} />
      </Viz>

      <Sec title="Algorithm vs program · a priori vs a posteriori">
        <Table
          head={['', 'Algorithm', 'Program']}
          rows={[
            ['Written at', 'Design time', 'Implementation time'],
            ['Written by', 'Someone with domain knowledge', 'A programmer'],
            ['Language', 'Any — pseudocode, maths, English', 'A programming language'],
            ['Depends on hardware/OS?', 'No', 'Yes'],
            ['Evaluated by', 'A priori analysis (time & space as functions of n)', 'A posteriori testing (run it, measure it)'],
          ]}
        />
        <p>
          <b>A priori analysis</b> happens before running anything: you count steps and express cost as a function of input size. It is independent of
          language, compiler and machine. <b>A posteriori testing</b> measures actual running time and memory of a program on real hardware — useful, but the
          numbers change with the machine. This course is mostly about the a-priori kind.
        </p>
      </Sec>

      <Sec title="Data types, ADTs and data structures">
        <p>
          A <b>data type</b> is a collection of objects together with a set of operations that act on those objects (e.g. <code>int</code>: the integers in
          a range with + − × / %).
        </p>
        <p>
          An <b>abstract data type (ADT)</b> is a data type organised so that the <i>specification</i> of the objects and their operations is separated from
          the <i>representation</i> of the objects and the <i>implementation</i> of the operations. The ADT says <b>what</b>; a data structure says{' '}
          <b>how</b>.
        </p>
        <Table
          head={['ADT (specification)', 'Possible data structures (implementation)']}
          rows={[
            ['List', 'Array · singly / doubly / circular linked list'],
            ['Stack', 'Array with a top index · linked list'],
            ['Queue', 'Circular array · linked list with front & rear'],
            ['Priority queue', 'Unsorted array · sorted array · binary heap'],
            ['Dictionary / set', 'Binary search tree · AVL tree · B-tree · hash table'],
          ]}
        />
        <Callout kind="tip">
          <p>
            Designing with ADTs lets you swap the implementation without touching code that uses it. You'll see this repeatedly: the <i>same</i> stack ADT
            is built on an array in Level 9 and on a linked list in Level 17.
          </p>
        </Callout>
      </Sec>

      <Sec title="The List ADT">
        <p>
          An <b>ordered list</b> (linear list) is a sequence (a<sub>0</sub>, a<sub>1</sub>, …, a<sub>n−1</sub>). Typical operations from Horowitz &amp; Sahni:
        </p>
        <ul>
          <li>find the length n;</li>
          <li>read the items left-to-right (or right-to-left);</li>
          <li>retrieve the i-th element; store a new value at position i;</li>
          <li>insert at position i, so elements i … n−1 become i+1 … n;</li>
          <li>delete at position i, so elements i+1 … n−1 become i … n−2.</li>
        </ul>
        <p>
          Data structures are often classified as <b>linear</b> (elements form a sequence: arrays, lists, stacks, queues) vs <b>non-linear</b> (trees,
          graphs), and <b>static</b> (size fixed at compile time, e.g. a C array) vs <b>dynamic</b> (grows/shrinks at run time, e.g. a linked list).
        </p>
      </Sec>

      <Viz title="Same ADT operation, two data structures: insert at position 0">
        <div className="split">
          <div>
            <div className="eyebrow">Array</div>
            <Player frames={arr} />
          </div>
          <div>
            <div className="eyebrow">Linked list</div>
            <Player frames={lst} />
          </div>
        </div>
      </Viz>

      <Callout kind="exam">
        <p>
          Classic short questions: list the five characteristics with one-line meanings; distinguish algorithm vs program; define ADT and give an example of
          one ADT with two implementations; a priori vs a posteriori.
        </p>
      </Callout>
    </>
  );
}

const L1_BANK = [
  mcq('Which criterion does `while (1) { x = x + 1; }` violate?', 'Finiteness', ['Definiteness', 'Effectiveness', 'Output'], 'It never terminates, so it fails finiteness — "for all cases, terminate after a finite number of steps".'),
  mcq('"Add 6 or 7 to x" violates which criterion?', 'Definiteness', ['Finiteness', 'Effectiveness', 'Input'], 'The instruction is ambiguous — which one? Definiteness requires every instruction to be clear and unambiguous.'),
  mcq('"Compute the exact decimal expansion of √2 and print it" violates which criterion?', 'Effectiveness', ['Definiteness', 'Input', 'Output'], 'The instruction is clear (definite) but cannot be carried out exactly in finite time — it is not effective (feasible).'),
  mcq('How many inputs must an algorithm have, according to Horowitz & Sahni?', 'Zero or more', ['At least one', 'Exactly one', 'At least two'], 'Input: zero or more quantities are externally supplied. Output: at least one.'),
  mcq('How many outputs must an algorithm produce?', 'At least one', ['Zero or more', 'Exactly one', 'One per input'], 'Output: at least one quantity is produced.'),
  mcq('A procedure with all the properties of an algorithm except finiteness is called…', 'A computational procedure', ['A heuristic', 'A program', 'An abstract data type'], 'Example: an operating system that waits forever for the next job is a computational procedure.'),
  mcq('Which analysis is independent of hardware, OS and programming language?', 'A priori analysis', ['A posteriori testing', 'Profiling', 'Benchmarking'], 'A priori analysis counts steps on the algorithm itself; a posteriori testing measures a program on a machine.'),
  mcq('An abstract data type separates…', 'the specification of objects and operations from their representation and implementation', ['data from instructions', 'compile time from run time', 'input from output'], 'That is the Horowitz–Sahni definition of an ADT.'),
  mcq('Which pair is ADT → data structure?', 'Stack → array with a top index', ['Array → stack', 'Linked list → queue', 'Heap → priority queue'], 'The ADT is the specification (stack); the array with a top index is one representation of it.'),
  mcq('Which of these is a non-linear data structure?', 'Tree', ['Stack', 'Queue', 'Array'], 'Trees and graphs are non-linear; arrays, lists, stacks and queues are linear.'),
  mcq('Inserting at position 0 of an n-element array-based list costs…', 'Θ(n) moves', ['Θ(1)', 'Θ(log n)', 'Θ(n²)'], 'Every existing element must shift one place right.'),
  mcq('Inserting at the front of a singly linked list (given head) costs…', 'Θ(1)', ['Θ(n)', 'Θ(log n)', 'Θ(n log n)'], 'Create a node, point it at the old head, move head — constant work.'),
  mcq('Who writes an algorithm (vs a program), per your Intro deck?', 'A designer with domain knowledge', ['A compiler', 'A tester', 'The operating system'], 'Algorithms are written at design level by someone with domain knowledge; programs at implementation level by programmers.'),
  tf('A posteriori testing gives machine-independent results.', false, 'Measured times depend on hardware, OS, compiler and load. A priori analysis is the machine-independent one.'),
  tf('Every program is an algorithm.', false, 'A program may never terminate (e.g. a server loop), violating finiteness.'),
  tf('An ADT specifies what operations do, not how they are implemented.', true, 'That separation is the whole point of an ADT.'),
  mcq('Deleting the element at position i from the ordered list (a0 … a(n−1)) makes elements i+1 … n−1 become…', 'i … n−2', ['i+2 … n', 'i … n−1', 'i+1 … n−2'], 'Each later element moves one position toward the front.'),
];

const L1: Level = {
  id: 'L01',
  n: 1,
  world: 1,
  title: 'Algorithms & ADTs',
  blurb: 'What makes something an algorithm, how algorithms differ from programs, and why we separate an ADT from its data structure.',
  syllabus: ['DS U1 · Introduction to algorithmic', 'DS U1 · ADTs, list data structure', 'DAA U1 · Algorithmic efficiency'],
  snippets: [],
  Lesson: L1Lesson,
  quiz: [bank(L1_BANK), bank(L1_BANK), bank(L1_BANK)],
  cards: [
    { q: 'Five criteria every algorithm must satisfy?', a: 'Input (≥0), Output (≥1), Definiteness, Finiteness, Effectiveness.' },
    { q: 'Definiteness vs effectiveness?', a: 'Definite = unambiguous. Effective = basic enough to actually carry out exactly (feasible). Definite does not imply effective.' },
    { q: 'What is an ADT?', a: 'A data type whose specification (objects + operations) is separated from its representation and implementation.' },
    { q: 'A priori vs a posteriori?', a: 'A priori: analyse the algorithm (machine-independent step counts). A posteriori: test/measure a program on a machine.' },
  ],
  refs: [
    'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Algorithm specification, Data abstraction.',
    'Knuth, The Art of Computer Programming Vol. 1, §1.1 — the five properties of an algorithm.',
    'Your DAA deck "1. Intro" (Dr. Neha Gupta) — algorithm vs program, priori vs posteriori.',
  ],
};

/* =====================================================================
   Level 2 — Step counts, loop analysis, time–space trade-off
   ===================================================================== */

function loopFrames(id: string, n: number): Frame[] {
  const p = loopById(id);
  const runs = p.run(n);
  const shown = runs.slice(0, 64);
  const perRow = 12;
  const frames: Frame[] = [];
  const scene = (k: number): Scene => {
    const nodes: SNode[] = shown.slice(0, k).map(([i, j], t) => ({
      id: `t${t}`,
      x: 40 + (t % perRow) * 50,
      y: 50 + Math.floor(t / perRow) * 50,
      w: 46,
      h: 40,
      shape: 'rect',
      label: j === undefined ? `i=${i}` : `${i},${j}`,
      tone: t === k - 1 ? 'active' : 'base',
      fontSize: 11,
    }));
    const rows = Math.max(1, Math.ceil(Math.max(k, 1) / perRow));
    nodes.push(text('cnt', 20, 50 + rows * 50, `count = ${k}`, { fontSize: 16, tone: 'accent' }));
    return { w: 40 + perRow * 50, h: 80 + rows * 50, nodes };
  };
  frames.push({ scene: scene(0), line: '1', say: `n = ${n}. Every box will be one execution of count++ (labelled with ${p.nested ? 'i,j' : 'i'}).`, vars: { n, count: 0 } });
  shown.forEach(([i, j], k) =>
    frames.push({
      scene: scene(k + 1),
      line: String(p.nested ? 3 : 2),
      say: `count++ runs with ${p.nested ? `i = ${i}, j = ${j}` : `i = ${i}`}.`,
      vars: p.nested ? { n, i, j: j!, count: k + 1 } : { n, i, count: k + 1 },
    }),
  );
  frames.push({
    scene: scene(shown.length),
    line: '1',
    say:
      runs.length > shown.length
        ? `…and so on (${runs.length - shown.length} more not drawn). Total = ${runs.length}. Formula ${p.formulaText} gives ${p.formula(n)} → ${p.big}.`
        : `Loop ends. Total = ${runs.length}. Formula ${p.formulaText} gives ${p.formula(n)} → ${p.big}.`,
    vars: { n, count: runs.length },
    sfx: 'found',
  });
  return frames;
}

function LoopLab() {
  const [id, setId] = useState('double');
  const [nStr, setN] = useState('16');
  const n = Math.max(1, Math.min(64, Math.floor(Number(nStr)) || 1));
  const p = loopById(id);
  const frames = useMemo(() => loopFrames(id, n), [id, n]);
  return (
    <Viz title="Loop lab — watch the counter, then trust the formula" note="Pick a loop pattern and n (1–64). Only the first 64 executions are drawn.">
      <InputBar value={nStr} onChange={setN} label="n">
        <label>
          <span>pattern</span>
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {LOOPS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.code.split('\n')[0]}
                {l.nested ? ' { … }' : ''} — {l.big}
              </option>
            ))}
          </select>
        </label>
      </InputBar>
      <Player frames={frames} codeText={p.code} />
    </Viz>
  );
}

function L2Lesson() {
  return (
    <>
      <Sec title="Performance analysis: space and time">
        <p>
          <b>Space complexity</b> of a program P is the memory it needs to run to completion. Horowitz &amp; Sahni split it into a fixed part and a
          variable part:
        </p>
        <F>S(P) = c + S_P(I)</F>
        <p>
          <i>c</i> is the fixed part — instruction space, simple variables, constants — independent of the instance. <i>S_P(I)</i> is the variable part that
          depends on instance characteristics <i>I</i> (usually input size <i>n</i>): dynamically allocated arrays, and the recursion stack.
        </p>
        <p>
          <b>Time complexity</b> T(P) = compile time + run time. Compile time doesn't depend on the instance, so we analyse only run time, and we do it by{' '}
          <b>counting program steps</b> rather than seconds.
        </p>
      </Sec>
      <Sec title="Step counts (the Horowitz–Sahni method)">
        <p>
          A <b>program step</b> is a syntactically or semantically meaningful segment whose execution time is independent of the instance — e.g. one
          assignment, one comparison, one <code>return</code>. Build a table of <i>steps per execution (s/e)</i> × <i>frequency</i>:
        </p>
        <CodeView
          code={`float sum(float list[], int n) {
    float tempsum = 0;          // s/e 1, freq 1
    int i;                      // declaration: 0 steps
    for (i = 0; i < n; i++)     // s/e 1, freq n+1  (last test fails)
        tempsum += list[i];     // s/e 1, freq n
    return tempsum;             // s/e 1, freq 1
}`}
        />
        <F>Total steps = 1 + (n+1) + n + 1 = 2n + 3</F>
        <p>Two more classic results from the same textbook, worth knowing by heart:</p>
        <Table
          head={['Program', 'Step count', 'Why']}
          rows={[
            ['Iterative sum of n numbers', '2n + 3', 'table above'],
            ['Recursive sum rsum(list, n)', '2n + 2', 'n calls with n>0 each do an if + a return (2 steps); the base call does 2 more'],
            ['Matrix addition, rows × cols', '2·rows·cols + 2·rows + 1', 'outer for: rows+1 · inner for: rows(cols+1) · assignment: rows·cols'],
          ]}
        />
        <Callout kind="tip">
          <p>
            Fewer steps doesn't always mean faster: rsum has fewer steps (2n+2) than sum (2n+3), but each recursive step costs a function call and stack
            space (S = Θ(n) for the recursion stack). Step counts compare <i>growth</i>, not exact seconds.
          </p>
        </Callout>
      </Sec>
      <Sec title="Best, worst and average step counts">
        <ul>
          <li>
            <b>Best case</b>: the minimum number of steps over all inputs of size n (linear search finds the key at index 0: 1 comparison).
          </li>
          <li>
            <b>Worst case</b>: the maximum (key absent: n comparisons).
          </li>
          <li>
            <b>Average case</b>: the expected number over a stated distribution of inputs (key equally likely at each position: (n+1)/2 comparisons).
          </li>
        </ul>
        <p>Exams default to the worst case unless asked otherwise, because it is a guarantee.</p>
      </Sec>
      <Sec title="Counting loops — the patterns you'll meet everywhere">
        <Table
          head={['Loop', 'Executions of the body', 'Order']}
          rows={LOOPS.map((l) => [<code key={l.id}>{l.code.replace(/\n\s*/g, ' ')}</code>, l.formulaText, l.big])}
        />
        <ul>
          <li>Additive step (i += k): about n/k iterations → linear.</li>
          <li>Multiplicative step (i *= k or i /= k): about log_k n iterations → logarithmic.</li>
          <li>Independent nested loops multiply; dependent ones (j ≤ i) need a sum: Σᵢ i = n(n+1)/2.</li>
          <li>
            <code>j += i</code> inside <code>i = 1..n</code> gives n/1 + n/2 + … + n/n = n·Hₙ ≈ n ln n — the harmonic series.
          </li>
        </ul>
      </Sec>
      <LoopLab />
      <Sec title="Time–space trade-off">
        <p>
          Often you can buy time with memory or memory with time. Examples: storing precomputed results (a lookup table of factorials, prefix sums for O(1)
          range sums) uses Θ(n) extra space to make queries O(1); a hash table spends memory on empty slots to search in expected O(1) instead of O(log n);
          compressing data saves space but costs time to decompress. Choosing the data structure is mostly choosing where you sit on this trade-off.
        </p>
      </Sec>
      <Callout kind="daa">
        <p>
          Your DAA deck's "for loops type" slides are exactly these patterns. Next level turns these counts into asymptotic notation — 2n+3 becomes Θ(n).
        </p>
      </Callout>
    </>
  );
}

const BIG_CLASSES = ['Θ(1)', 'Θ(log log n)', 'Θ(log n)', 'Θ(√n)', 'Θ(n)', 'Θ(n log n)', 'Θ(n²)', 'Θ(2ⁿ)'];

const loopCountQ: QGen = (rng) => {
  const p = rng.pick(LOOPS);
  const n = p.nested ? rng.int(4, 20) : p.id === 'loglog' ? rng.pick([16, 100, 256, 300, 65536, 70000]) : rng.int(10, 200);
  const c = countOf(p, n);
  return num(`How many times does \`count++\` execute when n = ${n}?`, c, `It runs ${c} times. Closed form: ${p.formulaText} at n = ${n} gives ${p.formula(n)}.`, { code: p.code });
};
const loopBigQ: QGen = (rng) => {
  const p = rng.pick(LOOPS);
  return mcq('What is the time complexity of this fragment, as a function of n?', p.big, rng.shuffle(BIG_CLASSES.filter((b) => b !== p.big)).slice(0, 3), `Body executes ${p.formulaText} times, which is ${p.big}.`, { code: p.code });
};
const stepQ: QGen = (rng) => {
  const k = rng.int(0, 2);
  if (k === 0) {
    const n = rng.int(3, 60);
    return num(`Using the Horowitz–Sahni step-count table, how many steps does the iterative \`sum(list, n)\` execute for n = ${n}?`, 2 * n + 3, `2n + 3 = ${2 * n + 3}: 1 (tempsum=0) + (n+1) loop tests + n additions + 1 return.`);
  }
  if (k === 1) {
    const n = rng.int(3, 60);
    return num(`How many steps does the recursive \`rsum(list, n)\` take for n = ${n} (H–S step count)?`, 2 * n + 2, `2n + 2 = ${2 * n + 2}: each of the n calls with n>0 does 2 steps (if, return) and the base call does 2.`);
  }
  const r = rng.int(2, 9);
  const c = rng.int(2, 9);
  return num(`Step count of matrix addition for a ${r} × ${c} matrix (rows = ${r}, cols = ${c})?`, 2 * r * c + 2 * r + 1, `2·rows·cols + 2·rows + 1 = ${2 * r * c + 2 * r + 1}.`);
};
const L2_BANK = [
  mcq('In S(P) = c + S_P(I), the term S_P(I) is…', 'the variable part that depends on instance characteristics', ['the fixed instruction space', 'the compile time', 'the number of constants'], 'c is the fixed part; S_P(I) varies with the instance (e.g. recursion stack, dynamic arrays).'),
  mcq('Why does recursive rsum need Θ(n) space while iterative sum needs O(1) extra?', 'Each pending recursive call keeps a stack frame', ['It copies the array', 'It uses a lookup table', 'Recursion doubles the input'], 'n+1 calls are on the stack at the deepest point.'),
  mcq('Linear search for a key that is absent from an n-element array makes how many key comparisons?', 'n', ['1', 'n/2', 'log₂ n'], 'Every element is compared once: that is the worst case.'),
  mcq('Linear search average comparisons when the key is present and equally likely to be at any position?', '(n+1)/2', ['n', 'n/2 − 1', 'log₂ n'], 'Average of 1, 2, …, n is (n+1)/2.'),
  mcq('Which is a time–space trade-off?', 'Storing prefix sums to answer range-sum queries in O(1)', ['Using bubble sort instead of insertion sort', 'Writing code in C instead of Python', 'Removing comments'], 'Θ(n) extra memory buys constant-time queries.'),
  mcq('Which counts as one program step in H–S analysis?', 'An assignment like x = y + z', ['A whole for loop', 'A function call including its body', 'Sorting an array'], 'A step\'s cost must be independent of the instance; a loop or a call depends on n.'),
  tf('Time complexity analysis usually ignores compile time.', true, 'Compile time doesn\'t depend on the instance characteristics, so we study run time.'),
  tf('The loop `for (i = 1; i <= n; i *= 2)` runs Θ(n) times.', false, 'i doubles: 1, 2, 4, … ≤ n → ⌊log₂ n⌋ + 1 iterations = Θ(log n).'),
];

const L2: Level = {
  id: 'L02',
  n: 2,
  world: 1,
  title: 'Step Counts & Loop Analysis',
  blurb: 'Measure algorithms without a stopwatch: space S(P) = c + S_P(I), step-count tables, best/worst/average cases, and every common loop pattern.',
  syllabus: ['DS U1 · Complexity, time–space trade-off', 'DAA U1 · Run-time analysis'],
  snippets: [],
  Lesson: L2Lesson,
  quiz: [loopCountQ, loopCountQ, loopBigQ, loopBigQ, stepQ, bank(L2_BANK), bank(L2_BANK)],
  cards: [
    { q: 'Step count of iterative sum (H–S)?', a: '2n + 3' },
    { q: 'Step count of recursive rsum (H–S)?', a: '2n + 2' },
    { q: 'Step count of rows×cols matrix addition?', a: '2·rows·cols + 2·rows + 1' },
    { q: 'for (i=1; i<=n; i++) for (j=1; j<=i; j++) — how many inner executions?', a: 'n(n+1)/2 → Θ(n²)' },
    { q: 'for (i=1; i<=n; i++) for (j=i; j<=n; j+=i)?', a: 'Σ n/i ≈ n·Hₙ → Θ(n log n)' },
  ],
  refs: [
    'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Performance analysis (space complexity, step counts: sum 2n+3, rsum 2n+2, add 2·rows·cols+2·rows+1).',
    'Your DAA decks "2. for loops type" and "3. asymptotic analysis" (best/worst/average step counts).',
  ],
};

/* =====================================================================
   Level 3 — Asymptotic notation and growth of functions
   ===================================================================== */

interface GrowthFn {
  name: string;
  rank: number;
  f: (n: number) => number; // natural log of the value (log scale plot)
}
const ln = Math.log;
const lnFact = (n: number) => {
  let s = 0;
  for (let i = 2; i <= n; i++) s += ln(i);
  return s;
};
/** Same rank = same Θ class. Values are ln(f(n)) so the plot can use a log scale. */
const GROWTH: GrowthFn[] = [
  { name: '1', rank: 0, f: () => 0 },
  { name: 'log log n', rank: 1, f: (n) => ln(Math.max(1e-9, Math.log2(Math.max(2, Math.log2(n))))) },
  { name: 'log n', rank: 2, f: (n) => ln(Math.max(1e-9, Math.log2(n))) },
  { name: 'ln n', rank: 2, f: (n) => ln(Math.max(1e-9, ln(n))) },
  { name: 'log² n', rank: 3, f: (n) => 2 * ln(Math.max(1e-9, Math.log2(n))) },
  { name: '√n', rank: 4, f: (n) => 0.5 * ln(n) },
  { name: 'n', rank: 5, f: (n) => ln(n) },
  { name: '2^(log₂ n)', rank: 5, f: (n) => ln(n) },
  { name: 'n log n', rank: 6, f: (n) => ln(n) + ln(Math.max(1e-9, Math.log2(n))) },
  { name: 'log(n!)', rank: 6, f: (n) => ln(Math.max(1e-9, lnFact(n) / ln(2))) },
  { name: 'n²', rank: 7, f: (n) => 2 * ln(n) },
  { name: 'n³', rank: 8, f: (n) => 3 * ln(n) },
  { name: '2ⁿ', rank: 9, f: (n) => n * ln(2) },
  { name: '3ⁿ', rank: 10, f: (n) => n * ln(3) },
  { name: 'n!', rank: 11, f: (n) => lnFact(n) },
  { name: 'nⁿ', rank: 12, f: (n) => n * ln(n) },
];

const PLOT_F: Record<string, (n: number) => number> = {
  '3n² + 5n + 2': (n) => 3 * n * n + 5 * n + 2,
  '1000n² + 100n − 6': (n) => 1000 * n * n + 100 * n - 6,
  'n log₂ n': (n) => n * Math.log2(n),
  '2ⁿ': (n) => 2 ** n,
  '5n + 7': (n) => 5 * n + 7,
};
const PLOT_G: Record<string, (n: number) => number> = { n: (n) => n, 'n log₂ n': (n) => n * Math.log2(n), 'n²': (n) => n * n, 'n³': (n) => n ** 3, '2ⁿ': (n) => 2 ** n };

function BoundPlot() {
  const [fk, setF] = useState('1000n² + 100n − 6');
  const [gk, setG] = useState('n²');
  const [c, setC] = useState(1001);
  const [n0, setN0] = useState(100);
  const N = 160;
  const f = PLOT_F[fk];
  const g = PLOT_G[gk];
  const xs = Array.from({ length: N }, (_, i) => i + 1);
  let firstBad: number | null = null;
  for (let n = n0; n <= N; n++) if (f(n) > c * g(n)) {
    firstBad = n;
    break;
  }
  const W = 640, H = 260, P = 36;
  const ys = xs.flatMap((n) => [f(n), c * g(n)]).filter((v) => v > 0);
  const lo = Math.log10(Math.min(...ys));
  const hi = Math.log10(Math.max(...ys));
  const X = (n: number) => P + ((n - 1) / (N - 1)) * (W - 2 * P);
  const Y = (v: number) => H - P - ((Math.log10(Math.max(v, 1e-9)) - lo) / Math.max(1e-9, hi - lo)) * (H - 2 * P);
  const path = (fn: (n: number) => number) => xs.map((n, i) => `${i ? 'L' : 'M'}${X(n).toFixed(1)},${Y(fn(n)).toFixed(1)}`).join(' ');
  return (
    <Viz title="Find c and n₀ — is f(n) ≤ c·g(n) for all n ≥ n₀?" note="Log-scale y-axis, n = 1…160. A plot only checks finitely many n — a proof must cover all n ≥ n₀.">
      <div className="inputbar">
        <label>
          <span>f(n)</span>
          <select value={fk} onChange={(e) => setF(e.target.value)}>
            {Object.keys(PLOT_F).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          <span>g(n)</span>
          <select value={gk} onChange={(e) => setG(e.target.value)}>
            {Object.keys(PLOT_G).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          <span>c = {c}</span>
          <input type="range" min={1} max={2000} value={c} onChange={(e) => setC(+e.target.value)} />
        </label>
        <label>
          <span>n₀ = {n0}</span>
          <input type="range" min={1} max={150} value={n0} onChange={(e) => setN0(+e.target.value)} />
        </label>
      </div>
      <div className="stage-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="stage" role="img" aria-label={`Plot of f(n)=${fk} and c·g(n) with c=${c}`}>
          <rect x={P} y={P / 2} width={X(n0) - P} height={H - 1.5 * P} fill="var(--surface3)" opacity={0.5} />
          <line x1={X(n0)} x2={X(n0)} y1={P / 2} y2={H - P} stroke="var(--accent)" strokeDasharray="4 4" />
          <text x={X(n0) + 4} y={P / 2 + 12} fill="var(--accent)" fontSize={12}>
            n₀
          </text>
          <path d={path((n) => c * g(n))} fill="none" stroke="var(--teal)" strokeWidth={2.5} />
          <path d={path(f)} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
          <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="var(--line)" />
          <text x={W - P} y={H - 10} textAnchor="end" fill="var(--muted)" fontSize={12}>
            n →
          </text>
          <text x={P + 6} y={H - P - 8} fill="var(--accent)" fontSize={13}>
            f(n)
          </text>
          <text x={W - P - 6} y={Y(c * g(N)) - 6} textAnchor="end" fill="var(--teal)" fontSize={13}>
            c·g(n)
          </text>
        </svg>
      </div>
      <p className="say">
        {firstBad === null ? (
          <span style={{ color: 'var(--green)' }}>
            ✓ For every plotted n from {n0} to {N}, f(n) ≤ {c}·g(n). These constants are a candidate witness for f(n) = O(g(n)).
          </span>
        ) : (
          <span style={{ color: 'var(--coral)' }}>
            ✗ Fails at n = {firstBad}: f = {f(firstBad).toExponential(3)} &gt; c·g = {(c * g(firstBad)).toExponential(3)}. Raise c or n₀ — or g is simply too
            small.
          </span>
        )}
      </p>
    </Viz>
  );
}

function L3Lesson() {
  return (
    <>
      <Sec title="Why asymptotic notation">
        <p>
          Exact step counts like 2n + 3 are tedious and the constants aren't meaningful across machines. What matters is how cost <b>grows</b> as n becomes
          large. Asymptotic notation keeps the growth rate and discards constant factors and lower-order terms.
        </p>
      </Sec>
      <Sec title="The five notations — memorise the quantifiers">
        <Table
          head={['Notation', 'Definition', 'Read as']}
          rows={[
            ['f(n) = O(g(n))', '∃ c > 0, n₀ such that f(n) ≤ c·g(n) for all n ≥ n₀', 'upper bound ("at most")'],
            ['f(n) = Ω(g(n))', '∃ c > 0, n₀ such that f(n) ≥ c·g(n) for all n ≥ n₀', 'lower bound ("at least")'],
            ['f(n) = Θ(g(n))', '∃ c₁, c₂ > 0, n₀ such that c₁·g(n) ≤ f(n) ≤ c₂·g(n) for all n ≥ n₀', 'tight bound'],
            ['f(n) = o(g(n))', '∀ c > 0 ∃ n₀ such that f(n) < c·g(n) for all n ≥ n₀', 'strictly smaller growth'],
            ['f(n) = ω(g(n))', '∀ c > 0 ∃ n₀ such that f(n) > c·g(n) for all n ≥ n₀', 'strictly larger growth'],
          ]}
        />
        <Callout kind="errata">
          <p>
            Your <code>3. asymptotic analysis</code> slide defines small-o and small-omega with "there exist positive constants c, n₀". That's the definition of{' '}
            <b>O</b> and <b>Ω</b> with a strict inequality — not little-o. Little-o must hold for <b>every</b> c &gt; 0 (with n₀ allowed to depend on c).
            Counter-example to the slide's version: f(n) = n, g(n) = n. With c = 2, n &lt; 2n for all n ≥ 1, so the slide would call n = o(n) — which is false,
            since n/n → 1 ≠ 0.
          </p>
        </Callout>
        <p>
          Equivalent limit test (when the limit exists): L = lim<sub>n→∞</sub> f(n)/g(n).
        </p>
        <Table
          head={['L', 'Conclusion']}
          rows={[
            ['0', 'f = o(g) (hence also O(g))'],
            ['0 < L < ∞', 'f = Θ(g)'],
            ['∞', 'f = ω(g) (hence also Ω(g))'],
          ]}
        />
      </Sec>
      <Sec title="Worked example from Horowitz–Sahni">
        <p>Claim: 1000n² + 100n − 6 = O(n²).</p>
        <F>1000n² + 100n − 6 ≤ 1001·n²  ⇔  n² − 100n + 6 ≥ 0  ⇔  n ≥ 100 (for integers n ≥ 1)</F>
        <p>
          So c = 1001, n₀ = 100 works. (Other pairs work too: e.g. c = 1100, n₀ = 1, since 100n ≤ 100n² for n ≥ 1.) Try both in the plot below.
        </p>
        <Callout kind="pitfall">
          <p>
            The text extracted from your slide reads "for n &gt; 10" — check it against your copy. With c = 1001 the inequality <b>fails</b> at n = 11 (1094 &gt; 121
            in the reduced form), so n₀ = 10 is wrong for c = 1001; the textbook value is n₀ = 100.
          </p>
        </Callout>
      </Sec>
      <BoundPlot />
      <Sec title="Properties">
        <Table
          head={['Notation', 'Reflexive', 'Symmetric', 'Transitive']}
          rows={[
            ['O', 'yes', 'no', 'yes'],
            ['Ω', 'yes', 'no', 'yes'],
            ['Θ', 'yes', 'yes', 'yes'],
            ['o, ω', 'no', 'no', 'yes'],
          ]}
          caption="Matches your deck '4. properties of notations', plus little-o/ω."
        />
        <ul>
          <li>
            <b>Transpose symmetry</b>: f = O(g) ⇔ g = Ω(f); f = o(g) ⇔ g = ω(f).
          </li>
          <li>
            f = Θ(g) ⇔ f = O(g) and f = Ω(g).
          </li>
          <li>
            Sum rule: O(f) + O(g) = O(max(f, g)). Product rule: O(f)·O(g) = O(f·g).
          </li>
          <li>
            Polynomial: a<sub>k</sub>n<sup>k</sup> + … + a<sub>0</sub> with a<sub>k</sub> &gt; 0 is Θ(n<sup>k</sup>).
          </li>
          <li>Log bases don't matter inside Θ: log_a n = log_b n / log_b a — a constant factor apart.</li>
          <li>Exponential bases do matter: 3ⁿ ≠ O(2ⁿ), since (3/2)ⁿ → ∞. Also 2^(2n) = 4ⁿ ≠ O(2ⁿ), but 2^(n+1) = 2·2ⁿ = Θ(2ⁿ).</li>
        </ul>
      </Sec>
      <Sec title="Growth of functions — the ladder">
        <F>1 &lt; log log n &lt; log n &lt; log² n &lt; √n &lt; n &lt; n log n &lt; n² &lt; n³ &lt; 2ⁿ &lt; 3ⁿ &lt; n! &lt; nⁿ</F>
        <ul>
          <li>Any power of log is beaten by any positive power of n: (log n)^k = o(n^ε) for every k and ε &gt; 0.</li>
          <li>Any polynomial is beaten by any exponential: n^k = o(aⁿ) for a &gt; 1.</li>
          <li>
            log(n!) = Θ(n log n) (Stirling; your Recurrence deck uses n! ≤ nⁿ ⇒ log n! ≤ n log n for the upper half). And 2^(log₂ n) = n.
          </li>
        </ul>
      </Sec>
      <Callout kind="exam">
        <p>
          Expect: prove f = O(g) by exhibiting c and n₀; arrange functions in increasing order; true/false on notation properties; the limit test.
        </p>
      </Callout>
    </>
  );
}

const orderQ: QGen = (rng) => {
  const ranks = rng.shuffle([...new Set(GROWTH.map((g) => g.rank))]).slice(0, 4);
  const fs = ranks.map((r) => rng.pick(GROWTH.filter((g) => g.rank === r)));
  const sorted = [...fs].sort((a, b) => a.rank - b.rank).map((f) => f.name);
  const fmt = (xs: string[]) => xs.join('  <  ');
  const wrong: string[] = [];
  let guard = 0;
  while (wrong.length < 3 && guard++ < 50) {
    const w = fmt(rng.shuffle(sorted));
    if (w !== fmt(sorted) && !wrong.includes(w)) wrong.push(w);
  }
  return mcq(`Arrange in increasing order of growth: ${rng.shuffle(sorted).join(', ')}`, fmt(sorted), wrong, `Ladder: 1 < log log n < log n < log² n < √n < n < n log n < n² < n³ < 2ⁿ < 3ⁿ < n! < nⁿ.`);
};
const relQ: QGen = (rng) => {
  const a = rng.pick(GROWTH);
  let b = rng.pick(GROWTH);
  if (a.name === b.name) b = GROWTH[(GROWTH.indexOf(a) + 3) % GROWTH.length];
  const rel = a.rank === b.rank ? 'f = Θ(g)' : a.rank < b.rank ? 'f = o(g)' : 'f = ω(g)';
  return mcq(`Let f(n) = ${a.name} and g(n) = ${b.name}. Which is true?`, rel, ['f = Θ(g)', 'f = o(g)', 'f = ω(g)'].filter((x) => x !== rel), `${a.name} is ${a.rank === b.rank ? 'in the same class as' : a.rank < b.rank ? 'strictly slower-growing than' : 'strictly faster-growing than'} ${b.name}.`);
};
const witnessQ: QGen = (rng) => {
  const A = rng.int(1, 9);
  const B = rng.int(1, 20); // B ≥ 1 so f(n)/n² > A and an invalid integer c always exists
  const D = rng.int(0, 30);
  const fn = (n: number) => A * n * n + B * n + D;
  // f(n)/n² = A + B/n + D/n² is non-increasing for n ≥ 1, so (c, n0) works iff c·n0² ≥ f(n0)
  const ok = (c: number, n0: number) => c * n0 * n0 >= fn(n0);
  const need = (n0: number) => Math.ceil(fn(n0) / (n0 * n0));
  const n0s = rng.shuffle([1, 2, 3, 4, 5, 6, 8, 10]);
  const good: [number, number] = [need(n0s[0]) + rng.int(0, 3), n0s[0]];
  const bad: [number, number][] = n0s.slice(1, 4).map((n0) => [need(n0) - 1, n0]);
  const show = ([c, n0]: [number, number]) => `c = ${c}, n₀ = ${n0}`;
  const f = `${A}n² + ${B}n${D ? ` + ${D}` : ''}`;
  return mcq(
    `To show f(n) = ${f} is O(n²), which pair (c, n₀) is a valid witness, i.e. f(n) ≤ c·n² for all n ≥ n₀?`,
    show(good),
    bad.filter(([c, n0]) => !ok(c, n0)).map(show),
    `f(n)/n² = ${A} + ${B}/n${D ? ` + ${D}/n²` : ''} only decreases as n grows, so a pair works exactly when c ≥ f(n₀)/n₀². For ${show(good)}: f(${good[1]}) = ${fn(good[1])} ≤ ${good[0]}·${good[1]}² = ${good[0] * good[1] * good[1]}.`,
  );
};
const L3_BANK = [
  tf('2^(n+1) = O(2ⁿ).', true, '2^(n+1) = 2·2ⁿ: a constant factor of 2.'),
  tf('2^(2n) = O(2ⁿ).', false, '2^(2n) = 4ⁿ, and 4ⁿ/2ⁿ = 2ⁿ → ∞.'),
  tf('n! = O(nⁿ).', true, 'n! = 1·2·…·n ≤ n·n·…·n = nⁿ.'),
  tf('log(n!) = Θ(n log n).', true, 'Upper: log n! ≤ n log n. Lower: the top half of the factors are ≥ n/2, so log n! ≥ (n/2) log(n/2).'),
  tf('n² = o(n²).', false, 'n²/n² → 1, not 0. A function is never little-o of itself.'),
  tf('n = o(n log n).', true, 'n/(n log n) = 1/log n → 0.'),
  tf('3ⁿ = O(2ⁿ).', false, '(3/2)ⁿ grows without bound.'),
  tf('log₂ n = Θ(log₁₀ n).', true, 'They differ by the constant factor log₂ 10.'),
  tf('√n = O(log² n).', false, 'Every positive power of n eventually beats every power of log n.'),
  tf('n log n = O(n^1.5).', true, 'log n = o(√n).'),
  tf('(log n)^100 = O(n^0.01).', true, 'Polylogs are o(n^ε) for every ε > 0 — even if the crossover n is astronomically large.'),
  tf('If f = O(g) then g = O(f).', false, 'O is not symmetric: n = O(n²) but n² ≠ O(n).'),
  tf('If f = O(g) then g = Ω(f).', true, 'Transpose symmetry.'),
  tf('Θ is symmetric: f = Θ(g) ⇔ g = Θ(f).', true, 'Swap the roles of c₁ and c₂ (inverted).'),
  mcq('The correct definition of f(n) = o(g(n)) is…', 'for every c > 0 there exists n₀ with f(n) < c·g(n) for all n ≥ n₀', ['there exist c > 0 and n₀ with f(n) < c·g(n) for all n ≥ n₀', 'there exist c > 0 and n₀ with f(n) ≤ c·g(n) for all n ≥ n₀', 'for every n₀ there exists c with f(n) < c·g(n)'], 'Little-o quantifies over every c. The "there exists c" version is just O with a strict inequality.'),
  mcq('lim f(n)/g(n) = 5 as n → ∞. Then…', 'f = Θ(g)', ['f = o(g)', 'f = ω(g)', 'nothing can be concluded'], 'A finite positive limit means same growth rate.'),
  mcq('lim f(n)/g(n) = 0 as n → ∞. Then…', 'f = o(g)', ['f = Θ(g)', 'f = ω(g)', 'f = Ω(g)'], 'Limit 0: f grows strictly slower.'),
  mcq('Which property does O NOT have?', 'Symmetry', ['Reflexivity', 'Transitivity', 'It has all three'], 'Your deck\'s table: O is reflexive and transitive but not symmetric.'),
  mcq('O(f(n)) + O(g(n)) equals…', 'O(max(f(n), g(n)))', ['O(f(n)·g(n))', 'O(f(n) + g(n)²)', 'O(min(f(n), g(n)))'], 'The larger term dominates a sum.'),
  mcq('Big-O gives a…', 'upper bound', ['lower bound', 'tight bound', 'average'], 'Ω is the lower bound, Θ the tight bound.'),
];

const L3: Level = {
  id: 'L03',
  n: 3,
  world: 1,
  title: 'Asymptotic Notation',
  blurb: 'O, Ω, Θ, o and ω with the exact quantifiers, finding c and n₀, the limit test, properties, and the growth ladder from 1 to nⁿ.',
  syllabus: ['DAA U1 · Asymptotic notations', 'DAA U1 · Growth of functions', 'DS U1 · Complexity'],
  snippets: [],
  Lesson: L3Lesson,
  quiz: [orderQ, orderQ, relQ, relQ, witnessQ, bank(L3_BANK), bank(L3_BANK), bank(L3_BANK)],
  cards: [
    { q: 'Definition of f = O(g)?', a: '∃ c > 0, n₀ : f(n) ≤ c·g(n) ∀ n ≥ n₀.' },
    { q: 'Definition of f = o(g)?', a: '∀ c > 0 ∃ n₀ : f(n) < c·g(n) ∀ n ≥ n₀ (limit f/g = 0).' },
    { q: 'Witness for 1000n² + 100n − 6 = O(n²) (H–S)?', a: 'c = 1001, n₀ = 100.' },
    { q: 'Growth ladder?', a: '1 < log log n < log n < log² n < √n < n < n log n < n² < n³ < 2ⁿ < 3ⁿ < n! < nⁿ' },
    { q: 'Is 2^(2n) = O(2ⁿ)?', a: 'No — it is 4ⁿ. But 2^(n+1) = Θ(2ⁿ).' },
  ],
  refs: [
    'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Asymptotic notation (O, Ω, Θ; example 1000n²+100n−6 ≤ 1001n² for n ≥ 100).',
    'Cormen, Leiserson, Rivest, Stein, Introduction to Algorithms, 3e — §3.1 (o and ω defined "for any positive constant c").',
    'Your DAA decks "3. asymptotic analysis" and "4. properties of notations".',
  ],
};

export default [L1, L2, L3];
