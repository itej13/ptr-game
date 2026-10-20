import type { Level, QGen } from '../core/types';
import { Sec, Callout, Table, F } from '../core/lesson';
import { AlgoViz, nums, int } from '../core/vizkit';
import { mcq, num, tf, bank } from '../core/qhelp';
import * as NP from '../engines/np';
import * as G from '../engines/graphs';
import { gFields, readG } from './w09a';

/* =====================================================================
   Level 61 — P, NP, NP-hard, NP-complete
   ===================================================================== */

function L61Lesson() {
  return (
    <>
      <Sec title="Complexity measures">
        <p>
          We measure an algorithm by its worst-case running time as a function of the <b>input size</b> n — the number of bits (or items) needed to write the input.
          An algorithm is <b>polynomial-time</b> if it runs in O(nᵏ) for some constant k; problems with such algorithms are considered <b>tractable</b>.
          Exponential (2ⁿ) and factorial (n!) running times are <b>non-polynomial</b>.
        </p>
        <Table
          head={['n', 'n²', 'n³', '2ⁿ', 'n!']}
          rows={[
            ['10', '100', '1 000', '1 024', '3 628 800'],
            ['20', '400', '8 000', '1 048 576', '≈ 2.4 × 10¹⁸'],
            ['50', '2 500', '125 000', '≈ 1.1 × 10¹⁵', '≈ 3.0 × 10⁶⁴'],
          ]}
        />
        <Callout kind="pitfall" title="Pseudo-polynomial is not polynomial">
          <p>
            0/1 knapsack in Θ(nW) and subset sum in Θ(n·t) look polynomial, but W and t are <i>numbers</i>: writing them takes only log W bits, so Θ(nW) is
            exponential in the input size.
          </p>
        </Callout>
      </Sec>
      <Sec title="Decision problems, P and NP">
        <p>
          The theory is stated for <b>decision problems</b> (answer yes/no). Every optimisation problem has one: "is there a tour of cost ≤ k?", "is there a vertex
          cover of size ≤ k?". If the decision version is hard, so is the optimisation version.
        </p>
        <ul>
          <li>
            <b>P</b>: decision problems solvable by a deterministic algorithm in polynomial time.
          </li>
          <li>
            <b>NP</b> (nondeterministic polynomial): decision problems solvable in polynomial time by a <b>nondeterministic</b> algorithm — Sahni's model with{' '}
            <code>Choice(S)</code>, <code>Success()</code>, <code>Failure()</code>, which may "guess" correctly. Equivalently: every yes-instance has a{' '}
            <b>certificate</b> that can be <b>verified</b> in polynomial time.
          </li>
          <li>P ⊆ NP (a deterministic algorithm is a nondeterministic one that never guesses). Whether P = NP is the most famous open problem in computer science.</li>
        </ul>
      </Sec>
      <Sec title="Reductions, NP-hard and NP-complete">
        <p>
          L₁ <b>reduces to</b> L₂ (Sahni writes L₁ ∝ L₂; CLRS L₁ ≤ₚ L₂) if there is a polynomial-time transformation f with x ∈ L₁ ⇔ f(x) ∈ L₂. Then a polynomial
          algorithm for L₂ gives one for L₁: L₂ is at least as hard as L₁.
        </p>
        <Table
          head={['Class', 'Definition']}
          rows={[
            ['NP-hard', 'every problem in NP reduces to it (it may not even be in NP, or decidable)'],
            ['NP-complete', 'NP-hard AND in NP'],
          ]}
        />
        <ul>
          <li>
            <b>Cook's theorem</b> (1971): satisfiability (SAT) is NP-complete — the first NP-complete problem; others follow by reductions.
          </li>
          <li>To prove a new problem X is NP-complete: (1) show X ∈ NP (a polynomial verifier); (2) reduce a <i>known</i> NP-complete problem <b>to</b> X.</li>
          <li>If any NP-complete problem is solved in polynomial time, then P = NP. If any is proved to need super-polynomial time, P ≠ NP.</li>
          <li>The halting problem is NP-hard but not NP-complete (it is undecidable, so not in NP) — Sahni's example.</li>
        </ul>
        <F>Believed picture (if P ≠ NP):  P ⊂ NP,  NP-complete = NP ∩ NP-hard,  P ∩ NP-complete = ∅</F>
      </Sec>
      <AlgoViz
        title="Verifying is easy, finding is hard: subset sum"
        note="The DP is pseudo-polynomial; a certificate (the subset) is checked in O(n)."
        fields={[
          { name: 'a', label: 'numbers', initial: '3, 34, 4, 12, 5, 2', width: 240 },
          { name: 't', label: 'target', initial: '9', width: 90 },
        ]}
        build={(v) => NP.subsetSumFrames(nums(v.a, { min: 1, max: 99, maxLen: 10 }), int(v.t, 'target', 0, 64))}
      />
    </>
  );
}

const classQ: QGen = (rng) => {
  const items: [string, string, string[]][] = [
    ['Sorting n numbers', 'P', ['NP-complete', 'Undecidable', 'NP-hard but not in NP']],
    ['Shortest path with non-negative weights (decision version)', 'P', ['NP-complete', 'NP-hard but not in NP', 'Not in NP']],
    ['Minimum spanning tree (decision version)', 'P', ['NP-complete', 'Undecidable', 'NP-hard but not in NP']],
    ['SAT (Boolean satisfiability)', 'NP-complete', ['P (known)', 'Undecidable', 'Not in NP']],
    ['Vertex cover of size ≤ k', 'NP-complete', ['P (known)', 'Undecidable', 'Not in NP']],
    ['Subset sum', 'NP-complete', ['P (known)', 'Undecidable', 'Not in NP']],
    ['Travelling salesperson (decision: tour of cost ≤ k)', 'NP-complete', ['P (known)', 'Undecidable', 'Not in NP']],
    ['Halting problem', 'NP-hard but not in NP', ['NP-complete', 'P', 'Not NP-hard']],
    ['0/1 knapsack (decision: value ≥ V within weight W)', 'NP-complete', ['P (known) because of the Θ(nW) DP', 'Undecidable', 'Not in NP']],
  ];
  const [p, a, w] = rng.pick(items);
  return mcq(`Classify: ${p}.`, a, w, a === 'P' ? 'A polynomial-time algorithm is known.' : a === 'NP-complete' ? 'It is in NP and a known NP-complete problem reduces to it (no polynomial algorithm is known).' : 'Every NP problem reduces to it, but it is undecidable.');
};
const L61_BANK = [
  mcq('NP stands for…', 'nondeterministic polynomial time', ['non-polynomial', 'not P', 'normal polynomial'], 'Solvable in polynomial time by a nondeterministic algorithm.'),
  mcq('A problem is NP-complete if it is…', 'in NP and NP-hard', ['in P and NP', 'NP-hard only', 'not in NP'], 'Both conditions.'),
  mcq('To prove X is NP-hard, you reduce…', 'a known NP-complete problem to X', ['X to a known NP-complete problem', 'X to a problem in P', 'any problem to SAT'], 'Direction matters: the known hard problem is transformed into X.'),
  mcq("Cook's theorem states that…", 'SAT is NP-complete', ['P = NP', 'TSP is in P', 'every problem is decidable'], 'Cook, 1971.'),
  mcq('If a polynomial-time algorithm were found for one NP-complete problem…', 'every problem in NP would be solvable in polynomial time (P = NP)', ['only that problem would become easy', 'nothing would change', 'NP-hard problems would become undecidable'], 'All of NP reduces to it.'),
  mcq('Which relation is known to hold?', 'P ⊆ NP', ['P = NP', 'NP ⊆ P', 'P ∩ NP = ∅'], 'The rest is open.'),
  mcq('Why is the Θ(nW) knapsack DP not a polynomial-time algorithm?', 'W is exponential in the number of bits used to write it', ['It uses recursion', 'n can be large', 'It is greedy'], 'Pseudo-polynomial.'),
  mcq('A certificate for "graph G has a vertex cover of size ≤ k" is…', 'a set of ≤ k vertices covering every edge', ['the number k', 'an adjacency matrix', 'a spanning tree'], 'Checked in O(V + E).'),
  tf('Every NP-complete problem is NP-hard.', true, 'By definition.'),
  tf('Every NP-hard problem is in NP.', false, 'The halting problem is NP-hard but not in NP.'),
  tf('Decision problems are used because optimisation problems can be phrased as yes/no questions with a bound k.', true, 'Hardness transfers between the versions.'),
];

const L61: Level = {
  id: 'L61',
  n: 61,
  world: 13,
  title: 'P, NP, NP-hard & NP-complete',
  blurb: 'Polynomial vs non-polynomial time, decision problems, nondeterministic algorithms and certificates, reductions, Cook\'s theorem, and the class map.',
  syllabus: ['DAA U6 · Complexity measures', 'DAA U6 · Polynomial vs non-polynomial time', 'DAA U6 · NP-hard and NP-complete classes'],
  snippets: [],
  Lesson: L61Lesson,
  quiz: [classQ, classQ, classQ, bank(L61_BANK), bank(L61_BANK), bank(L61_BANK), bank(L61_BANK), bank(L61_BANK)],
  cards: [
    { q: 'NP-hard vs NP-complete?', a: 'NP-hard: every NP problem reduces to it. NP-complete: NP-hard and in NP.' },
    { q: 'How to prove X NP-complete?', a: 'Show X ∈ NP (polynomial verifier) and reduce a known NP-complete problem to X.' },
  ],
  refs: ['Horowitz, Sahni & Rajasekaran, Computer Algorithms — chapter "NP-Hard and NP-Complete Problems" (nondeterministic algorithms, Cook\'s theorem, reducibility).', 'Cormen et al., Introduction to Algorithms 3e — Ch. 34 NP-Completeness.', 'Cook, "The complexity of theorem-proving procedures", STOC 1971.'],
};

/* =====================================================================
   Level 62 — Circuit-SAT, vertex cover, subset sum
   ===================================================================== */

function L62Lesson() {
  return (
    <>
      <Sec title="Circuit satisfiability">
        <p>
          A Boolean combinational circuit has inputs, AND/OR/NOT gates and one output. <b>CIRCUIT-SAT</b>: is there an input assignment that makes the output 1?
        </p>
        <ul>
          <li>In NP: given an assignment (the certificate), evaluate the gates in topological order — linear time.</li>
          <li>
            NP-hard: any polynomial-time verifier for an NP problem can be "compiled" into a polynomial-size circuit whose inputs are the certificate bits, so every NP
            problem reduces to CIRCUIT-SAT (CLRS's starting point, equivalent in role to Cook's SAT).
          </li>
        </ul>
      </Sec>
      <AlgoViz
        title="Evaluate a circuit on a certificate"
        note="circuit: 1, 2 or 3. inputs: a bit string such as 101."
        fields={[
          { name: 'c', label: 'circuit', initial: '1', width: 80 },
          { name: 'b', label: 'inputs', initial: '101', width: 100 },
        ]}
        build={(v) => {
          const c = NP.CIRCUITS[int(v.c, 'circuit', 1, 3) - 1];
          const bits = v.b.trim().split('').map(Number);
          if (bits.length !== c.inputs.length || bits.some((x) => x !== 0 && x !== 1)) throw new Error(`Give ${c.inputs.length} bits (0/1) for ${c.inputs.join(', ')}.`);
          return NP.circuitFrames(c, bits);
        }}
      />
      <Sec title="The reduction chain (CLRS)">
        <F>CIRCUIT-SAT → SAT → 3-CNF-SAT → CLIQUE → VERTEX-COVER → HAM-CYCLE → TSP,   and 3-CNF-SAT → SUBSET-SUM</F>
        <p>Each arrow is a polynomial-time reduction "from the left problem to the right one", so every problem in the chain is NP-complete.</p>
      </Sec>
      <Sec title="Vertex cover">
        <p>
          A <b>vertex cover</b> of G = (V, E) is a set S ⊆ V touching every edge. VERTEX-COVER: does G have one of size ≤ k? In NP (check every edge). NP-hard by
          CLIQUE ≤ₚ VERTEX-COVER: G has a clique of size k ⇔ the complement graph Ḡ has a vertex cover of size |V| − k. (Equivalently S is a vertex cover ⇔ V − S is
          an independent set.)
        </p>
        <p>
          A 2-approximation exists: repeatedly pick an uncovered edge and take <b>both</b> endpoints (CLRS APPROX-VERTEX-COVER) — at most twice the optimum, because
          the chosen edges form a matching and any cover needs one endpoint of each.
        </p>
      </Sec>
      <AlgoViz
        title="Check a vertex-cover certificate"
        fields={[...gFields(6, '0-1, 0-2, 1-2, 1-3, 2-4, 3-4, 3-5, 4-5'), { name: 's', label: 'certificate S', initial: '1, 2, 3, 4', width: 140 }]}
        build={(v) => {
          const g = readG(v, false, 8);
          const S = nums(v.s, { min: 0, max: g.n - 1, minLen: 0, maxLen: g.n });
          return NP.vcFrames(g, S);
        }}
      />
      <Sec title="Subset sum">
        <p>
          SUBSET-SUM: given positive integers and a target t, is there a subset summing exactly to t? In NP (add up the certificate). NP-hard via 3-CNF-SAT ≤ₚ
          SUBSET-SUM, which builds numbers with one digit per variable and per clause. The O(n·t) DP (Level 61's widget) is only pseudo-polynomial.
        </p>
      </Sec>
    </>
  );
}

const circuitQ: QGen = (rng) => {
  const c = rng.pick(NP.CIRCUITS);
  if (rng.chance(0.5)) {
    const bits = c.inputs.map(() => rng.int(0, 1));
    return num(`${c.name}. Output for ${c.inputs.map((x, i) => `${x} = ${bits[i]}`).join(', ')}?`, NP.circuitOut(c, bits), 'Evaluate the gates in order.');
  }
  return num(`${c.name}. How many of the ${2 ** c.inputs.length} input assignments satisfy it?`, NP.satisfyingAssignments(c).length, `Satisfying: ${NP.satisfyingAssignments(c).map((b) => b.join('')).join(', ') || 'none'}.`);
};
const vcQ: QGen = (rng) => {
  const g = G.randomGraph(rng, rng.int(5, 6), rng.int(5, 8));
  const scene = G.graphStatic(g, false);
  if (rng.chance(0.5)) {
    const S = rng.distinct(rng.int(2, 4), 0, g.n - 1).sort((a, b) => a - b);
    const ok = NP.isVertexCover(g, S);
    return mcq(`Is S = {${S.join(', ')}} a vertex cover of this graph?`, ok ? 'Yes' : 'No', [ok ? 'No' : 'Yes'], ok ? 'Every edge has an endpoint in S.' : `Edge ${g.edges.find((e) => !S.includes(e.u) && !S.includes(e.v))!.u}–${g.edges.find((e) => !S.includes(e.u) && !S.includes(e.v))!.v} is uncovered.`, { scene });
  }
  const m = NP.minVertexCover(g);
  return num('Size of a minimum vertex cover of this graph?', m.length, `E.g. {${m.join(', ')}} (brute force over all subsets).`, { scene });
};
const ssQ: QGen = (rng) => {
  const a = rng.distinct(rng.int(5, 6), 2, 30);
  const t = rng.int(10, 60);
  const yes = NP.subsetSumDP(a, t);
  return mcq(`SUBSET-SUM: numbers {${a.join(', ')}}, target ${t}. Is there a subset with sum exactly ${t}?`, yes ? 'Yes' : 'No', [yes ? 'No' : 'Yes'], yes ? `${NP.subsetSumCount(a, t)} subset(s) work.` : 'No subset reaches it exactly.');
};
const L62_BANK = [
  mcq('Why is CIRCUIT-SAT in NP?', 'A given input assignment can be checked by evaluating the gates in polynomial time', ['It can be solved in polynomial time', 'Circuits have no cycles', 'Every circuit is satisfiable'], 'Polynomial verification.'),
  mcq('S is a vertex cover of G if and only if V − S is…', 'an independent set', ['a clique', 'a spanning tree', 'a vertex cover too'], 'No edge has both endpoints outside a cover.'),
  mcq('CLIQUE reduces to VERTEX-COVER using…', 'the complement graph: clique of size k ⇔ vertex cover of size |V| − k in Ḡ', ['a spanning tree', 'shortest paths', 'sorting the vertices'], 'CLRS Theorem 34.12.'),
  mcq('The approximation algorithm that takes both endpoints of uncovered edges guarantees a cover of size at most…', '2 × optimum', ['optimum', 'log n × optimum', 'n'], 'Its edges form a matching.'),
  mcq('SUBSET-SUM is shown NP-hard by reducing from…', '3-CNF-SAT', ['sorting', 'MST', 'shortest paths'], 'CLRS §34.5.5.'),
  mcq('In the CLRS chain, which problem comes first?', 'CIRCUIT-SAT', ['TSP', 'SUBSET-SUM', 'VERTEX-COVER'], 'Everything is reduced from it.'),
  tf('A polynomial-time algorithm for VERTEX-COVER would imply P = NP.', true, 'It is NP-complete.'),
  tf('Subset sum can be solved in O(n·t), so it is in P.', false, 'O(n·t) is pseudo-polynomial: exponential in the bits of t.'),
];

const L62: Level = {
  id: 'L62',
  n: 62,
  world: 13,
  title: 'Circuit-SAT, Vertex Cover & Subset Sum',
  blurb: 'Three NP-complete problems: why each is in NP, the reduction chain that makes them NP-hard, certificates you can check by hand, and a 2-approximation.',
  syllabus: ['DAA U6 · Examples: circuit satisfiability, vertex cover, subset sum'],
  snippets: [],
  Lesson: L62Lesson,
  quiz: [circuitQ, circuitQ, vcQ, vcQ, ssQ, ssQ, bank(L62_BANK), bank(L62_BANK)],
  cards: [
    { q: 'CLRS NP-completeness chain?', a: 'CIRCUIT-SAT → SAT → 3-CNF-SAT → CLIQUE → VERTEX-COVER → HAM-CYCLE → TSP; 3-CNF-SAT → SUBSET-SUM.' },
    { q: 'Vertex cover ↔ independent set ↔ clique?', a: 'S cover ⇔ V − S independent ⇔ V − S is a clique in the complement graph.' },
  ],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §34.3 Circuit satisfiability, §34.5 NP-complete problems (clique, vertex cover, subset sum), §35.1 Approximate vertex cover.', 'Horowitz, Sahni & Rajasekaran, Computer Algorithms — "NP-Hard and NP-Complete Problems": NP-hard graph problems (node cover).'],
};

export default [L61, L62];
