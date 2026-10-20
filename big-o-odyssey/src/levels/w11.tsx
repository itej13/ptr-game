import type { Level, QGen } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, nums, int } from '../core/vizkit';
import { mcq, num, seq, txt, tf, bank } from '../core/qhelp';
import * as DP from '../engines/dp';
import type { Rng } from '../core/rng';

/* =====================================================================
   Level 50 — DP principles & rod cutting
   ===================================================================== */

function L50Lesson() {
  return (
    <>
      <Sec title="When recursion repeats itself">
        <p>
          <b>Dynamic programming</b> solves a problem by combining solutions to subproblems — like divide and conquer — but for problems whose subproblems{' '}
          <b>overlap</b>. Instead of recomputing them, each is solved once and stored. It applies when the problem has:
        </p>
        <ul>
          <li>
            <b>Optimal substructure</b> — an optimal solution contains optimal solutions to its subproblems (Bellman's principle of optimality).
          </li>
          <li>
            <b>Overlapping subproblems</b> — a naive recursion keeps solving the same subproblems.
          </li>
        </ul>
        <Table
          head={['Style', 'How', 'Trade-off']}
          rows={[
            ['Top-down (memoisation)', 'plain recursion + a table checked before computing', 'solves only the subproblems needed'],
            ['Bottom-up (tabulation)', 'fill the table from the smallest subproblems upward', 'no recursion overhead; order must respect dependencies'],
          ]}
        />
        <p>Recipe: (1) characterise an optimal solution, (2) write a recurrence for its value, (3) compute it bottom-up, (4) record choices to rebuild the solution.</p>
      </Sec>
      <AlgoViz title="Fibonacci: overlapping subproblems vs a table" fields={[{ name: 'n', label: 'n (2–7)', initial: '6', width: 80 }]} build={(v) => DP.fibFrames(int(v.n, 'n', 2, 7))} />
      <Sec title="Rod cutting">
        <p>
          A rod of length n can be cut into integer pieces; a piece of length i sells for price[i]. Maximise revenue. If the first piece has length i, the rest
          must be cut optimally:
        </p>
        <F>r[0] = 0,   r[j] = max over 1 ≤ i ≤ j of ( price[i] + r[j − i] )</F>
        <Code id="rod_cut" />
        <p>Θ(n²) time instead of 2ⁿ⁻¹ cut patterns. s[j] remembers the best first piece so the cuts can be printed.</p>
      </Sec>
      <AlgoViz
        title="Rod cutting table"
        fields={[{ name: 'p', label: 'price[1..n]', initial: '1, 5, 8, 9, 10, 17, 17, 20', width: 300, random: (r) => r.ints(r.int(5, 8), 1, 25).join(', ') }]}
        build={(v) => {
          const pr = nums(v.p, { min: 0, max: 99, maxLen: 10 });
          return DP.rodFrames([0, ...pr], pr.length);
        }}
        code="rod_cut"
      />
    </>
  );
}

const rodQ: QGen = (rng) => {
  const n = rng.int(4, 7);
  const price = [0, ...Array.from({ length: n }, (_, i) => (i + 1) * rng.int(1, 3) + rng.int(0, 4))];
  const r = DP.rodCut(price, n);
  return rng.chance(0.6)
    ? num(`Rod of length ${n}; prices for lengths 1…${n}: ${price.slice(1).join(', ')}. Maximum revenue?`, r.r[n], `r = [${r.r.join(', ')}]; cut into ${DP.rodPieces(r.s, n).join(' + ')}.`)
    : num(`Prices for lengths 1…${n}: ${price.slice(1).join(', ')}. What is r[${Math.min(4, n)}] in the rod-cutting table?`, r.r[Math.min(4, n)], `r = [${r.r.join(', ')}].`);
};
const L50_BANK = [
  mcq('The two hallmarks of a DP problem?', 'Optimal substructure and overlapping subproblems', ['Greedy choice and sorting', 'Divide and conquer with independent subproblems', 'Backtracking and bounding'], 'Divide and conquer has independent (non-overlapping) subproblems.'),
  mcq('Memoisation is…', 'top-down recursion that stores each solved subproblem', ['bottom-up table filling', 'a greedy heuristic', 'pruning a state-space tree'], 'Check the table before recursing.'),
  mcq('Naive recursive Fibonacci runs in…', 'exponential time', ['linear time', 'O(n log n)', 'O(log n)'], 'Θ(φⁿ) calls.'),
  mcq('Rod-cutting recurrence?', 'r[j] = max over i of (price[i] + r[j − i])', ['r[j] = r[j − 1] + price[j]', 'r[j] = min over i of (price[i] − r[j − i])', 'r[j] = 2r[j/2]'], 'Choose the first piece.'),
  mcq('Time of bottom-up rod cutting for length n?', 'Θ(n²)', ['Θ(n)', 'Θ(2ⁿ)', 'Θ(n log n)'], 'Two nested loops.'),
  tf('Bellman\'s principle of optimality is another name for optimal substructure.', true, 'Remaining decisions must be optimal for the state they lead to.'),
];

const L50: Level = {
  id: 'L50',
  n: 50,
  world: 11,
  title: 'DP Principles & Rod Cutting',
  blurb: 'Optimal substructure, overlapping subproblems, memoisation vs tabulation, and the rod-cutting recurrence with its reconstruction.',
  syllabus: ['DAA U4 · Principles of dynamic programming', 'DAA U4 · Rod cutting problem'],
  snippets: ['rod_cut'],
  Lesson: L50Lesson,
  quiz: [rodQ, rodQ, rodQ, bank(L50_BANK), bank(L50_BANK), bank(L50_BANK), bank(L50_BANK)],
  cards: [{ q: 'Rod cutting recurrence?', a: 'r[0] = 0; r[j] = max over 1 ≤ i ≤ j of price[i] + r[j − i].' }],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §15.1 Rod cutting, §15.3 Elements of dynamic programming.', 'Horowitz, Sahni & Rajasekaran, Computer Algorithms — chapter "Dynamic Programming" (principle of optimality).'],
};

/* =====================================================================
   Level 51 — Floyd–Warshall
   ===================================================================== */

function parseMatrix(s: string): number[][] {
  const rows = s.split('|').map((r) => r.trim()).filter(Boolean);
  const M = rows.map((r) => r.split(/[\s,]+/).filter(Boolean).map((x) => (/^(inf|∞|x|-)$/i.test(x) ? Infinity : Number(x))));
  if (M.length < 2 || M.length > 6 || M.some((r) => r.length !== M.length)) throw new Error('Give a square matrix of size 2–6, rows separated by |.');
  if (M.flat().some((x) => x !== Infinity && !Number.isInteger(x))) throw new Error('Entries must be integers or ∞ (write inf).');
  return M;
}

function L51Lesson() {
  return (
    <>
      <Sec title="All-pairs shortest paths">
        <p>
          Let D⁽ᵏ⁾[i][j] be the length of a shortest path from i to j whose intermediate vertices are all in {'{'}0, …, k{'}'}. Either the path avoids k, or it goes
          i ⇝ k ⇝ j with both halves using only intermediates &lt; k:
        </p>
        <F>D⁽ᵏ⁾[i][j] = min( D⁽ᵏ⁻¹⁾[i][j],  D⁽ᵏ⁻¹⁾[i][k] + D⁽ᵏ⁻¹⁾[k][j] ),   D⁽⁻¹⁾ = weight matrix</F>
        <Code id="floyd_warshall" />
        <ul>
          <li>Θ(n³) time, Θ(n²) space (in place). Negative edges allowed; a negative entry on the diagonal afterwards reveals a negative cycle.</li>
          <li>Compare: Dijkstra from every vertex is O(n·(n + e) log n) — better for sparse graphs with non-negative weights.</li>
          <li>Replace (min, +) by (OR, AND) and you get Warshall's transitive closure (Level 45).</li>
        </ul>
      </Sec>
      <AlgoViz
        title="Floyd–Warshall phase by phase"
        note="Rows separated by |, inf = no edge."
        fields={[{ name: 'm', label: 'weight matrix', initial: '0 3 inf 7 | 8 0 2 inf | 5 inf 0 1 | 2 inf inf 0', width: 420 }]}
        build={(v) => DP.fwFrames(parseMatrix(v.m))}
        code="floyd_warshall"
      />
    </>
  );
}

const randW = (rng: Rng, n: number) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 0 : rng.chance(0.55) ? rng.int(1, 9) : Infinity)));
const showM = (M: number[][]) => M.map((r) => r.map((x) => (x === Infinity ? '∞' : x)).join(' ')).join(' | ');
const fwQ: QGen = (rng) => {
  const n = rng.int(3, 4);
  const M = randW(rng, n);
  const D = DP.floydWarshall(M);
  const pairsAvail = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && D[i][j] < Infinity) pairsAvail.push([i, j]);
  if (!pairsAvail.length || rng.chance(0.3)) {
    const i = rng.int(0, n - 1);
    return seq(`Weight matrix (rows | separated, ∞ = no edge): ${showM(M)}. Write row ${i} of the final Floyd–Warshall matrix (write inf for ∞).`, D[i].map((x) => (x === Infinity ? 'inf' : String(x))), `Row ${i}: ${D[i].map((x) => (x === Infinity ? '∞' : x)).join(' ')}.`);
  }
  const [i, j] = rng.pick(pairsAvail);
  return num(`Weight matrix (rows | separated, ∞ = no edge): ${showM(M)}. Shortest distance from ${i} to ${j}?`, D[i][j], `Final matrix: ${showM(D)}.`);
};
const L51_BANK = [
  mcq('Floyd–Warshall time complexity?', 'Θ(n³)', ['Θ(n² log n)', 'Θ(n·e)', 'Θ(e log n)'], 'Three nested loops.'),
  mcq('The Floyd–Warshall update is…', 'D[i][j] = min(D[i][j], D[i][k] + D[k][j])', ['D[i][j] = D[i][k] · D[k][j]', 'D[i][j] = max(D[i][j], D[i][k] + D[k][j])', 'D[i][j] = D[j][i]'], 'Through k or not.'),
  mcq('After Floyd–Warshall, a negative value on the diagonal means…', 'a negative cycle exists', ['the graph is disconnected', 'an arithmetic overflow', 'nothing'], 'A path from i back to i of negative length.'),
  mcq('Floyd–Warshall is an example of…', 'dynamic programming', ['greedy', 'backtracking', 'divide and conquer'], 'Recurrence on the allowed intermediate set.'),
  mcq('In D⁽ᵏ⁾, the intermediate vertices allowed are…', 'those numbered ≤ k', ['exactly k of them', 'none', 'any vertices'], 'Phases add one vertex at a time.'),
  tf('Floyd–Warshall handles negative edge weights as long as there is no negative cycle.', true, 'Unlike Dijkstra.'),
];

const L51: Level = {
  id: 'L51',
  n: 51,
  world: 11,
  title: 'Floyd–Warshall',
  blurb: 'All-pairs shortest paths by DP over the allowed intermediate vertices — the k-phase recurrence, negative edges, and its kinship with Warshall.',
  syllabus: ['DAA U4 · Floyd–Warshall all-pairs shortest paths', 'DS U5 · Shortest path'],
  snippets: ['floyd_warshall'],
  Lesson: L51Lesson,
  quiz: [fwQ, fwQ, fwQ, fwQ, bank(L51_BANK), bank(L51_BANK), bank(L51_BANK)],
  cards: [{ q: 'Floyd–Warshall recurrence?', a: 'D(k)[i][j] = min(D(k−1)[i][j], D(k−1)[i][k] + D(k−1)[k][j]); k outermost; Θ(n³).' }],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §25.2 The Floyd–Warshall algorithm.', 'Horowitz, Sahni & Rajasekaran, Computer Algorithms — "Dynamic Programming": all-pairs shortest paths.'],
};

/* =====================================================================
   Level 52 — Matrix-chain multiplication
   ===================================================================== */

function L52Lesson() {
  return (
    <>
      <Sec title="The order of multiplication matters">
        <p>
          Multiplying a p×q matrix by a q×r matrix costs p·q·r scalar multiplications. Matrix multiplication is associative, so A₁A₂A₃ can be computed as (A₁A₂)A₃ or
          A₁(A₂A₃) — with very different costs: for 10×100, 100×5, 5×50 they are 7 500 vs 75 000.
        </p>
        <F>m[i][i] = 0,   m[i][j] = min over i ≤ k &lt; j of ( m[i][k] + m[k+1][j] + p[i−1]·p[k]·p[j] )</F>
        <p>
          Fill the table by increasing chain length; s[i][j] records the best split k so the optimal parenthesisation can be printed recursively. The number of
          parenthesisations is a Catalan number (exponential), but DP needs only Θ(n³) time and Θ(n²) space. Lab Experiment 12.
        </p>
        <Code id="matrix_chain" />
      </Sec>
      <AlgoViz
        title="Matrix-chain table"
        note="Dimensions p₀ … pₙ: matrix Aᵢ is pᵢ₋₁ × pᵢ."
        fields={[{ name: 'p', label: 'dimensions', initial: '30, 35, 15, 5, 10, 20, 25', width: 280, random: (r) => r.ints(r.int(4, 6), 2, 40).join(', ') }]}
        build={(v) => {
          const p = nums(v.p, { min: 1, max: 99, minLen: 3, maxLen: 7 });
          return DP.mcmFrames(p);
        }}
        code="matrix_chain"
      />
    </>
  );
}

const mcmQ: QGen = (rng) => {
  const p = rng.ints(rng.int(4, 5), 2, 30);
  const r = DP.matrixChain(p);
  const desc = p.slice(1).map((x, i) => `A${i + 1}: ${p[i]}×${x}`).join(', ');
  return rng.chance(0.6)
    ? num(`Matrices ${desc}. Minimum number of scalar multiplications?`, r.cost, `Optimal: ${r.parens} with ${r.cost}.`)
    : txt(`Matrices ${desc}. Optimal parenthesisation (smallest split on ties), written like ((A1A2)A3)?`, r.parens, `${r.parens}, cost ${r.cost}.`);
};
const twoQ: QGen = (rng) => {
  const [a, b, c, d] = rng.ints(4, 2, 40);
  const left = a * b * c + a * c * d;
  const right = b * c * d + a * b * d;
  return num(`A₁ is ${a}×${b}, A₂ is ${b}×${c}, A₃ is ${c}×${d}. Cost of (A₁A₂)A₃ in scalar multiplications?`, left, `${a}·${b}·${c} + ${a}·${c}·${d} = ${left} (A₁(A₂A₃) would cost ${right}).`);
};
const L52_BANK = [
  mcq('Cost of multiplying a p×q matrix by a q×r matrix?', 'p·q·r', ['p·r', 'p + q + r', 'q²'], 'Each of p·r entries needs q multiplications.'),
  mcq('Time of the DP for matrix-chain order with n matrices?', 'Θ(n³)', ['Θ(n²)', 'Θ(2ⁿ)', 'Θ(n log n)'], 'Θ(n²) cells × O(n) splits.'),
  mcq('The number of ways to parenthesise a chain of n matrices grows like…', 'a Catalan number (exponentially)', ['n²', 'n!', 'log n'], 'Why brute force fails.'),
  mcq('The table s[i][j] stores…', 'the split point k of the optimal product Aᵢ…Aⱼ', ['the cost', 'the dimension pᵢ', 'the number of matrices'], 'Used to print the parenthesisation.'),
  mcq('In what order is m[i][j] filled?', 'by increasing chain length j − i', ['row by row from i = 1', 'column by column from j = n', 'randomly'], 'Each cell needs shorter chains.'),
  tf('Matrix multiplication is associative but not commutative.', true, 'Order of grouping can change; order of matrices cannot.'),
];

const L52: Level = {
  id: 'L52',
  n: 52,
  world: 11,
  title: 'Matrix-Chain Multiplication',
  blurb: 'Why parenthesisation changes the cost, the m[i][j] recurrence filled by chain length, and printing the optimal order from s[i][j] (Lab Experiment 12).',
  syllabus: ['DAA U4 · Matrix multiplication (matrix-chain)'],
  snippets: ['matrix_chain'],
  Lesson: L52Lesson,
  quiz: [mcmQ, mcmQ, mcmQ, twoQ, bank(L52_BANK), bank(L52_BANK), bank(L52_BANK)],
  cards: [{ q: 'Matrix-chain recurrence?', a: 'm[i][j] = min over k of m[i][k] + m[k+1][j] + p[i−1]·p[k]·p[j]; m[i][i] = 0.' }],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §15.2 Matrix-chain multiplication (example p = 30, 35, 15, 5, 10, 20, 25 → 15 125).', 'DAA Lab Manual — Experiment 12.'],
};

/* =====================================================================
   Level 53 — LCS
   ===================================================================== */

function L53Lesson() {
  return (
    <>
      <Sec title="Longest common subsequence">
        <p>
          A <b>subsequence</b> keeps characters in order but may skip some (unlike a substring, which is contiguous). The LCS of X and Y is a longest sequence that
          is a subsequence of both — used in diff tools, version control and DNA alignment.
        </p>
        <F>
          c[i][j] = 0 if i = 0 or j = 0;   c[i−1][j−1] + 1 if X[i] = Y[j];   max(c[i−1][j], c[i][j−1]) otherwise
        </F>
        <Code id="lcs" />
        <p>
          Θ(mn) time and space. To print the LCS, trace back from c[m][n]: on a match go diagonally (that character is in the LCS); otherwise move toward the larger
          neighbour. Lab Experiment 13.
        </p>
        <Callout kind="convention">
          <p>When up and left are equal, CLRS moves up; moving left instead may produce a different LCS of the same length. Questions here use CLRS's rule.</p>
        </Callout>
      </Sec>
      <AlgoViz
        title="LCS table"
        fields={[
          { name: 'x', label: 'X', initial: 'ABCBDAB', width: 140, random: (r) => Array.from({ length: r.int(5, 7) }, () => 'ABCD'[r.int(0, 3)]).join('') },
          { name: 'y', label: 'Y', initial: 'BDCABA', width: 140, random: (r) => Array.from({ length: r.int(5, 7) }, () => 'ABCD'[r.int(0, 3)]).join('') },
        ]}
        build={(v) => {
          if (!/^[A-Za-z]{1,10}$/.test(v.x) || !/^[A-Za-z]{1,10}$/.test(v.y)) throw new Error('Use 1–10 letters each.');
          return DP.lcsFrames(v.x, v.y);
        }}
        code="lcs"
      />
    </>
  );
}

const lcsQ: QGen = (rng) => {
  const w = () => Array.from({ length: rng.int(5, 7) }, () => 'ABCD'[rng.int(0, 3)]).join('');
  const X = w();
  const Y = w();
  const r = DP.lcs(X, Y);
  return rng.chance(0.55) ? num(`Length of the LCS of ${X} and ${Y}?`, r.len, `LCS (CLRS trace) = ${r.seq}.`) : txt(`LCS of X = ${X}, Y = ${Y} using CLRS's traceback (diagonal on a match; else up when up ≥ left)?`, r.seq || '-', `c[m][n] = ${r.len}; traced LCS = ${r.seq || '(empty)'}.`, { placeholder: 'e.g. BCBA' });
};
const L53_BANK = [
  mcq('LCS recurrence when X[i] = Y[j]?', 'c[i][j] = c[i−1][j−1] + 1', ['c[i][j] = max(c[i−1][j], c[i][j−1])', 'c[i][j] = c[i−1][j] + 1', 'c[i][j] = 0'], 'Both strings shrink by one.'),
  mcq('LCS time and space for strings of lengths m and n?', 'Θ(mn) both', ['Θ(m + n)', 'Θ(2^m)', 'Θ(mn) time, O(1) space'], 'Full table (length alone needs only two rows).'),
  mcq('Subsequence vs substring?', 'A subsequence need not be contiguous; a substring must be', ['They are the same', 'A substring may skip characters', 'A subsequence must be contiguous'], 'Order preserved, gaps allowed.'),
  mcq('LCS of ABCBDAB and BDCABA has length…', '4', ['3', '5', '6'], 'E.g. BCBA (CLRS).'),
  mcq('How many subsequences does a string of length m have?', '2^m', ['m²', 'm!', 'm'], 'Why brute force is exponential.'),
  tf('The LCS of two strings is always unique.', false, 'Different tracebacks can give different LCSs of the same length.'),
];

const L53: Level = {
  id: 'L53',
  n: 53,
  world: 11,
  title: 'Longest Common Subsequence',
  blurb: 'Subsequences vs substrings, the c[i][j] table, and tracing back the actual LCS with CLRS\'s tie rule (Lab Experiment 13).',
  syllabus: ['DAA U4 · Longest common subsequence'],
  snippets: ['lcs'],
  Lesson: L53Lesson,
  quiz: [lcsQ, lcsQ, lcsQ, lcsQ, bank(L53_BANK), bank(L53_BANK), bank(L53_BANK)],
  cards: [{ q: 'LCS recurrence?', a: 'Match: c[i−1][j−1] + 1; else max(c[i−1][j], c[i][j−1]); borders 0.' }],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §15.4 Longest common subsequence (ABCBDAB / BDCABA).', 'DAA Lab Manual — Experiment 13.'],
};

/* =====================================================================
   Level 54 — Edit distance
   ===================================================================== */

function L54Lesson() {
  return (
    <>
      <Sec title="Edit (Levenshtein) distance">
        <p>
          The minimum number of single-character <b>insertions</b>, <b>deletions</b> and <b>substitutions</b> that turn string a into string b. Spell checkers,
          DNA comparison and fuzzy search use it.
        </p>
        <F>
          d[i][0] = i,  d[0][j] = j;   d[i][j] = d[i−1][j−1] if a[i] = b[j], else 1 + min( d[i−1][j] (delete), d[i][j−1] (insert), d[i−1][j−1] (substitute) )
        </F>
        <Code id="edit_distance" />
        <p>Θ(mn) time and space. kitten → sitting = 3 (k→s, e→i, insert g).</p>
        <Callout kind="convention">
          <p>Some versions give substitution cost 2 (or allow transpositions — Damerau–Levenshtein). The standard edit distance, used here, charges 1 for each of the three operations.</p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Edit-distance table"
        fields={[
          { name: 'a', label: 'from', initial: 'kitten', width: 140 },
          { name: 'b', label: 'to', initial: 'sitting', width: 140 },
        ]}
        build={(v) => {
          if (!/^[A-Za-z]{0,10}$/.test(v.a) || !/^[A-Za-z]{0,10}$/.test(v.b)) throw new Error('Use up to 10 letters each.');
          return DP.editFrames(v.a, v.b);
        }}
        code="edit_distance"
      />
    </>
  );
}

const editQ: QGen = (rng) => {
  const pool = ['kitten', 'sitting', 'sunday', 'saturday', 'horse', 'ros', 'intention', 'execution', 'flaw', 'lawn', 'algo', 'logic', 'data', 'date', 'heap', 'help', 'graph', 'grape'];
  const a = rng.pick(pool);
  let b = rng.pick(pool);
  if (a === b) b = [...a].reverse().join('');
  return num(`Edit distance (insert / delete / substitute, each cost 1) from "${a}" to "${b}"?`, DP.editDistance(a, b).dist, `d[${a.length}][${b.length}] = ${DP.editDistance(a, b).dist}.`);
};
const editRandQ: QGen = (rng) => {
  const w = () => Array.from({ length: rng.int(3, 6) }, () => 'ABC'[rng.int(0, 2)]).join('');
  const a = w();
  const b = w();
  return num(`Edit distance between ${a} and ${b}?`, DP.editDistance(a, b).dist, `Table corner = ${DP.editDistance(a, b).dist}.`);
};
const L54_BANK = [
  mcq('Edit distance allows which operations?', 'Insert, delete, substitute', ['Only substitute', 'Swap adjacent characters only', 'Reverse substrings'], 'Each costs 1 in the standard version.'),
  mcq('d[i][0] equals…', 'i (delete all i characters)', ['0', 'j', '1'], 'Base case.'),
  mcq('When a[i] = b[j], d[i][j] is…', 'd[i−1][j−1]', ['d[i−1][j−1] + 1', 'd[i−1][j] + 1', '0'], 'No operation needed.'),
  mcq('Edit distance from "" to "abc"?', '3', ['0', '1', '6'], 'Three insertions.'),
  mcq('Time complexity for strings of lengths m and n?', 'Θ(mn)', ['Θ(m + n)', 'Θ(3^(m+n))', 'Θ(mn log n)'], 'One cell per pair of prefixes.'),
  tf('Edit distance is symmetric: dist(a, b) = dist(b, a).', true, 'Insertions and deletions swap roles.'),
];

const L54: Level = {
  id: 'L54',
  n: 54,
  world: 11,
  title: 'Edit Distance',
  blurb: 'Levenshtein distance with insert/delete/substitute, the d[i][j] recurrence and its base cases, and where it is used.',
  syllabus: ['DAA U4 · Edit distance problem'],
  snippets: ['edit_distance'],
  Lesson: L54Lesson,
  quiz: [editQ, editQ, editRandQ, editRandQ, bank(L54_BANK), bank(L54_BANK), bank(L54_BANK)],
  cards: [{ q: 'Edit-distance recurrence?', a: 'Equal: d[i−1][j−1]; else 1 + min(d[i−1][j], d[i][j−1], d[i−1][j−1]); borders i and j.' }],
  refs: ['Levenshtein, "Binary codes capable of correcting deletions, insertions and reversals", 1966.', 'Kleinberg & Tardos, Algorithm Design — §6.6 Sequence alignment.'],
};

/* =====================================================================
   Level 55 — 0/1 knapsack
   ===================================================================== */

function L55Lesson() {
  return (
    <>
      <Sec title="Take it or leave it">
        <p>
          n items with weights wᵢ and values vᵢ; capacity W; each item is taken <b>whole or not at all</b>. Greedy by ratio fails (Level 47). DP over (items
          considered, remaining capacity):
        </p>
        <F>K[0][w] = 0;   K[i][w] = K[i−1][w] if wᵢ &gt; w, else max( K[i−1][w], K[i−1][w − wᵢ] + vᵢ )</F>
        <Code id="knapsack01" />
        <ul>
          <li>
            Θ(nW) time and space — <b>pseudo-polynomial</b>: polynomial in the numeric value W, but exponential in the number of bits needed to write W. 0/1
            knapsack is NP-hard (World 13).
          </li>
          <li>Trace back: if K[i][w] ≠ K[i−1][w], item i was taken. Lab Experiment 14.</li>
          <li>Sahni's alternative is the "sets of (profit, weight) pairs" method with dominance purging — same values, different bookkeeping.</li>
        </ul>
      </Sec>
      <AlgoViz
        title="0/1 knapsack table"
        note="Items as weight/value pairs."
        fields={[
          { name: 'w', label: 'capacity W (≤ 15)', initial: '8', width: 110 },
          { name: 'it', label: 'items (weight/value)', initial: '2/3, 3/4, 4/5, 5/6', width: 280, random: (r) => Array.from({ length: r.int(3, 5) }, () => `${r.int(1, 6)}/${r.int(1, 12)}`).join(', ') },
        ]}
        build={(v) => {
          const W = int(v.w, 'W', 0, 15);
          const ps = v.it.split(/[,;]+/).map((p) => p.trim()).filter(Boolean).map((p) => {
            const m = /^(\d+)\s*[/:\s]\s*(\d+)$/.exec(p);
            if (!m || +m[1] < 1) throw new Error(`"${p}": write weight/value with weight ≥ 1.`);
            return [+m[1], +m[2]];
          });
          if (!ps.length || ps.length > 6) throw new Error('Give 1–6 items.');
          return DP.knapFrames(W, ps.map((p) => p[0]), ps.map((p) => p[1]));
        }}
        code="knapsack01"
      />
    </>
  );
}

const knapQ: QGen = (rng) => {
  const n = rng.int(3, 5);
  const wt = rng.ints(n, 1, 8);
  const val = rng.ints(n, 1, 20);
  const W = rng.int(5, 15);
  const r = DP.knapsack01(W, wt, val);
  const list = wt.map((w, i) => `#${i + 1}(w${w}, v${val[i]})`).join(', ');
  return rng.chance(0.6)
    ? num(`0/1 knapsack, W = ${W}, items ${list}. Maximum value?`, r.best, `Take ${r.chosen.map((x) => `#${x + 1}`).reverse().join(', ') || 'nothing'} for ${r.best}.`)
    : num(`0/1 knapsack, W = ${W}, items ${list}. Value of table cell K[${Math.min(2, n)}][${Math.min(W, 6)}] (first ${Math.min(2, n)} items, capacity ${Math.min(W, 6)})?`, r.K[Math.min(2, n)][Math.min(W, 6)], `Row ${Math.min(2, n)}: ${r.K[Math.min(2, n)].join(' ')}.`);
};
const L55_BANK = [
  mcq('Time of the DP for 0/1 knapsack?', 'Θ(nW)', ['Θ(n log n)', 'Θ(2ⁿ) always', 'Θ(n²)'], 'n rows × (W + 1) columns.'),
  mcq('Why is Θ(nW) called pseudo-polynomial?', 'It is polynomial in the value of W, not in its number of bits', ['It uses randomness', 'It is actually linear', 'It only works for small n'], 'Doubling the bits of W squares the work.'),
  mcq('K[i][w] when item i is heavier than w?', 'K[i−1][w]', ['K[i−1][w] + vᵢ', '0', 'K[i][w−1]'], 'It cannot be taken.'),
  mcq('During traceback, item i was taken iff…', 'K[i][w] ≠ K[i−1][w]', ['K[i][w] = 0', 'wᵢ ≤ w', 'vᵢ is the largest value'], 'Then continue with w − wᵢ.'),
  mcq('Which algorithm is optimal for FRACTIONAL knapsack?', 'Greedy by value/weight', ['This DP', 'Backtracking only', 'Dijkstra'], 'Splitting makes greedy optimal.'),
  tf('0/1 knapsack is NP-hard.', true, 'Its decision version is NP-complete (subset sum reduces to it).'),
];

const L55: Level = {
  id: 'L55',
  n: 55,
  world: 11,
  title: '0/1 Knapsack (DP)',
  blurb: 'Why greedy fails when items can\'t be split, the K[i][w] table, traceback, and what "pseudo-polynomial" means (Lab Experiment 14).',
  syllabus: ['DAA U4 · Knapsack problem (0/1, dynamic programming)'],
  snippets: ['knapsack01'],
  Lesson: L55Lesson,
  quiz: [knapQ, knapQ, knapQ, knapQ, bank(L55_BANK), bank(L55_BANK), bank(L55_BANK)],
  cards: [{ q: '0/1 knapsack recurrence?', a: 'K[i][w] = K[i−1][w] if wᵢ > w else max(K[i−1][w], K[i−1][w−wᵢ] + vᵢ).' }],
  refs: ['Cormen et al., Introduction to Algorithms 3e — Exercise 16.2-2 (0/1 knapsack DP).', 'Horowitz, Sahni & Rajasekaran, Computer Algorithms — "Dynamic Programming": 0/1 knapsack.', 'DAA Lab Manual — Experiment 14.'],
};

/* =====================================================================
   Level 56 — TSP by DP
   ===================================================================== */

function L56Lesson() {
  return (
    <>
      <Sec title="Travelling salesperson">
        <p>
          Visit every one of n cities exactly once and return to the start, minimising the total distance (a minimum-cost Hamiltonian cycle). Trying all tours costs
          (n − 1)! — 362 880 for n = 10.
        </p>
        <p>Sahni's DP (Held–Karp): let g(i, S) be the cheapest path from city i through every city in S exactly once, ending at the start city 1:</p>
        <F>g(i, ∅) = c(i, 1);   g(i, S) = min over j ∈ S of ( c(i, j) + g(j, S − {'{'}j{'}'}) );   answer g(1, V − {'{'}1{'}'})</F>
        <p>
          The code computes the same values forwards with bitmasks: dp[S][u] = cheapest path from city 0 that visits exactly S and ends at u. There are 2ⁿ·n states
          and O(n) work each: <b>Θ(n²·2ⁿ)</b> time, Θ(n·2ⁿ) space — still exponential (TSP is NP-hard) but vastly better than n!.
        </p>
        <Code id="tsp_dp" />
      </Sec>
      <AlgoViz
        title="Held–Karp state table"
        note="Symmetric distance matrix, rows separated by |, n ≤ 5."
        fields={[{ name: 'm', label: 'distances', initial: '0 10 15 20 | 10 0 35 25 | 15 35 0 30 | 20 25 30 0', width: 420 }]}
        build={(v) => {
          const M = parseMatrix(v.m);
          if (M.length > 5) throw new Error('At most 5 cities here.');
          if (M.flat().some((x) => x === Infinity || x < 0)) throw new Error('Use non-negative finite distances.');
          return DP.tspFrames(M);
        }}
        code="tsp_dp"
      />
    </>
  );
}

const tspQ: QGen = (rng) => {
  const n = 4;
  const d = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) d[i][j] = d[j][i] = rng.int(2, 30);
  const r = DP.tsp(d);
  return num(`Symmetric distances: ${d.map((row) => row.join(' ')).join(' | ')}. Cost of the optimal tour starting and ending at city 0?`, r.cost, `Optimal tour ${r.tour.join(' → ')} costs ${r.cost}.`);
};
const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));
const tspCountQ: QGen = (rng) => {
  const n = rng.int(4, 12);
  return rng.chance(0.5)
    ? num(`How many distinct tours (start city fixed, each direction counted separately) must brute force check for n = ${n} cities?`, fact(n - 1), `(n − 1)! = ${fact(n - 1)}.`)
    : num(`Number of DP states dp[S][u] (S ⊆ cities, u a city) for n = ${n}?`, n * 2 ** n, `n·2ⁿ = ${n * 2 ** n}.`);
};
const L56_BANK = [
  mcq('Time of the Held–Karp DP for TSP?', 'Θ(n²·2ⁿ)', ['Θ(n!)', 'Θ(n³)', 'Θ(2ⁿ)'], '2ⁿ·n states × n transitions.'),
  mcq('Space of the Held–Karp DP?', 'Θ(n·2ⁿ)', ['Θ(n²)', 'Θ(n!)', 'Θ(n)'], 'One value per (subset, end city).'),
  mcq('g(i, S) in Sahni\'s formulation is…', 'the shortest path from i through all of S, ending at the start city', ['the shortest edge from i', 'the tour cost', 'the number of cities in S'], 'Then answer = g(1, V − {1}).'),
  mcq('TSP is…', 'NP-hard', ['solvable in polynomial time', 'a greedy problem', 'the same as MST'], 'Its decision version is NP-complete.'),
  mcq('Brute force over permutations costs…', '(n − 1)!', ['2ⁿ', 'n²', 'n log n'], 'Fix the start city.'),
  tf('The DP for TSP is exponential, but much faster than trying all tours.', true, 'n²2ⁿ ≪ n! for large n.'),
];

const L56: Level = {
  id: 'L56',
  n: 56,
  world: 11,
  title: 'Travelling Salesperson (DP)',
  blurb: "Sahni's g(i, S) recurrence and the Held–Karp bitmask DP — exponential but far better than (n − 1)! — and why TSP stays hard.",
  syllabus: ['DAA U4 · Travelling salesman problem'],
  snippets: ['tsp_dp'],
  Lesson: L56Lesson,
  quiz: [tspQ, tspQ, tspQ, tspCountQ, tspCountQ, bank(L56_BANK), bank(L56_BANK)],
  cards: [{ q: 'TSP DP recurrence (Sahni)?', a: 'g(i, S) = min over j ∈ S of c(i, j) + g(j, S − {j}); g(i, ∅) = c(i, 1). Θ(n²2ⁿ).' }],
  refs: ['Horowitz, Sahni & Rajasekaran, Computer Algorithms — "Dynamic Programming": the traveling salesperson problem.', 'Held & Karp, "A dynamic programming approach to sequencing problems", J. SIAM 10(1), 1962.'],
};

export default [L50, L51, L52, L53, L54, L55, L56];
