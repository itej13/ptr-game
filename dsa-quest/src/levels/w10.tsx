import type { Level, QGen } from '../core/types';
import { Sec, Callout, F, Code } from '../core/lesson';
import { AlgoViz, int } from '../core/vizkit';
import { mcq, num, seq, txt, tf, bank } from '../core/qhelp';
import * as Gr from '../engines/greedy';

const pairs = (s: string, what: string): [number, number][] => {
  const parts = s.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length || parts.length > 9) throw new Error(`Give 1–9 ${what}.`);
  return parts.map((p) => {
    const m = /^\(?\s*(\d+)\s*[\s/:]\s*(\d+)\s*\)?$/.exec(p);
    if (!m) throw new Error(`Can't read "${p}" — write pairs like 60/10.`);
    return [+m[1], +m[2]];
  });
};

/* =====================================================================
   Level 47 — Greedy paradigm & fractional knapsack
   ===================================================================== */

function L47Lesson() {
  return (
    <>
      <Sec title="The greedy method">
        <p>
          A greedy algorithm builds a solution step by step, always taking the choice that looks best <i>right now</i> (the locally optimal one) and never undoing
          it. It is correct only when the problem has:
        </p>
        <ul>
          <li>
            <b>Greedy-choice property</b> — some optimal solution begins with the greedy choice (proved by an exchange argument).
          </li>
          <li>
            <b>Optimal substructure</b> — after making that choice, what remains is a smaller instance of the same problem.
          </li>
        </ul>
        <p>
          Sahni's general control abstraction: <code>for i = 1 … n: x = select(a); if feasible(solution ∪ x) then solution = union(solution, x)</code>. Examples
          in this course: fractional knapsack, activity selection, job sequencing, Huffman codes, optimal merge patterns, Kruskal, Prim, Dijkstra.
        </p>
      </Sec>
      <Sec title="Fractional knapsack">
        <p>
          A knapsack holds weight W; item i has value vᵢ and weight wᵢ, and any <b>fraction</b> of an item may be taken. Take items in decreasing order of{' '}
          <b>value per unit weight</b> vᵢ/wᵢ, whole while they fit, then a fraction of the next one. Sorting costs O(n log n).
        </p>
        <Code id="fractional_knapsack" />
        <F>CLRS example: W = 50, items (v, w) = (60, 10), (100, 20), (120, 30); ratios 6, 5, 4 → take 10 + 20 whole and 20/30 of the third: 60 + 100 + 80 = 240</F>
        <Callout kind="pitfall">
          <p>
            The same greedy is <b>wrong for 0/1 knapsack</b> (items can't be split): above, it would take items 1 and 2 for 160, but items 2 and 3 give 220. 0/1
            knapsack needs dynamic programming (Level 55) or branch and bound (Level 60).
          </p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Fractional knapsack"
        note="Items as value/weight pairs."
        fields={[
          { name: 'w', label: 'capacity W', initial: '50', width: 90 },
          { name: 'it', label: 'items (value/weight)', initial: '60/10, 100/20, 120/30', width: 320, random: (r) => Array.from({ length: r.int(3, 6) }, () => `${r.int(5, 60)}/${r.int(2, 30)}`).join(', ') },
        ]}
        build={(v) => {
          const W = int(v.w, 'W', 0, 500);
          const items = pairs(v.it, 'items').map(([value, weight]) => {
            if (!weight) throw new Error('Weights must be positive.');
            return { value, weight };
          });
          return Gr.knapsackFrames(W, items);
        }}
        code="fractional_knapsack"
      />
    </>
  );
}

const fkQ: QGen = (rng) => {
  const items = Array.from({ length: rng.int(3, 5) }, () => ({ value: rng.int(2, 30) * 5, weight: rng.int(1, 10) * 5 }));
  const W = rng.int(4, 14) * 5;
  const r = Gr.fractionalKnapsack(W, items);
  const ans = Math.round(r.total * 100) / 100;
  return num(`Fractional knapsack, W = ${W}. Items (value, weight): ${items.map((i) => `(${i.value}, ${i.weight})`).join(', ')}. Maximum total value? (2 decimals if needed)`, ans, `Order by value/weight; total ${ans}.`);
};
const ratioQ: QGen = (rng) => {
  const items = Array.from({ length: 4 }, (_, i) => ({ value: rng.int(10, 90), weight: rng.int(2, 20), name: `I${i + 1}` }));
  const order = [...items].sort((a, b) => b.value * a.weight - a.value * b.weight).map((i) => i.name!);
  return seq(`Items (value, weight): ${items.map((i) => `${i.name}(${i.value}, ${i.weight})`).join(', ')}. In what order does the greedy fractional-knapsack algorithm consider them? (write names)`, order, `By value/weight: ${order.join(', ')}.`);
};
const L47_BANK = [
  mcq('Greedy fractional knapsack sorts items by…', 'value/weight, decreasing', ['value, decreasing', 'weight, increasing', 'weight, decreasing'], 'Most value per unit of capacity first.'),
  mcq('Is greedy-by-ratio optimal for 0/1 knapsack?', 'No', ['Yes', 'Only for distinct weights', 'Only when W is even'], 'Counterexample: W 50, (60,10), (100,20), (120,30).'),
  mcq('The two properties a problem needs for a greedy algorithm to be optimal?', 'Greedy-choice property and optimal substructure', ['Overlapping subproblems and memoisation', 'Divide and conquer', 'Backtracking and bounding'], 'Overlapping subproblems is the DP hallmark.'),
  mcq('Time complexity of greedy fractional knapsack?', 'O(n log n)', ['O(nW)', 'O(2ⁿ)', 'O(n²)'], 'Dominated by sorting.'),
  mcq('In greedy fractional knapsack, how many items are taken fractionally?', 'At most one', ['Any number', 'Exactly two', 'All of them'], 'Only the item that overflows.'),
  tf('A greedy algorithm may revise an earlier choice when a better one appears.', false, 'Greedy decisions are final.'),
];

const L47: Level = {
  id: 'L47',
  n: 47,
  world: 10,
  title: 'Greedy Method & Fractional Knapsack',
  blurb: "The greedy paradigm, when it is provably optimal, Sahni's control abstraction, and the fractional knapsack — plus why 0/1 knapsack breaks it.",
  syllabus: ['DAA U3 · Overview of the greedy paradigm', 'DAA U3 · Knapsack problem'],
  snippets: ['fractional_knapsack'],
  Lesson: L47Lesson,
  quiz: [fkQ, fkQ, fkQ, ratioQ, ratioQ, bank(L47_BANK), bank(L47_BANK), bank(L47_BANK)],
  cards: [{ q: 'Fractional knapsack greedy?', a: 'Sort by v/w descending; take whole items while they fit, then a fraction of the next. O(n log n).' }],
  refs: ['Horowitz, Sahni & Rajasekaran, Computer Algorithms — chapter "The Greedy Method" (control abstraction, knapsack problem).', 'Cormen et al., Introduction to Algorithms 3e — §16.2 Elements of the greedy strategy (fractional vs 0/1 knapsack).', 'DAA Lab Manual — Experiment 6.'],
};

/* =====================================================================
   Level 48 — Activity selection & job sequencing
   ===================================================================== */

function L48Lesson() {
  return (
    <>
      <Sec title="Activity selection">
        <p>
          n activities want one resource; activity i occupies [sᵢ, fᵢ). Choose the largest set of mutually compatible activities. Greedy choice: always pick the
          compatible activity that <b>finishes earliest</b> — it leaves the most time for everything else. (Picking the shortest or earliest-starting activity is
          wrong in general.)
        </p>
        <Code id="activity_selection" />
        <p>O(n log n) to sort, then one linear pass. Lab Experiment 7.</p>
      </Sec>
      <AlgoViz
        title="Activity selection"
        note="Activities as start/finish pairs."
        fields={[{ name: 'a', label: 'activities (s/f)', initial: '1/4, 3/5, 0/6, 5/7, 3/9, 5/9, 6/10, 8/11, 8/12, 2/14, 12/16', width: 420 }]}
        build={(v) => {
          const ps = v.a.split(/[,;]+/).map((p) => p.trim()).filter(Boolean).map((p) => {
            const m = /^(\d+)\s*[/:\s-]\s*(\d+)$/.exec(p);
            if (!m || +m[2] <= +m[1]) throw new Error(`"${p}": write start/finish with finish > start.`);
            return [+m[1], +m[2]];
          });
          if (ps.length > 12) throw new Error('At most 12 activities.');
          return Gr.activityFrames(ps.map((p) => p[0]), ps.map((p) => p[1]));
        }}
        code="activity_selection"
      />
      <Sec title="Job sequencing with deadlines (your greedy deck)">
        <p>
          n jobs, each taking one unit of time on a single processor, with deadline dᵢ and profit pᵢ earned only if finished by its deadline. Maximise total
          profit:
        </p>
        <ol className="steps">
          <li>Sort jobs by decreasing profit.</li>
          <li>Draw a Gantt chart with max-deadline unit slots.</li>
          <li>For each job, place it in the <b>latest</b> free slot at or before its deadline; if none is free, reject it.</li>
        </ol>
        <Code id="job_sequencing" />
        <p>O(n²) with this slot scan (O(n log n) with a disjoint-set "latest free slot" structure).</p>
      </Sec>
      <AlgoViz
        title="Job sequencing with deadlines"
        note="Jobs as deadline/profit pairs."
        fields={[{ name: 'j', label: 'jobs (d/p)', initial: '2/100, 1/19, 2/27, 1/25, 3/15', width: 320, random: (r) => Array.from({ length: r.int(4, 7) }, () => `${r.int(1, 4)}/${r.int(5, 99)}`).join(', ') }]}
        build={(v) => {
          const ps = pairs(v.j, 'jobs');
          if (ps.some(([d]) => d < 1 || d > 8)) throw new Error('Deadlines must be 1–8.');
          return Gr.jobFrames(ps.map((p) => p[0]), ps.map((p) => p[1]));
        }}
        code="job_sequencing"
      />
    </>
  );
}

function L48Practice() {
  return (
    <>
      <AlgoViz title="Take or skip each activity?" fields={[{ name: 'a', label: 'activities (s/f)', initial: '1/3, 2/5, 4/6, 6/8, 5/9, 8/10, 9/12', width: 400 }]} build={(v) => {
        const ps = v.a.split(/[,;]+/).map((p) => p.trim()).filter(Boolean).map((p) => p.split(/[/:\s-]+/).map(Number));
        return Gr.activityFrames(ps.map((p) => p[0]), ps.map((p) => p[1]), true);
      }} code="activity_selection" predict />
      <AlgoViz title="Which slot does each job get?" fields={[{ name: 'j', label: 'jobs (d/p)', initial: '4/20, 1/10, 1/40, 1/30, 3/50, 2/25', width: 320 }]} build={(v) => {
        const ps = pairs(v.j, 'jobs');
        return Gr.jobFrames(ps.map((p) => p[0]), ps.map((p) => p[1]), true);
      }} code="job_sequencing" predict />
    </>
  );
}

const actQ: QGen = (rng) => {
  const n = rng.int(6, 8);
  const s = rng.ints(n, 0, 12);
  const f = s.map((x) => x + rng.int(1, 5));
  const ch = Gr.selectActivities(s, f);
  const list = s.map((x, i) => `a${i}[${x},${f[i]})`).join(' ');
  return rng.chance(0.5)
    ? num(`Activities ${list}. Maximum number of mutually compatible activities?`, ch.length, `Earliest-finish greedy picks ${ch.map((i) => `a${i}`).join(', ')}.`)
    : seq(`Activities ${list}. Which activities does earliest-finish-first select (ties by index)? Write their indices in selection order.`, ch, `Selected: ${ch.join(', ')}.`);
};
const jobQ: QGen = (rng) => {
  const n = rng.int(5, 7);
  const d = rng.ints(n, 1, 4);
  const p = rng.distinct(n, 5, 99);
  const r = Gr.jobSequencing(d, p);
  const list = d.map((x, i) => `J${i + 1}(d${x}, p${p[i]})`).join(', ');
  return rng.chance(0.5)
    ? num(`Jobs ${list}, unit time each, one processor. Maximum total profit?`, r.total, `Schedule: ${r.slot.slice(1).map((j) => (j >= 0 ? `J${j + 1}` : '–')).join(' ')}; profit ${r.total}.`)
    : txt(`Jobs ${list}. Write the job in each time slot from slot 0–1 onwards using the greedy method (e.g. J3 J1 J5; use - for an empty slot).`, r.slot.slice(1).map((j) => (j >= 0 ? `J${j + 1}` : '-')).join(''), `Slots: ${r.slot.slice(1).map((j) => (j >= 0 ? `J${j + 1}` : '-')).join(' ')}.`);
};
const L48_BANK = [
  mcq('Greedy activity selection always picks the compatible activity with the…', 'earliest finish time', ['earliest start time', 'shortest duration', 'fewest conflicts'], 'Earliest start or shortest can fail.'),
  mcq('In job sequencing with deadlines, each job is placed in…', 'the latest free slot at or before its deadline', ['the earliest free slot', 'slot 1', 'a random free slot'], 'Keeps earlier slots free for jobs with tighter deadlines.'),
  mcq('Jobs in job sequencing are considered in…', 'decreasing order of profit', ['increasing deadline', 'decreasing deadline', 'input order'], 'Your deck\'s Step-01.'),
  mcq('Time of activity selection when activities are already sorted by finish time?', 'O(n)', ['O(n log n)', 'O(n²)', 'O(2ⁿ)'], 'One pass.'),
  mcq('Two activities [s₁, f₁) and [s₂, f₂) with f₁ ≤ s₂ are…', 'compatible', ['conflicting', 'identical', 'invalid'], 'One ends before the other starts.'),
  tf('The number of Gantt-chart slots in job sequencing equals the maximum deadline.', true, 'No job can finish later than that.'),
];

const L48: Level = {
  id: 'L48',
  n: 48,
  world: 10,
  title: 'Activity Selection & Job Sequencing',
  blurb: 'Earliest-finish-first for activity selection, and profit-first latest-slot scheduling for jobs with deadlines (Lab Experiment 7).',
  syllabus: ['DAA U3 · Activity selection problem', 'DAA U3 · Greedy (job sequencing, deck 17)'],
  snippets: ['activity_selection', 'job_sequencing'],
  Lesson: L48Lesson,
  Practice: L48Practice,
  quiz: [actQ, actQ, actQ, jobQ, jobQ, jobQ, bank(L48_BANK), bank(L48_BANK)],
  cards: [
    { q: 'Activity selection greedy rule?', a: 'Sort by finish time; take each activity whose start ≥ last chosen finish.' },
    { q: 'Job sequencing greedy rule?', a: 'Sort by profit desc; place each job in the latest free slot ≤ its deadline.' },
  ],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §16.1 An activity-selection problem.', 'Horowitz, Sahni & Rajasekaran, Computer Algorithms — "The Greedy Method": job sequencing with deadlines.', 'Your DAA deck "17. greedy" (job sequencing with Gantt chart) and Lab Experiment 7.'],
};

/* =====================================================================
   Level 49 — Huffman coding
   ===================================================================== */

function L49Lesson() {
  return (
    <>
      <Sec title="Variable-length prefix codes">
        <p>
          Give frequent symbols short codewords and rare ones long codewords. To decode unambiguously, no codeword may be a prefix of another — a{' '}
          <b>prefix code</b>, which corresponds to a binary tree with symbols at the leaves (left = 0, right = 1). The cost of a code is Σ fᵢ · depthᵢ, the weighted
          external path length of the tree (Level 27).
        </p>
      </Sec>
      <Sec title="Huffman's greedy algorithm">
        <ol className="steps">
          <li>Make a single-node tree for every symbol, weighted by its frequency.</li>
          <li>Repeatedly remove the two lightest trees, join them under a new root whose weight is their sum, and put it back.</li>
          <li>When one tree remains, read each codeword along the root-to-leaf path.</li>
        </ol>
        <Code id="huffman" />
        <p>With a min-heap: O(n log n). It produces an optimal prefix code — the same greedy as the optimal merge pattern of Level 36. Lab Experiment 11.</p>
        <Callout kind="convention">
          <p>
            Ties and left/right choices change the individual codewords but never the total cost. The game's rule: first removed → left (0); on equal weights the
            older tree is removed first. With it, CLRS's example (a:45 b:13 c:12 d:16 e:9 f:5) gives exactly CLRS's codes a=0, c=100, b=101, f=1100, e=1101, d=111.
          </p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Build a Huffman tree"
        note="Symbols with frequencies, e.g. a:45, b:13."
        fields={[{ name: 's', label: 'symbol:frequency', initial: 'a:45, b:13, c:12, d:16, e:9, f:5', width: 360, random: (r) => [...'abcdefg'].slice(0, r.int(4, 7)).map((c) => `${c}:${r.int(1, 40)}`).join(', ') }]}
        build={(v) => {
          const parts = v.s.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
          if (parts.length < 2 || parts.length > 8) throw new Error('Give 2–8 symbols.');
          const cs: string[] = [];
          const fs: number[] = [];
          for (const p of parts) {
            const m = /^([a-zA-Z0-9])\s*[:=]\s*(\d+)$/.exec(p);
            if (!m || +m[2] < 1) throw new Error(`"${p}": write symbol:frequency with frequency ≥ 1.`);
            if (cs.includes(m[1])) throw new Error(`Symbol ${m[1]} repeated.`);
            cs.push(m[1]);
            fs.push(+m[2]);
          }
          return Gr.huffmanFrames(cs, fs);
        }}
        code="huffman"
      />
    </>
  );
}

function L49Practice() {
  return <AlgoViz title="Which two trees merge next?" fields={[{ name: 's', label: 'symbol:frequency', initial: 'A:5, B:9, C:12, D:13, E:16, F:45', width: 360 }]} build={(v) => {
    const parts = v.s.split(/[,;]+/).map((p) => p.trim().split(/[:=]/));
    return Gr.huffmanFrames(parts.map((p) => p[0].trim()), parts.map((p) => Number(p[1])), true);
  }} code="huffman" predict />;
}

const huffQ: QGen = (rng) => {
  const n = rng.int(4, 6);
  const cs = [...'ABCDEFG'].slice(0, n);
  const fs = rng.distinct(n, 2, 40);
  const codes = Gr.huffmanCodes(cs, fs);
  const k = rng.int(0, 2);
  const list = cs.map((c, i) => `${c}:${fs[i]}`).join(', ');
  if (k === 0) return num(`Huffman coding for ${list}. Total encoded length Σ f·(code length) in bits?`, Gr.weightedLength(cs, fs), `Codes: ${cs.map((c) => `${c}=${codes[c]}`).join(' ')}.`);
  const c = rng.pick(cs);
  if (k === 1) return num(`Huffman coding for ${list}. Length of the codeword for ${c}?`, codes[c].length, `Codes: ${cs.map((x) => `${x}=${codes[x]}`).join(' ')}.`);
  return txt(`Huffman coding for ${list}, merging the two smallest each time (first removed = left = 0; equal weights: older tree first). Codeword for ${c}?`, codes[c], `Codes: ${cs.map((x) => `${x}=${codes[x]}`).join(' ')}.`);
};
const decodeQ: QGen = (rng) => {
  const cs = [...'ABCDE'];
  const fs = rng.distinct(5, 2, 40);
  const codes = Gr.huffmanCodes(cs, fs);
  const msg = Array.from({ length: rng.int(3, 5) }, () => rng.pick(cs)).join('');
  const bits = [...msg].map((c) => codes[c]).join('');
  return txt(`Prefix code ${cs.map((c) => `${c}=${codes[c]}`).join(', ')}. Decode ${bits}.`, msg, `Read left to right; each codeword is recognised as soon as it is complete (no codeword is a prefix of another): ${msg}.`);
};
const L49_BANK = [
  mcq('Huffman\'s algorithm repeatedly merges…', 'the two trees of smallest weight', ['the two largest trees', 'adjacent symbols', 'a random pair'], 'Greedy choice.'),
  mcq('A prefix code means…', 'no codeword is a prefix of another', ['all codewords have the same length', 'codes are sorted', 'the first bit is always 0'], 'Makes decoding unambiguous.'),
  mcq('Time of Huffman\'s algorithm with a min-heap for n symbols?', 'O(n log n)', ['O(n²)', 'O(n)', 'O(2ⁿ)'], 'n − 1 merges, each O(log n).'),
  mcq('How many internal nodes does a Huffman tree for n symbols have?', 'n − 1', ['n', '2n', 'n/2'], 'Each merge creates one.'),
  mcq('The cost minimised by a Huffman tree is…', 'Σ frequency × depth (weighted external path length)', ['the tree height', 'the number of leaves', 'the largest codeword'], 'Total bits of the encoded message.'),
  tf('Different tie-breaking can change Huffman codewords but not the total encoded length.', true, 'All Huffman trees are optimal.'),
];

const L49: Level = {
  id: 'L49',
  n: 49,
  world: 10,
  title: 'Huffman Coding',
  blurb: 'Prefix codes as binary trees, the greedy merge-two-smallest algorithm, exact codewords under a stated tie rule, and decoding (Lab Experiment 11).',
  syllabus: ['DAA U3 · Huffman coding'],
  snippets: ['huffman'],
  Lesson: L49Lesson,
  Practice: L49Practice,
  quiz: [huffQ, huffQ, huffQ, huffQ, decodeQ, bank(L49_BANK), bank(L49_BANK)],
  cards: [{ q: 'Huffman algorithm?', a: 'Min-heap of single-symbol trees; repeat: pop two smallest, push their merge; codes = root-to-leaf paths (left 0, right 1).' }],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §16.3 Huffman codes (Figure 16.5 codes).', 'Huffman, "A method for the construction of minimum-redundancy codes", Proc. IRE 40(9), 1952.', 'DAA Lab Manual — Experiment 11.'],
};

export default [L47, L48, L49];
