import type { Level, QGen } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, nums, int } from '../core/vizkit';
import { mcq, num, seq, tf, bank } from '../core/qhelp';
import * as BT from '../engines/bt';
import type { Rng } from '../core/rng';

const readItems = (s: string) => {
  const ps = s.split(/[,;]+/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = /^(\d+)\s*[/:\s]\s*(\d+)$/.exec(p);
    if (!m || +m[1] < 1) throw new Error(`"${p}": write weight/value with weight ≥ 1.`);
    return [+m[1], +m[2]];
  });
  if (!ps.length || ps.length > 5) throw new Error('Give 1–5 items (the tree doubles with each item).');
  return { wt: ps.map((p) => p[0]), val: ps.map((p) => p[1]) };
};

/* =====================================================================
   Level 57 — Backtracking & N-Queens
   ===================================================================== */

function L57Lesson() {
  return (
    <>
      <Sec title="Backtracking">
        <p>
          Many problems ask for vectors (x₁, …, xₙ) chosen from finite sets that satisfy constraints. Brute force tries all combinations. <b>Backtracking</b> builds
          the vector one component at a time and abandons a partial vector as soon as it cannot possibly be completed to a solution — pruning whole subtrees of the{' '}
          <b>state-space tree</b>.
        </p>
        <Table
          head={['Term (Sahni)', 'Meaning']}
          rows={[
            ['Explicit constraints', 'the set each xᵢ is drawn from (e.g. column 1…n)'],
            ['Implicit constraints', 'relations the xᵢ must satisfy together (no two queens attack)'],
            ['State-space tree', 'every node is a partial vector; edges choose the next xᵢ'],
            ['Bounding function', 'a test that says "no solution below this node" — kill it'],
            ['Live / E-node / dead', 'not yet fully explored / being expanded / killed or finished'],
          ]}
        />
        <p>Backtracking explores the tree depth-first (an E-node's children are generated one at a time, recursively).</p>
      </Sec>
      <Sec title="N-Queens (Lab Experiment 15)">
        <p>
          Place n queens on an n×n board so none attack each other. One queen per row, so x[k] is the column of row k's queen (explicit constraint). Implicit
          constraints: different columns, and different diagonals: |x[i] − x[k]| ≠ |i − k|.
        </p>
        <Code id="n_queens" />
        <p>Number of solutions for n = 1…8: 1, 0, 0, 2, 10, 4, 40, 92. The 8-queens state space has 8⁸ ≈ 16.7 million leaves; backtracking visits only a few thousand nodes.</p>
      </Sec>
      <AlgoViz title="Backtracking N-Queens" fields={[{ name: 'n', label: 'n (4–8)', initial: '4', width: 80 }]} build={(v) => BT.queensFrames(int(v.n, 'n', 1, 8))} code="n_queens" />
    </>
  );
}

function L57Practice() {
  return <AlgoViz title="Predict each queen's column" fields={[{ name: 'n', label: 'n', initial: '5', width: 70 }]} build={(v) => BT.queensFrames(int(v.n, 'n', 4, 7), 1, true)} code="n_queens" predict />;
}

const queensQ: QGen = (rng) => {
  const k = rng.int(0, 2);
  if (k === 0) {
    const n = rng.int(4, 8);
    return num(`How many solutions does the ${n}-queens problem have?`, BT.nQueens(n).length, 'Known counts: 1, 0, 0, 2, 10, 4, 40, 92 for n = 1…8.');
  }
  if (k === 1) {
    const n = rng.int(4, 6);
    return seq(`Backtracking (rows top to bottom, columns tried 0, 1, 2, …): first solution of the ${n}-queens problem as x = (column per row, 0-based)?`, BT.nQueens(n)[0], `First solution: ${BT.nQueens(n)[0].join(', ')}.`);
  }
  const r1 = rng.int(0, 6);
  const c1 = rng.int(0, 7);
  let r2 = rng.int(0, 7);
  if (r2 === r1) r2 = (r1 + 1) % 8;
  const c2 = rng.int(0, 7);
  const attack = c1 === c2 || Math.abs(c1 - c2) === Math.abs(r1 - r2);
  return mcq(`Queens at (row ${r1}, col ${c1}) and (row ${r2}, col ${c2}) — do they attack each other?`, attack ? 'Yes' : 'No', [attack ? 'No' : 'Yes'], c1 === c2 ? 'Same column.' : Math.abs(c1 - c2) === Math.abs(r1 - r2) ? `|Δcol| = |Δrow| = ${Math.abs(r1 - r2)}: same diagonal.` : 'Different columns and |Δcol| ≠ |Δrow|.');
};
const L57_BANK = [
  mcq('Two queens at (i, x[i]) and (k, x[k]) are on the same diagonal iff…', '|x[i] − x[k]| = |i − k|', ['x[i] = x[k]', 'i + k = x[i]', 'x[i] + x[k] = n'], 'Equal row and column distance.'),
  mcq('Backtracking explores the state-space tree…', 'depth-first, pruning with a bounding function', ['breadth-first only', 'randomly', 'by sorting nodes'], 'One child at a time, recursively.'),
  mcq('In N-Queens with one queen per row, "x[k] ∈ {0, …, n−1}" is an…', 'explicit constraint', ['implicit constraint', 'objective function', 'bounding function'], 'It defines the solution space.'),
  mcq('Number of solutions of the 8-queens problem?', '92', ['8', '12', '64'], '12 if rotations/reflections are counted as one.'),
  mcq('A node whose subtree cannot contain a solution is…', 'killed (it becomes dead)', ['expanded', 'an answer node', 'a live node'], 'Bounding at work.'),
  tf('The 2-queens and 3-queens problems have no solution.', true, 'Counts are 0 for n = 2 and 3.'),
];

const L57: Level = {
  id: 'L57',
  n: 57,
  world: 12,
  title: 'Backtracking & N-Queens',
  blurb: 'State-space trees, explicit vs implicit constraints, bounding functions, and the N-Queens problem solved by backtracking (Lab Experiment 15).',
  syllabus: ['DAA U4 · Backtracking: overview, 8-queen problem'],
  snippets: ['n_queens'],
  Lesson: L57Lesson,
  Practice: L57Practice,
  quiz: [queensQ, queensQ, queensQ, queensQ, bank(L57_BANK), bank(L57_BANK), bank(L57_BANK)],
  cards: [{ q: 'place(x, k, c) test?', a: 'For every earlier row i: x[i] ≠ c and |x[i] − c| ≠ |i − k|.' }],
  refs: ['Horowitz, Sahni & Rajasekaran, Computer Algorithms — chapter "Backtracking" (general method, n-queens).', 'DAA Lab Manual — Experiment 15.'],
};

/* =====================================================================
   Level 58 — Sum of subsets & knapsack by backtracking
   ===================================================================== */

function L58Lesson() {
  return (
    <>
      <Sec title="Sum of subsets">
        <p>
          Given positive weights w₁ ≤ w₂ ≤ … ≤ wₙ (sorted) and a target m, find every subset summing to m. Solution vector: xᵢ ∈ {'{'}0, 1{'}'} (fixed-size tuples).
          Sahni's bounding conditions at level k (s = chosen sum, r = remaining sum):
        </p>
        <F>keep a node only if  s + r ≥ m  (enough weight remains)  and  s + w[k+1] ≤ m  (the next weight still fits)</F>
        <Code id="sum_of_subsets" />
        <p>Sahni's example: w = (5, 10, 12, 13, 15, 18), m = 30 gives (1,1,0,0,1), (1,0,1,1) and (0,0,1,0,0,1) — 5+10+15, 5+12+13 and 12+18.</p>
      </Sec>
      <AlgoViz
        title="Sum-of-subsets state-space tree"
        fields={[
          { name: 'w', label: 'weights (ascending)', initial: '5, 10, 12, 13, 15, 18', width: 260 },
          { name: 'm', label: 'target m', initial: '30', width: 90 },
        ]}
        build={(v) => {
          const w = nums(v.w, { min: 1, max: 99, maxLen: 7 });
          for (let i = 1; i < w.length; i++) if (w[i] < w[i - 1]) throw new Error('Weights must be in ascending order.');
          return BT.sumOfSubsetsFrames(w, int(v.m, 'm', 1, 300));
        }}
        code="sum_of_subsets"
      />
      <Sec title="0/1 knapsack by backtracking">
        <p>
          Explore x₁, x₂, … (include before exclude). Including is only tried if the item fits; excluding is only tried if the <b>bound</b> — the fractional-greedy
          value obtainable from the remaining items — exceeds the best value found so far. With items sorted by value/weight the bound is a true upper bound, so no
          optimal solution is pruned.
        </p>
        <Code id="knapsack_backtrack" />
      </Sec>
      <AlgoViz
        title="Backtracking knapsack with bounding"
        note="Items as weight/value."
        fields={[
          { name: 'W', label: 'capacity', initial: '10', width: 90 },
          { name: 'it', label: 'items (w/v)', initial: '4/40, 7/42, 5/25, 3/12', width: 260 },
        ]}
        build={(v) => {
          const { wt, val } = readItems(v.it);
          return BT.bknapFrames(int(v.W, 'capacity', 0, 60), wt, val);
        }}
        code="knapsack_backtrack"
      />
    </>
  );
}

const sosQ: QGen = (rng) => {
  for (;;) {
    const w = rng.distinct(rng.int(5, 6), 2, 20).sort((a, b) => a - b);
    const m = rng.int(15, 35);
    const sols = BT.sumOfSubsets(w, m);
    if (!sols.length && rng.chance(0.7)) continue;
    return rng.chance(0.5)
      ? num(`w = (${w.join(', ')}), m = ${m}. How many subsets sum to m?`, sols.length, `Solutions: ${sols.map((s) => `{${w.filter((_, i) => s[i]).join(',')}}`).join(' ') || 'none'}.`)
      : seq(`w = (${w.join(', ')}), m = ${m}. Write the FIRST solution vector found by Sahni's SumOfSub (include before exclude), e.g. 1 0 1 0 0.`, sols.length ? sols[0] : ['none'], sols.length ? `First: ${sols[0].join(' ')} = {${w.filter((_, i) => sols[0][i]).join(', ')}}.` : 'No subset sums to m.');
  }
};
const bkQ: QGen = (rng) => {
  const n = rng.int(3, 5);
  const wt = rng.ints(n, 1, 9);
  const val = rng.ints(n, 5, 40);
  const W = rng.int(6, 20);
  const s = BT.sortByRatio(wt, val);
  const k = rng.int(0, 1);
  if (k === 0) return num(`Knapsack W = ${W}, items (w, v): ${wt.map((w, i) => `(${w}, ${val[i]})`).join(', ')}. Bound used at the root = fractional greedy value? (1 decimal if needed)`, Math.round(BT.fracBound(0, 0, 0, W, s.wt, s.val) * 10) / 10, 'Sort by v/w, fill greedily, take a fraction of the first item that doesn\'t fit.');
  return num(`Knapsack W = ${W}, items (w, v): ${wt.map((w, i) => `(${w}, ${val[i]})`).join(', ')}. Optimal value?`, BT.bknap(W, s.wt, s.val).best, 'Backtracking with bounding finds the optimum.');
};
const L58_BANK = [
  mcq('Sum of subsets requires the weights to be…', 'sorted in non-decreasing order', ['distinct', 'even', 'sorted in decreasing order'], 'The bounding test uses w[k+1] as the smallest remaining weight.'),
  mcq('A sum-of-subsets node is killed when…', 's + r < m or s + w[k+1] > m', ['s < m', 'r = 0 only', 's is odd'], 'Either can\'t reach m, or can\'t take even the smallest next weight.'),
  mcq('Why sort knapsack items by value/weight before backtracking?', 'So the fractional-greedy bound is a valid upper bound', ['To make the tree smaller in all cases', 'To make it a greedy algorithm', 'Required by C++'], 'The bound assumes best items first.'),
  mcq('Worst-case number of nodes in the sum-of-subsets state-space tree for n weights?', '2^(n+1) − 1', ['n²', 'n!', '2n'], 'A full binary tree of depth n.'),
  mcq('Backtracking uses the bound to prune…', 'the exclude branch when it can\'t beat the best found', ['every include branch', 'only leaves', 'nothing'], 'Including keeps the same bound.'),
  tf('Backtracking always runs in polynomial time on knapsack.', false, 'Worst case is exponential; pruning helps in practice.'),
];

const L58: Level = {
  id: 'L58',
  n: 58,
  world: 12,
  title: 'Sum of Subsets & Knapsack (Backtracking)',
  blurb: "Sahni's SumOfSub with its two bounding tests, and 0/1 knapsack by backtracking with a fractional-greedy bound.",
  syllabus: ['DAA U4 · Backtracking: knapsack problem', 'DAA U6 · Subset sum (as an example)'],
  snippets: ['sum_of_subsets', 'knapsack_backtrack'],
  Lesson: L58Lesson,
  quiz: [sosQ, sosQ, sosQ, bkQ, bkQ, bank(L58_BANK), bank(L58_BANK), bank(L58_BANK)],
  cards: [{ q: 'SumOfSub bounding test?', a: 'Explore a node only if s + r ≥ m and s + w[k+1] ≤ m (w sorted ascending).' }],
  refs: ['Horowitz, Sahni & Rajasekaran, Computer Algorithms — "Backtracking": sum of subsets (SumOfSub, w = 5,10,12,13,15,18, m = 30), knapsack (BKnap, Bound).'],
};

/* =====================================================================
   Level 59 — Branch and bound: LC search, bounding, FIFO
   ===================================================================== */

function L59Lesson() {
  return (
    <>
      <Sec title="Branch and bound">
        <p>
          Branch and bound (B&B) also searches a state-space tree with bounding functions, but an E-node generates <b>all</b> its children at once; the children
          join a list of live nodes, and the next E-node is chosen from that list. The selection rule gives the variants:
        </p>
        <Table
          head={['Variant', 'Live-node list', 'Next E-node']}
          rows={[
            ['FIFO B&B', 'queue', 'the oldest live node — breadth-first'],
            ['LIFO B&B (D-search)', 'stack', 'the newest live node'],
            ['LC (least-cost) B&B', 'min-heap on ĉ', 'the live node with the smallest estimated cost ĉ'],
          ]}
        />
      </Sec>
      <Sec title="LC search and the ranking function">
        <p>
          Sahni ranks a live node x by ĉ(x) = f(h(x)) + ĝ(x): h(x) is the cost of reaching x from the root and ĝ(x) estimates the extra cost from x to an answer.
          ĝ = 0 makes LC search breadth-first-like; ignoring h makes it depth-first-like. For minimisation problems with ĉ(x) ≤ c(x) (an optimistic lower bound),
          the first answer node chosen as E-node is optimal. Sahni's illustration is the 15-puzzle, where ĝ = number of misplaced tiles.
        </p>
      </Sec>
      <Sec title="Bounding">
        <p>
          Keep <b>upper</b> = the cost of the best solution known so far (or any feasible solution's cost, Sahni's u(x)). A live node x with lower bound ĉ(x) &gt; upper
          cannot lead to anything better and is killed. Good bounds kill nodes early; FIFO and LC differ only in how quickly they find good solutions.
        </p>
        <Callout kind="convention" title="Maximisation problems">
          <p>
            Sahni writes knapsack as minimising −Σpᵢxᵢ, so ĉ = −(fractional bound) and u = −(greedy feasible value). The game shows the equivalent maximisation form:
            ub = fractional bound, lb = greedy feasible value, best = max lb; kill when ub &lt; best; LC picks the largest ub.
          </p>
        </Callout>
      </Sec>
      <AlgoViz
        title="FIFO branch and bound on a knapsack"
        note="strategy: FIFO, LIFO or LC. Items as weight/value."
        fields={[
          { name: 's', label: 'strategy', initial: 'FIFO', width: 90 },
          { name: 'W', label: 'capacity', initial: '15', width: 90 },
          { name: 'it', label: 'items (w/v)', initial: '2/10, 4/10, 6/12, 9/18', width: 260 },
        ]}
        build={(v) => {
          const st = v.s.trim().toUpperCase();
          if (st !== 'FIFO' && st !== 'LIFO' && st !== 'LC') throw new Error('strategy must be FIFO, LIFO or LC');
          const { wt, val } = readItems(v.it);
          const s = BT.sortByRatio(wt, val);
          return BT.branchAndBound(int(v.W, 'capacity', 0, 60), s.wt, s.val, st, true).frames;
        }}
      />
    </>
  );
}

const randItems = (rng: Rng) => {
  const n = 4;
  const wt = rng.ints(n, 2, 9);
  const val = rng.ints(n, 6, 30);
  return { wt, val, W: rng.int(8, 16) };
};
const strategyQ: QGen = (rng) => {
  const { wt, val, W } = randItems(rng);
  const s = BT.sortByRatio(wt, val);
  const fifo = BT.branchAndBound(W, s.wt, s.val, 'FIFO', false).expanded.length;
  const lc = BT.branchAndBound(W, s.wt, s.val, 'LC', false).expanded.length;
  return mcq(`Knapsack W = ${W}, items (w, v) ${s.wt.map((w, i) => `(${w}, ${s.val[i]})`).join(', ')}. Using the game's bounds (kill when ub < best), which expands fewer nodes?`, fifo < lc ? 'FIFO' : lc < fifo ? 'LC' : 'They expand the same number', ['FIFO', 'LC', 'They expand the same number'].filter((x) => x !== (fifo < lc ? 'FIFO' : lc < fifo ? 'LC' : 'They expand the same number')), `FIFO expands ${fifo}, LC expands ${lc}.`);
};
const L59_BANK = [
  mcq('FIFO branch and bound keeps live nodes in a…', 'queue', ['stack', 'min-heap', 'hash table'], 'Breadth-first order.'),
  mcq('LIFO branch and bound (D-search) keeps live nodes in a…', 'stack', ['queue', 'min-heap', 'sorted array'], 'Newest first.'),
  mcq('LC search selects the live node with the…', 'smallest ĉ (least estimated cost)', ['largest depth', 'oldest timestamp', 'most children'], 'Least-cost search.'),
  mcq('In ĉ(x) = f(h(x)) + ĝ(x), ĝ(x) is…', 'an estimate of the additional cost from x to an answer node', ['the cost from the root to x', 'the number of children', 'the exact optimum'], 'h(x) is the cost so far.'),
  mcq('How does B&B differ from backtracking in node generation?', 'B&B generates all children of the E-node before choosing the next E-node', ['B&B never prunes', 'Backtracking uses a queue', 'They are identical'], 'Backtracking goes deep immediately.'),
  mcq('A live node is killed in B&B (minimisation) when…', 'its lower bound exceeds the best known solution cost', ['it has no children', 'it is the oldest', 'its depth is odd'], 'It cannot lead to a better answer.'),
  mcq("Sahni's example for LC search is…", 'the 15-puzzle', ['Tower of Hanoi', 'binary search', 'Huffman coding'], 'ĝ = number of misplaced tiles.'),
  tf('An E-node is the live node currently being expanded.', true, 'Sahni\'s terminology.'),
];

const L59: Level = {
  id: 'L59',
  n: 59,
  world: 12,
  title: 'Branch & Bound: FIFO and LC Search',
  blurb: 'Live, E- and dead nodes; FIFO vs LIFO vs least-cost selection; the ranking function ĉ = f(h) + ĝ; and killing nodes with bounds.',
  syllabus: ['DAA U5 · LC searching, bounding', 'DAA U5 · FIFO branch and bound'],
  snippets: [],
  Lesson: L59Lesson,
  quiz: [strategyQ, strategyQ, bank(L59_BANK), bank(L59_BANK), bank(L59_BANK), bank(L59_BANK), bank(L59_BANK)],
  cards: [
    { q: 'FIFO / LIFO / LC B&B list structures?', a: 'Queue / stack / min-heap on ĉ.' },
    { q: 'LC ranking function?', a: 'ĉ(x) = f(h(x)) + ĝ(x): cost so far + estimated cost to an answer.' },
  ],
  refs: ['Horowitz, Sahni & Rajasekaran, Computer Algorithms — chapter "Branch-and-Bound": LC search, 15-puzzle, bounding, FIFO branch-and-bound.'],
};

/* =====================================================================
   Level 60 — LC branch and bound for 0/1 knapsack
   ===================================================================== */

function L60Lesson() {
  return (
    <>
      <Sec title="LC branch-and-bound knapsack (Sahni)">
        <ol className="steps">
          <li>Sort items by value/weight (decreasing). The state-space tree decides x₁, x₂, … in that order (left child = include).</li>
          <li>
            For each node compute two numbers from the remaining items:
            <ul>
              <li><b>ub</b> — fractional greedy value (optimistic: no 0/1 solution below can beat it);</li>
              <li><b>lb</b> — greedy fill that skips items that don't fit (a feasible solution — pessimistic).</li>
            </ul>
          </li>
          <li>best = the largest lb seen so far. Kill every node with ub &lt; best.</li>
          <li>LC: always expand the live node with the largest ub. When the chosen E-node is a leaf (answer node), it is optimal — stop.</li>
        </ol>
        <F>Sahni's minimisation form: ĉ(x) = −ub(x),  u(x) = −lb(x),  upper = min u;  kill when ĉ(x) &gt; upper;  LC picks the least ĉ</F>
        <p>
          FIFO B&B uses the same bounds but expands in queue order; it must empty the queue before it can be sure of the optimum. Worst case is still exponential —
          0/1 knapsack is NP-hard — but good bounds prune most of the tree.
        </p>
      </Sec>
      <AlgoViz
        title="LC branch and bound, step by step"
        note="Items as weight/value (sorted by ratio automatically)."
        fields={[
          { name: 'W', label: 'capacity', initial: '15', width: 90 },
          { name: 'it', label: 'items (w/v)', initial: '2/10, 4/10, 6/12, 9/18', width: 260 },
        ]}
        build={(v) => {
          const { wt, val } = readItems(v.it);
          const s = BT.sortByRatio(wt, val);
          return BT.branchAndBound(int(v.W, 'capacity', 0, 60), s.wt, s.val, 'LC', true).frames;
        }}
      />
      <Callout kind="exam">
        <p>
          Sahni's textbook instance: n = 4, profits (10, 10, 12, 18), weights (2, 4, 6, 9), m = 15 — the example above. Expect to draw the tree with ĉ and u at each
          node and give the solution x = (1, 1, 0, 1), profit 38.
        </p>
      </Callout>
    </>
  );
}

function L60Practice() {
  return (
    <AlgoViz
      title="Which live node does LC expand next?"
      fields={[
        { name: 'W', label: 'capacity', initial: '16', width: 90 },
        { name: 'it', label: 'items (w/v)', initial: '3/30, 5/40, 7/42, 4/16', width: 260 },
      ]}
      build={(v) => {
        const { wt, val } = readItems(v.it);
        const s = BT.sortByRatio(wt, val);
        return BT.branchAndBound(int(v.W, 'capacity', 0, 60), s.wt, s.val, 'LC', true, true).frames;
      }}
      predict
    />
  );
}

const lcbbQ: QGen = (rng) => {
  const { wt, val, W } = randItems(rng);
  const s = BT.sortByRatio(wt, val);
  const k = rng.int(0, 2);
  const desc = `W = ${W}, items (w, v) sorted by ratio: ${s.wt.map((w, i) => `(${w}, ${s.val[i]})`).join(', ')}`;
  if (k === 0) return num(`${desc}. Root upper bound ub (fractional greedy)? (1 decimal if needed)`, Math.round(BT.fracBound(0, 0, 0, W, s.wt, s.val) * 10) / 10, 'Fill greedily; take a fraction of the first item that doesn\'t fit.');
  if (k === 1) return num(`${desc}. Root lower bound lb (greedy fill, skipping items that don't fit)?`, BT.greedyFill(0, 0, 0, W, s.wt, s.val), 'A feasible solution: take each item in order if it still fits.');
  return num(`${desc}. Optimal value found by LC branch and bound?`, BT.branchAndBound(W, s.wt, s.val, 'LC', false).best, 'LC stops at the first answer node selected as E-node.');
};
const sahniQ: QGen = () =>
  num("Sahni's knapsack instance: profits (10, 10, 12, 18), weights (2, 4, 6, 9), capacity 15. Optimal profit?", 38, 'x = (1, 1, 0, 1): weights 2 + 4 + 9 = 15, profit 10 + 10 + 18 = 38.');
const L60_BANK = [
  mcq('In LC-BB knapsack, ub at a node is computed by…', 'fractional greedy over the remaining items', ['the 0/1 DP table', 'sum of all remaining values', 'the number of items left'], 'An optimistic bound.'),
  mcq('lb (Sahni\'s u, negated) at a node is…', 'the value of a feasible greedy completion', ['always 0', 'the fractional bound', 'the exact optimum'], 'Skip items that don\'t fit.'),
  mcq('A node is killed when…', 'ub < best feasible value found', ['lb < ub', 'it is a leaf', 'it is the left child'], 'Sahni: ĉ(x) > upper.'),
  mcq('Why must items be sorted by value/weight?', 'So the fractional greedy bound really is an upper bound', ['To speed up sorting', 'For FIFO order', 'It isn\'t necessary'], 'Greedy by ratio is optimal for the fractional relaxation.'),
  mcq('LC search for maximisation expands the live node with the…', 'largest upper bound', ['smallest upper bound', 'smallest depth', 'largest weight'], 'Equivalently the smallest ĉ = −ub.'),
  tf('When LC search selects an answer node as E-node (with exact bound at leaves), that answer is optimal.', true, 'No live node promises more.'),
];

const L60: Level = {
  id: 'L60',
  n: 60,
  world: 12,
  title: 'LC Branch & Bound: 0/1 Knapsack',
  blurb: "Sahni's LC-BB for 0/1 knapsack: fractional upper bounds, greedy feasible values, killing nodes, least-cost selection, and the minimisation form.",
  syllabus: ['DAA U5 · LC branch and bound application: 0/1 knapsack'],
  snippets: [],
  Lesson: L60Lesson,
  Practice: L60Practice,
  quiz: [lcbbQ, lcbbQ, lcbbQ, lcbbQ, sahniQ, bank(L60_BANK), bank(L60_BANK), bank(L60_BANK)],
  cards: [{ q: 'LC-BB knapsack bounds?', a: 'ub = fractional greedy (optimistic), lb = greedy feasible; best = max lb; kill if ub < best; expand max ub.' }],
  refs: ['Horowitz, Sahni & Rajasekaran, Computer Algorithms — "Branch-and-Bound": 0/1 knapsack (LC branch-and-bound, FIFO branch-and-bound; n = 4, p = (10,10,12,18), w = (2,4,6,9), m = 15).'],
};

export default [L57, L58, L59, L60];
