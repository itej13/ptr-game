import type { Level, QGen } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, nums, int } from '../core/vizkit';
import { mcq, num, seq, tf, bank } from '../core/qhelp';
import * as X from '../engines/sortx';

/* =====================================================================
   Level 35 — Sorting on several keys: radix / bin sort
   ===================================================================== */

function L35Lesson() {
  return (
    <>
      <Sec title="Sorting records on several keys">
        <p>
          Records often have several keys K¹, K², …, Kʳ (say suit and face value of a playing card, or year–month–day). "Sorted" means lexicographically: compare
          K¹ first, and use K² only to break ties, and so on. Horowitz–Sahni give two strategies:
        </p>
        <Table
          head={['Strategy', 'How', 'Requirement']}
          rows={[
            ['MSD first (most significant digit)', 'sort on K¹ into piles, then sort each pile on K², recursively', 'piles must be handled separately'],
            ['LSD first (least significant digit)', 'sort the whole file on Kʳ, then Kʳ⁻¹, …, finally K¹', 'every pass must be STABLE'],
          ]}
        />
        <p>
          LSD-first is simpler — no piles to track — and is what card-sorting machines did: sort by face value into 13 bins, collect, then by suit into 4 bins,
          collect. Because the second pass is stable, cards with the same suit stay ordered by face value.
        </p>
      </Sec>
      <Sec title="Radix sort and bin (bucket) sort">
        <p>
          Treat each digit of an integer as a separate key. <b>LSD radix sort</b> with radix r makes one stable pass per digit. Each pass is a{' '}
          <b>bin sort</b>: distribute the records into r bins by that digit (Horowitz–Sahni use linked-list queues as bins), then collect the bins in order.
          The code below does each pass as a stable counting sort — the same effect without linked lists.
        </p>
        <Code id="radix_sort" />
        <Table
          head={['Property', 'LSD radix sort']}
          rows={[
            ['Time', 'O(d·(n + r)) for d digits in radix r — linear when d is constant'],
            ['Space', 'O(n + r)'],
            ['Stable', 'yes (and it depends on each pass being stable)'],
            ['Comparison sort?', 'no — so the Ω(n log n) bound (Level 37) does not apply'],
          ]}
        />
      </Sec>
      <AlgoViz
        title="LSD radix sort with bins"
        fields={[{ name: 'a', label: 'non-negative integers', initial: '170, 45, 75, 90, 802, 24, 2, 66', width: 320, random: (r) => r.ints(r.int(6, 9), 0, 999).join(', ') }]}
        build={(v) => X.radixFrames(nums(v.a, { min: 0, max: 9999, maxLen: 10 }))}
        code="radix_sort"
      />
      <Callout kind="pitfall">
        <p>If a pass is not stable, LSD radix sort is wrong: the tens pass would scramble the units order established by the first pass.</p>
      </Callout>
    </>
  );
}

const radixPassQ: QGen = (rng) => {
  const a = rng.distinct(rng.int(6, 8), 1, 999);
  const passes = X.radixPasses(a);
  const k = rng.int(1, Math.min(2, passes.length));
  return seq(`LSD radix sort (base 10, stable passes) on [${a.join(', ')}]. Write the array after pass ${k} (pass 1 = units digit).`, passes[k - 1], `After pass ${k}: ${passes[k - 1].join(' ')}.`);
};
const radixCountQ: QGen = (rng) => {
  const d = rng.int(2, 6);
  const n = rng.pick([100, 1000, 5000]);
  return num(`LSD radix sort on ${n} keys of up to ${d} decimal digits makes how many distribution passes?`, d, 'One pass per digit.');
};
const lexQ: QGen = (rng) => {
  const rows = Array.from({ length: rng.int(5, 6) }, () => [rng.int(1, 3), rng.int(1, 9)]);
  const sorted = X.lexSort(rows);
  return seq(`Sort these (key1, key2) pairs lexicographically (key1 most significant): ${rows.map((r) => `(${r[0]},${r[1]})`).join(' ')}. Write the key2 values in the sorted order.`, sorted.map((r) => r[1]), `Sorted: ${sorted.map((r) => `(${r[0]},${r[1]})`).join(' ')}.`);
};
const L35_BANK = [
  mcq('LSD-first sorting on several keys requires each pass to be…', 'stable', ['in-place', 'comparison-based', 'recursive'], 'Later passes must preserve the order from earlier passes on ties.'),
  mcq('Time of LSD radix sort for n keys of d digits in radix r?', 'O(d(n + r))', ['O(n log n)', 'O(n²)', 'O(d log n)'], 'd passes of O(n + r).'),
  mcq('Why can radix sort beat the Ω(n log n) bound?', 'It is not a comparison sort — it inspects digits', ['It uses more memory', 'It is randomised', 'The bound is wrong'], 'The lower bound only covers comparison sorts.'),
  mcq('In MSD-first sorting, after the first pass the file must be…', 'split into piles that are sorted independently', ['fully sorted', 'reversed', 'merged'], 'Each pile shares the same K¹.'),
  mcq('Horowitz–Sahni implement the bins of radix sort as…', 'linked-list queues', ['stacks', 'binary heaps', 'hash tables'], 'Queues keep each bin stable.'),
  tf('Radix sort processes digits from least significant to most significant in its LSD form.', true, 'Units, tens, hundreds, …'),
];

const L35: Level = {
  id: 'L35',
  n: 35,
  world: 8,
  title: 'Sorting on Several Keys: Radix Sort',
  blurb: 'Lexicographic sorting, MSD vs LSD strategies, bin sort and LSD radix sort — why every pass must be stable and why it beats n log n.',
  syllabus: ['DS U4 · Sorting on different keys'],
  snippets: ['radix_sort'],
  Lesson: L35Lesson,
  quiz: [radixPassQ, radixPassQ, radixPassQ, lexQ, lexQ, radixCountQ, bank(L35_BANK), bank(L35_BANK)],
  cards: [{ q: 'LSD radix sort on d-digit keys?', a: 'd stable passes (units first), each a bin/counting sort: O(d(n + r)).' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C — chapter "Sorting": sorting on several keys, radix sort with bins.', 'Cormen et al., Introduction to Algorithms 3e — §8.3 Radix sort (example 329/457/657…; base-10 passes).'],
};

/* =====================================================================
   Level 36 — External sorting
   ===================================================================== */

function L36Lesson() {
  return (
    <>
      <Sec title="When the data doesn't fit in memory">
        <p>
          <b>External sorting</b> sorts files on disk that are larger than main memory. Cost is dominated by block reads and writes, so algorithms minimise the
          number of <b>passes</b> over the data. The classic method has two phases:
        </p>
        <ol className="steps">
          <li>
            <b>Run generation</b>: read as much as fits, sort it internally, write it out as a sorted <b>run</b>; repeat.
          </li>
          <li>
            <b>Merging</b>: merge runs k at a time (k-way merge) until one run remains.
          </li>
        </ol>
        <F>With m initial runs and k-way merging: passes = ⌈log_k m⌉</F>
        <p>Larger k means fewer passes but needs k input buffers and a faster way to pick the minimum of k heads — a selection tree (loser tree) does it in ⌈log₂ k⌉ comparisons.</p>
      </Sec>
      <AlgoViz
        title="k-way merge of sorted runs"
        note="Runs separated by |, values by commas."
        fields={[{ name: 'r', label: 'runs', initial: '3, 9, 15 | 1, 8, 20, 25 | 4, 6, 12', width: 360 }]}
        build={(v) => {
          const runs = v.r.split('|').map((x) => nums(x, { maxLen: 8, min: -999, max: 999 }));
          if (runs.length < 2 || runs.length > 5) throw new Error('Give 2–5 runs.');
          for (const r of runs) for (let i = 1; i < r.length; i++) if (r[i] < r[i - 1]) throw new Error('Each run must be sorted.');
          return X.kWayMergeFrames(runs);
        }}
      />
      <Sec title="Longer runs: replacement selection">
        <p>
          Instead of sorting memory-loads independently, keep m records in memory (in a selection tree). Repeatedly output the smallest record that is ≥ the last
          record output, and immediately read the next input record into its place. A new record smaller than the last output can't join the current run — it is
          frozen for the next run. The run ends when every record in memory is frozen.
        </p>
        <ul>
          <li>On random input the runs average about <b>2m</b> long — half as many runs as simple run generation.</li>
          <li>Sorted input produces one single run; reverse-sorted input produces runs of exactly m.</li>
        </ul>
      </Sec>
      <AlgoViz
        title="Replacement selection"
        fields={[
          { name: 'a', label: 'input', initial: '50, 30, 70, 20, 40, 90, 10, 80, 60, 35, 25, 65', width: 340, random: (r) => r.ints(r.int(10, 14), 1, 99).join(', ') },
          { name: 'm', label: 'memory m', initial: '3', width: 90 },
        ]}
        build={(v) => X.replacementFrames(nums(v.a, { maxLen: 16 }), int(v.m, 'm', 1, 5))}
      />
      <Sec title="Optimal merging of runs of different sizes">
        <p>
          If runs have different lengths and we merge two at a time, the order matters: merging lengths a and b costs a + b record moves. Always merge the{' '}
          <b>two shortest</b> runs first (a Huffman tree — same greedy as Level 49; DAA calls it the optimal merge pattern).
        </p>
        <F>Runs 2, 3, 5, 7, 9: (2+3)=5, (5+5)=10, (7+9)=16, (10+16)=26 ⇒ total cost 5 + 10 + 16 + 26 = 57</F>
      </Sec>
    </>
  );
}

const passQ: QGen = (rng) => {
  const m = rng.pick([8, 16, 20, 50, 64, 100, 200]);
  const k = rng.pick([2, 3, 4, 8, 10]);
  return num(`${m} initial runs are merged ${k} at a time. How many merge passes are needed?`, X.kWayPasses(m, k), `⌈log_${k} ${m}⌉ = ${X.kWayPasses(m, k)}.`);
};
const rsQ: QGen = (rng) => {
  const inp = rng.distinct(rng.int(8, 11), 1, 99);
  const m = rng.int(2, 3);
  const runs = X.replacementSelection(inp, m);
  return rng.chance(0.5)
    ? num(`Replacement selection with memory for ${m} records on input ${inp.join(', ')}. How many runs are produced?`, runs.length, `Runs: ${runs.map((r) => `[${r.join(' ')}]`).join(' ')}.`)
    : seq(`Replacement selection with memory for ${m} records on input ${inp.join(', ')}. Write the FIRST run.`, runs[0], `Runs: ${runs.map((r) => `[${r.join(' ')}]`).join(' ')}.`);
};
const omQ: QGen = (rng) => {
  const sizes = rng.ints(rng.int(4, 6), 2, 30);
  const r = X.optimalMerge(sizes);
  return num(`Runs of lengths ${sizes.join(', ')} are merged two at a time, always the two shortest first. Total cost (sum of merged lengths)?`, r.cost, `Merges: ${r.steps.map(([a, b, c]) => `${a}+${b}=${c}`).join(', ')}; total ${r.cost}.`);
};
const runsQ: QGen = (rng) => {
  const n = rng.pick([1000, 5000, 10000, 60000]);
  const m = rng.pick([100, 250, 500, 1000]);
  return num(`Simple run generation: ${n} records, memory holds ${m}. How many initial runs?`, Math.ceil(n / m), `⌈${n}/${m}⌉ = ${Math.ceil(n / m)}.`);
};
const L36_BANK = [
  mcq('The two phases of external merge sort are…', 'run generation, then merging runs', ['partitioning, then quicksort', 'hashing, then probing', 'heap building, then extraction'], 'Sorted runs first, then k-way merges.'),
  mcq('Average run length produced by replacement selection with memory m on random input?', '≈ 2m', ['m', 'm/2', 'm²'], 'Knuth\'s snowplow argument.'),
  mcq('Increasing k in k-way merging…', 'reduces the number of passes but needs more buffers', ['always increases total time', 'makes runs longer', 'removes the need for run generation'], 'Passes = ⌈log_k m⌉.'),
  mcq('Replacement selection on already sorted input produces…', 'a single run', ['m runs', 'n runs', 'runs of length m'], 'Every new record can extend the current run.'),
  mcq('A loser (selection) tree lets k-way merge pick the next record in…', 'O(log k) comparisons', ['O(1)', 'O(k)', 'O(k log k)'], 'Instead of k − 1 comparisons.'),
  mcq('Best order for merging runs of unequal lengths two at a time?', 'Always merge the two shortest runs', ['Merge the two longest first', 'Merge in input order', 'Order doesn\'t matter'], 'Optimal merge pattern (Huffman).'),
  tf('External sorting cost is usually measured in block (disk) accesses.', true, 'Disk I/O dominates.'),
];

const L36: Level = {
  id: 'L36',
  n: 36,
  world: 8,
  title: 'External Sorting',
  blurb: 'Sorting data bigger than memory: run generation, k-way merging and passes, replacement selection (runs ≈ 2m), and optimal merge patterns.',
  syllabus: ['DS U4 · External sorting'],
  snippets: [],
  Lesson: L36Lesson,
  quiz: [passQ, passQ, rsQ, rsQ, omQ, omQ, runsQ, bank(L36_BANK), bank(L36_BANK)],
  cards: [
    { q: 'Merge passes for m runs, k-way?', a: '⌈log_k m⌉' },
    { q: 'Replacement selection run length?', a: 'About 2m on random input; 1 run if sorted; m if reverse-sorted.' },
  ],
  refs: ['Horowitz & Sahni, Fundamentals of Data Structures (Galgotia — the syllabus edition) — chapter "External Sorting" (k-way merging, run generation, optimal merging of runs).', 'Knuth, TAOCP Vol. 3 §5.4.1 Multiway merging and replacement selection.'],
};

/* =====================================================================
   Level 37 — The Ω(n log n) lower bound & choosing a sort
   ===================================================================== */

function L37Lesson() {
  return (
    <>
      <Sec title="Decision trees">
        <p>
          Any comparison sort can be drawn as a <b>decision tree</b>: each internal node is a comparison "is x &lt; y?", each leaf is one possible output order.
          To sort every input correctly the tree needs at least <b>n!</b> leaves (one per permutation). A binary tree of height h has at most 2ʰ leaves, so:
        </p>
        <F>2ʰ ≥ n!  ⇒  h ≥ log₂ n! = Θ(n log n)</F>
        <p>
          The height is the worst-case number of comparisons. So <b>every comparison sort needs Ω(n log n) comparisons in the worst case</b>, and merge sort and
          heap sort are asymptotically optimal. Sorting 5 items needs at least ⌈log₂ 120⌉ = 7 comparisons.
        </p>
      </Sec>
      <AlgoViz
        title="Walk the decision tree of insertion sort on (a, b, c)"
        fields={[{ name: 'v', label: 'values of a, b, c (distinct)', initial: '3, 1, 2', width: 180 }]}
        build={(v) => {
          const x = nums(v.v, { minLen: 3, maxLen: 3 });
          if (new Set(x).size !== 3) throw new Error('Use three distinct values.');
          return X.decisionFrames(x as [number, number, number]);
        }}
      />
      <Sec title="Every sort in this course, side by side">
        <Table
          head={['Sort', 'Best', 'Average', 'Worst', 'Extra space', 'Stable', 'In-place']}
          rows={[
            ['Bubble (optimised)', 'n', 'n²', 'n²', 'O(1)', 'yes', 'yes'],
            ['Selection', 'n²', 'n²', 'n²', 'O(1)', 'no', 'yes'],
            ['Insertion', 'n', 'n²', 'n²', 'O(1)', 'yes', 'yes'],
            ['Merge', 'n log n', 'n log n', 'n log n', 'O(n)', 'yes', 'no'],
            ['Quick', 'n log n', 'n log n', 'n²', 'O(log n) stack', 'no', 'yes'],
            ['Heap', 'n log n', 'n log n', 'n log n', 'O(1)', 'no', 'yes'],
            ['LSD radix', 'd(n + r)', 'd(n + r)', 'd(n + r)', 'O(n + r)', 'yes', 'no'],
          ]}
        />
        <ul>
          <li>Small or nearly sorted data: insertion sort. Guaranteed n log n with O(1) memory: heap sort. Stable n log n: merge sort.</li>
          <li>Fastest in practice on random data in memory: quick sort (with a good pivot). Linked lists and external data: merge sort.</li>
          <li>Integers/fixed-length keys: radix sort beats n log n because it doesn't compare keys.</li>
        </ul>
      </Sec>
    </>
  );
}

const lbQ: QGen = (rng) => {
  const n = rng.int(3, 12);
  return num(`Information-theoretic lower bound: minimum worst-case number of comparisons to sort ${n} items = ⌈log₂ ${n}!⌉ = ?`, X.minCompLowerBound(n), `log₂ ${n}! ≈ ${X.log2Fact(n).toFixed(2)}, rounded up: ${X.minCompLowerBound(n)}.`);
};
const choiceQ: QGen = (rng) => {
  const cases: [string, string, string[]][] = [
    ['an array that is already almost sorted, small n', 'Insertion sort', ['Heap sort', 'Selection sort', 'Quick sort with first pivot']],
    ['a guaranteed O(n log n) worst case using O(1) extra memory', 'Heap sort', ['Merge sort', 'Quick sort', 'Insertion sort']],
    ['a stable O(n log n) sort of a linked list', 'Merge sort', ['Heap sort', 'Quick sort', 'Selection sort']],
    ['a million 6-digit integer IDs, fastest asymptotically', 'LSD radix sort', ['Bubble sort', 'Quick sort with first pivot', 'Selection sort']],
    ['minimum number of writes/swaps to the array', 'Selection sort', ['Bubble sort', 'Insertion sort', 'Merge sort']],
    ['data too large for memory, stored on disk', 'External merge sort', ['Heap sort in place', 'Quick sort', 'Insertion sort']],
  ];
  const [sit, ans, wrong] = rng.pick(cases);
  return mcq(`Best choice for ${sit}?`, ans, wrong, `${ans} fits: see the comparison table.`);
};
const L37_BANK = [
  mcq('A decision tree for sorting n distinct items must have at least how many leaves?', 'n!', ['2ⁿ', 'n²', 'n log n'], 'One per possible output permutation.'),
  mcq('The Ω(n log n) lower bound applies to…', 'comparison-based sorting', ['all sorting algorithms', 'radix sort', 'counting sort'], 'Non-comparison sorts escape it.'),
  mcq('Which sort is NOT stable?', 'Heap sort', ['Merge sort', 'Insertion sort', 'LSD radix sort'], 'Also quick and selection sort.'),
  mcq('Which comparison sorts are asymptotically optimal in the worst case?', 'Merge sort and heap sort', ['Quick sort and bubble sort', 'Insertion and selection sort', 'Only merge sort'], 'Θ(n log n) worst case.'),
  mcq('log₂(n!) is…', 'Θ(n log n)', ['Θ(n)', 'Θ(n²)', 'Θ(log n)'], 'Stirling (Level 3).'),
  tf('Quick sort is optimal in the worst case.', false, 'Its worst case is Θ(n²); its average is Θ(n log n).'),
];

const L37: Level = {
  id: 'L37',
  n: 37,
  world: 8,
  title: 'The n log n Lower Bound',
  blurb: 'Decision trees prove every comparison sort needs Ω(n log n) comparisons; then the full comparison table of every sort and how to choose one.',
  syllabus: ['DS U4 · Searching and sorting (comparison)', 'DAA U1 · Algorithmic efficiency'],
  snippets: [],
  Lesson: L37Lesson,
  quiz: [lbQ, lbQ, choiceQ, choiceQ, choiceQ, bank(L37_BANK), bank(L37_BANK), bank(L37_BANK)],
  cards: [
    { q: 'Why Ω(n log n) for comparison sorts?', a: 'Decision tree needs ≥ n! leaves ⇒ height ≥ log₂ n! = Θ(n log n).' },
    { q: 'Stable sorts in this course?', a: 'Bubble, insertion, merge, LSD radix. Not: selection, quick, heap.' },
  ],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §8.1 Lower bounds for sorting (decision trees).', 'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C — chapter "Sorting": how fast can we sort?, summary of internal sorting.'],
};

export default [L35, L36, L37];
