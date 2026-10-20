import { useMemo, useState } from 'react';
import type { Frame, Level, QGen, Scene, SNode, SEdge } from '../core/types';
import { Sec, Callout, Table, F, Code, Viz } from '../core/lesson';
import { AlgoViz, nums, int } from '../core/vizkit';
import { Player } from '../core/Player';
import { mcq, num, seq, tf, bank } from '../core/qhelp';
import * as D from '../engines/dc';
import { grid } from '../core/layouts';

/* =====================================================================
   Level 18 — Solving recurrences
   ===================================================================== */

const sup = (k: number) => (k === 1 ? '' : String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]));

function recTreeFrames(a: number, b: number, k: number): Frame[] {
  const F: Frame[] = [];
  const nodes: SNode[] = [];
  const edges: SEdge[] = [];
  const W = Math.max(560, a * a * 64 + 120);
  const levelY = (i: number) => 50 + i * 80;
  const label = (i: number) => (i === 0 ? `n${sup(k)}` : k === 0 ? '1' : `(n/${b ** i})${sup(k)}`);
  const r = a / b ** k;
  const sumTxt = (i: number) => (i === 0 ? `n${sup(k)}` : `${a ** i}·(n/${b ** i})${sup(k)} = ${fmtR(r ** i)}·n${sup(k)}`);
  let prev: string[] = [];
  for (let i = 0; i <= 2; i++) {
    const cnt = a ** i;
    const ids: string[] = [];
    for (let j = 0; j < cnt; j++) {
      const id = `t${i}-${j}`;
      ids.push(id);
      nodes.push({ id, x: 60 + ((j + 0.5) * (W - 260)) / cnt, y: levelY(i), w: Math.min(64, (W - 260) / cnt - 4), h: 30, shape: 'rect', label: label(i), fontSize: cnt > 9 ? 9 : 12 });
      if (i > 0) edges.push({ from: prev[Math.floor(j / a)], to: id });
    }
    nodes.push({ id: `sum${i}`, x: W - 190, y: levelY(i), shape: 'text', label: `level ${i}: ${sumTxt(i)}`, anchor: 'start', tone: 'accent', fontSize: 12 });
    prev = ids;
    F.push({
      scene: { w: W, h: 340, nodes: nodes.slice(), edges: edges.slice() },
      say: i === 0 ? `Root: the non-recursive work f(n) = n${sup(k)}.` : `Level ${i}: ${a ** i} subproblems of size n/${b ** i}; total ${sumTxt(i)}.`,
      vars: { 'ratio a/bᵏ': fmtR(r) },
    });
  }
  const c = Math.log(a) / Math.log(b);
  nodes.push({ id: 'dots', x: (W - 260) / 2 + 60, y: levelY(3) - 10, shape: 'text', label: '⋮', tone: 'muted', fontSize: 18 });
  nodes.push({ id: 'leaves', x: 40, y: levelY(3) + 30, shape: 'text', label: `depth log_${b} n · leaves: a^(log_${b} n) = n^(log_${b} ${a}) = n^${round3(c)}`, anchor: 'start', tone: 'muted', fontSize: 12 });
  const verdict =
    Math.abs(r - 1) < 1e-9
      ? `Ratio a/bᵏ = 1: every level costs n${sup(k)} and there are ≈ log_${b} n levels ⇒ Θ(n${sup(k)} log n).`
      : r < 1
        ? `Ratio ${fmtR(r)} < 1: level costs shrink geometrically, the root dominates ⇒ Θ(n${sup(k)}).`
        : `Ratio ${fmtR(r)} > 1: level costs grow geometrically, the leaves dominate ⇒ Θ(n^${round3(c)}) = Θ(n^(log_${b} ${a})).`;
  F.push({ scene: { w: W, h: 340, nodes: nodes.slice(), edges: edges.slice() }, say: verdict, vars: { 'ratio a/bᵏ': fmtR(r) }, sfx: 'found' });
  return F;
}
const fmtR = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(3).replace(/0+$/, ''));
const round3 = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(3));

function L18Lesson() {
  return (
    <>
      <Sec title="Recurrences describe recursive algorithms">
        <p>A recurrence expresses T(n) in terms of T on smaller inputs plus the non-recursive work:</p>
        <Table
          head={['Algorithm', 'Recurrence', 'Solution']}
          rows={[
            ['Binary search', 'T(n) = T(n/2) + 1', 'Θ(log n)'],
            ['Linear recursion (e.g. recursive linear search)', 'T(n) = T(n − 1) + 1', 'Θ(n)'],
            ['Recursive selection sort', 'T(n) = T(n − 1) + n', 'Θ(n²)'],
            ['Merge sort', 'T(n) = 2T(n/2) + n', 'Θ(n log n)'],
            ['Tower of Hanoi', 'T(n) = 2T(n − 1) + 1', 'Θ(2ⁿ)'],
          ]}
        />
        <p>Your Recurrence deck lists four methods: substitution, iteration, recursion tree and the Master theorem (next level).</p>
      </Sec>
      <Sec title="1. Iteration (unrolling) method">
        <p>Expand the recurrence until a pattern appears, then sum it:</p>
        <F>
          T(n) = T(n−1) + n = T(n−2) + (n−1) + n = … = T(1) + 2 + 3 + … + n = n(n+1)/2  (with T(1) = 1)  ⇒ Θ(n²)
        </F>
        <F>
          T(n) = 2T(n/2) + n = 4T(n/4) + 2n = 8T(n/8) + 3n = … = 2ᵏT(n/2ᵏ) + kn; at 2ᵏ = n: T(n) = n·T(1) + n log₂ n ⇒ Θ(n log n)
        </F>
      </Sec>
      <Sec title="2. Substitution method">
        <p>Guess the form, then prove it by induction (finding the constants as you go).</p>
        <p>
          Example: T(n) = 2T(⌊n/2⌋) + n. Guess T(n) ≤ c·n log₂ n. Assume it holds for ⌊n/2⌋:
        </p>
        <F>T(n) ≤ 2·c(n/2)·log₂(n/2) + n = c·n log₂ n − c·n + n ≤ c·n log₂ n  whenever c ≥ 1.</F>
        <p>
          Then check the base cases (n = 2, 3 work for c ≥ 2, since T(1) is a constant and log 1 = 0 can't bound it — that's why n₀ is chosen past 1).
        </p>
        <Callout kind="pitfall">
          <p>
            The induction must prove <i>exactly</i> the guessed form. "T(n) ≤ cn + n = O(n)" is not a proof of T(n) ≤ cn — the constant must not grow.
          </p>
        </Callout>
      </Sec>
      <Sec title="3. Recursion tree method">
        <p>
          Draw the calls as a tree, write each node's non-recursive cost, sum each level, then sum the levels. For T(n) = a·T(n/b) + nᵏ the level-i total is
          aⁱ·(n/bⁱ)ᵏ = (a/bᵏ)ⁱ·nᵏ — a geometric series with ratio a/bᵏ. Whether it shrinks, stays flat or grows decides the answer (and is exactly the
          Master theorem's three cases).
        </p>
      </Sec>
      <AlgoViz
        title="Grow a recursion tree for T(n) = a·T(n/b) + nᵏ"
        fields={[
          { name: 'a', label: 'a (1–4)', initial: '3', width: 70 },
          { name: 'b', label: 'b (2–4)', initial: '4', width: 70 },
          { name: 'k', label: 'k (0–3)', initial: '2', width: 70 },
        ]}
        build={(v) => recTreeFrames(int(v.a, 'a', 1, 4), int(v.b, 'b', 2, 4), int(v.k, 'k', 0, 3))}
      />
      <Callout kind="exam">
        <p>Exam favourites: T(n) = 3T(n/4) + cn² (tree: Θ(n²)), T(n) = T(n/3) + T(2n/3) + n (uneven tree: Θ(n log n)), T(n) = 2T(n/2) + n (all three methods).</p>
      </Callout>
    </>
  );
}

const exactQ: QGen = (rng) => {
  const kind = rng.int(0, 3);
  if (kind === 0) {
    const m = rng.int(2, 6);
    const n = 2 ** m;
    return num(`T(n) = 2T(n/2) + n, T(1) = 1. Compute T(${n}).`, D.evalDividing(2, 2, (x) => x, n), `Iteration gives T(n) = n log₂ n + n = ${n}·${m} + ${n} = ${n * m + n}.`);
  }
  if (kind === 1) {
    const n = rng.int(5, 30);
    return num(`T(n) = T(n − 1) + n, T(1) = 1. Compute T(${n}).`, (n * (n + 1)) / 2, `T(n) = 1 + 2 + … + n = n(n+1)/2 = ${(n * (n + 1)) / 2}.`);
  }
  if (kind === 2) {
    const m = rng.int(2, 10);
    const n = 2 ** m;
    return num(`T(n) = T(n/2) + 1, T(1) = 1. Compute T(${n}).`, m + 1, `T(n) = log₂ n + 1 = ${m + 1}.`);
  }
  const n = rng.int(3, 12);
  return num(`T(n) = 2T(n − 1) + 1, T(1) = 1. Compute T(${n}).`, 2 ** n - 1, `T(n) = 2ⁿ − 1 = ${2 ** n - 1}.`);
};
const levelQ: QGen = (rng) => {
  const a = rng.int(2, 4);
  const b = rng.pick([2, 3, 4]);
  const k = rng.int(1, 2);
  const i = rng.int(1, 3);
  const coef = a ** i / b ** (k * i);
  const ans = `${fmtR(coef)}·n${sup(k)}`;
  return mcq(`In the recursion tree of T(n) = ${a}T(n/${b}) + n${sup(k)}, what is the total cost of level ${i} (root = level 0)?`, ans, [`${fmtR(a ** i)}·n${sup(k)}`, `${fmtR(1 / b ** (k * i))}·n${sup(k)}`, `${fmtR((a / b) ** i)}·n${sup(k)}`].filter((x) => x !== ans), `${a}^${i} nodes, each (n/${b}^${i})${sup(k)}: (${a}/${b}${sup(k)})^${i}·n${sup(k)} = ${ans}.`);
};
const L18_BANK = [
  mcq('Recurrence of binary search?', 'T(n) = T(n/2) + 1', ['T(n) = 2T(n/2) + 1', 'T(n) = T(n − 1) + 1', 'T(n) = 2T(n/2) + n'], 'One comparison, one half-size subproblem.'),
  mcq('Unrolling T(n) = T(n − 1) + n gives…', 'Θ(n²)', ['Θ(n)', 'Θ(n log n)', 'Θ(2ⁿ)'], 'n + (n−1) + … + 1 = n(n+1)/2.'),
  mcq('T(n) = T(n − 1) + 1 solves to…', 'Θ(n)', ['Θ(log n)', 'Θ(n²)', 'Θ(1)'], 'n − 1 additions of 1.'),
  mcq('Depth of the recursion tree of T(n) = aT(n/b) + f(n)?', 'log_b n', ['log_a n', 'n/b', 'a·b'], 'Size shrinks by a factor b per level.'),
  mcq('Number of leaves of the recursion tree of T(n) = aT(n/b) + f(n)?', 'n^(log_b a)', ['a^n', 'n·a', 'log_b a'], 'a^(log_b n) = n^(log_b a).'),
  mcq('The substitution method consists of…', 'guessing the solution and proving it by induction', ['drawing the tree', 'applying three cases', 'running the program'], 'From your Recurrence deck.'),
  mcq('T(n) = 3T(n/4) + n²: level i of the tree costs (3/16)ⁱ n². The total is…', 'Θ(n²)', ['Θ(n² log n)', 'Θ(n^(log₄ 3))', 'Θ(n³)'], 'A decreasing geometric series is dominated by its first term.'),
  mcq('T(n) = T(n/3) + T(2n/3) + n solves to…', 'Θ(n log n)', ['Θ(n)', 'Θ(n²)', 'Θ(log n)'], 'Each full level costs n; the longest path has log₃/₂ n levels.'),
  tf('In a recursion tree, if every level costs the same, the total is (cost per level) × (number of levels).', true, 'That is the n log n pattern of merge sort.'),
];

const L18: Level = {
  id: 'L18',
  n: 18,
  world: 5,
  title: 'Solving Recurrences',
  blurb: 'Where recurrences come from, and three methods to solve them: iteration, substitution (induction) and recursion trees.',
  syllabus: ['DAA U2 · Analysis of D&C run-time recurrence relations', 'DAA U1 · Run-time analysis'],
  snippets: [],
  Lesson: L18Lesson,
  quiz: [exactQ, exactQ, exactQ, levelQ, levelQ, bank(L18_BANK), bank(L18_BANK), bank(L18_BANK), bank(L18_BANK)],
  cards: [
    { q: 'T(n) = 2T(n/2) + n, T(1) = 1, exact?', a: 'n log₂ n + n' },
    { q: 'Recursion-tree level i cost for aT(n/b) + nᵏ?', a: '(a/bᵏ)ⁱ · nᵏ — geometric with ratio a/bᵏ.' },
  ],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §4.3 Substitution, §4.4 Recursion trees.', 'Your DAA deck "5. Recurrence Relation" (substitution, iteration, recursion tree, master method).'],
};

/* =====================================================================
   Level 19 — Master theorem
   ===================================================================== */

function MasterCalc() {
  const [a, setA] = useState('2');
  const [b, setB] = useState('2');
  const [k, setK] = useState('1');
  const [p, setP] = useState('0');
  const res = useMemo(() => {
    const A = Number(a), B = Number(b), K = Number(k), P = Number(p);
    if (!(A >= 1 && A <= 64 && B > 1 && B <= 16 && K >= 0 && K <= 4 && Number.isInteger(P) && P >= -3 && P <= 3)) return null;
    const r = D.masterDividing(A, B, K, P);
    return { r, c: Math.log(A) / Math.log(B) };
  }, [a, b, k, p]);
  return (
    <Viz title="Master theorem calculator: T(n) = a·T(n/b) + Θ(nᵏ logᵖ n)">
      <div className="inputbar">
        {[['a ≥ 1', a, setA], ['b > 1', b, setB], ['k ≥ 0', k, setK], ['p (−3..3)', p, setP]].map(([l, v, s]) => (
          <label key={l as string}>
            <span>{l as string}</span>
            <input value={v as string} onChange={(e) => (s as (x: string) => void)(e.target.value)} style={{ minWidth: 70, width: 70 }} />
          </label>
        ))}
      </div>
      {res ? (
        <div className="formula">
          log_b a = log_{b} {a} = {round3(res.c)} {Math.abs(res.c - Number(k)) < 1e-9 ? '=' : res.c > Number(k) ? '>' : '<'} k = {k}
          <br />
          {res.r.case}
          <br />
          <b style={{ color: 'var(--accent)' }}>T(n) = {res.r.answer}</b>
        </div>
      ) : (
        <p className="input-err">Use 1 ≤ a ≤ 64, 1 &lt; b ≤ 16, 0 ≤ k ≤ 4, integer p in −3..3.</p>
      )}
    </Viz>
  );
}

function L19Lesson() {
  return (
    <>
      <Sec title="Master theorem (CLRS form)">
        <p>
          For T(n) = a·T(n/b) + f(n) with constants a ≥ 1, b &gt; 1 and f asymptotically positive, compare f(n) with the <b>watershed</b> n^(log_b a) (the
          leaf cost):
        </p>
        <Table
          head={['Case', 'Condition', 'Result']}
          rows={[
            ['1', 'f(n) = O(n^(log_b a − ε)) for some ε > 0 (leaves dominate)', 'Θ(n^(log_b a))'],
            ['2', 'f(n) = Θ(n^(log_b a))', 'Θ(n^(log_b a) · log n)'],
            ['3', 'f(n) = Ω(n^(log_b a + ε)) and a·f(n/b) ≤ c·f(n) for some c < 1 (regularity)', 'Θ(f(n))'],
          ]}
        />
        <p>
          The ε means f must be <b>polynomially</b> smaller or larger. T(n) = 2T(n/2) + n/log n falls in the gap between cases 1 and 2 — the CLRS form can't
          solve it.
        </p>
      </Sec>
      <Sec title="Extended form (as in your Recurrence deck)">
        <p>For f(n) = Θ(nᵏ logᵖ n), compare log_b a with k:</p>
        <Table
          head={['Comparison', 'Sub-case', 'T(n)']}
          rows={[
            ['log_b a > k', '—', 'Θ(n^(log_b a))'],
            ['log_b a = k', 'p > −1', 'Θ(nᵏ log^(p+1) n)'],
            ['', 'p = −1', 'Θ(nᵏ log log n)'],
            ['', 'p < −1', 'Θ(nᵏ)'],
            ['log_b a < k', 'p ≥ 0', 'Θ(nᵏ logᵖ n)'],
            ['', 'p < 0', 'O(nᵏ)'],
          ]}
        />
        <p>This covers n/log n (p = −1): T(n) = 2T(n/2) + n/log n = Θ(n log log n).</p>
      </Sec>
      <MasterCalc />
      <Sec title="Master theorem for decreasing functions">
        <p>For T(n) = a·T(n − b) + f(n) with a &gt; 0, b &gt; 0 and f(n) = O(nᵏ), k ≥ 0 (your deck's slide 31):</p>
        <Table
          head={['a', 'T(n)']}
          rows={[
            ['a < 1', 'O(nᵏ)'],
            ['a = 1', 'O(nᵏ⁺¹) — i.e. O(n·f(n))'],
            ['a > 1', 'O(nᵏ · a^(n/b)) — i.e. O(f(n)·a^(n/b))'],
          ]}
        />
        <Callout kind="convention" title="It gives upper bounds">
          <p>
            The decreasing form is stated with O. For a = 1 it is tight (T(n) = T(n−1) + n is Θ(n²)). For a &gt; 1 it can overshoot: T(n) = 2T(n−1) + n is
            actually Θ(2ⁿ), not Θ(n·2ⁿ), because Σ i/2ⁱ converges. If an exam asks "by the master theorem for decreasing functions", give the O-bound; if it asks
            for the tight bound, unroll.
          </p>
        </Callout>
        <p>Your deck's exercises: T(n) = 2T(n−1) + log n → O(2ⁿ log n); T(n) = 2T(n−4) + n → O(n·2^(n/4)); T(n) = 3T(n−2) + log n → O(3^(n/2) log n).</p>
      </Sec>
      <Sec title="When it does not apply">
        <ul>
          <li>a not a constant (T(n) = 2ⁿT(n/2) + nⁿ), or a &lt; 1 (T(n) = 0.5T(n/2) + 1/n).</li>
          <li>f(n) not positive (T(n) = 64T(n/8) − n² log n).</li>
          <li>Subproblems of unequal size (T(n) = T(n/3) + T(2n/3) + n) — use a recursion tree (or Akra–Bazzi).</li>
          <li>CLRS form only: f in the gap between cases (n/log n), or case 3 failing regularity.</li>
        </ul>
      </Sec>
    </>
  );
}

const masterQ: QGen = (rng) => {
  const a = rng.pick([1, 2, 3, 4, 7, 8, 9, 16]);
  const b = rng.pick([2, 3, 4]);
  const k = rng.int(0, 3);
  const p = rng.pick([0, 0, 0, 1, -1, 2]);
  const r = D.masterDividing(a, b, k, p);
  const c = Math.log(a) / Math.log(b);
  const fstr = `${k === 0 ? '' : k === 1 ? 'n' : `n^${k}`}${p === 0 ? (k === 0 ? '1' : '') : `${k === 0 ? '' : ' '}${p === -1 ? '/ log n' : p === 1 ? 'log n' : `log^${p} n`}`}`.replace(/^\/ /, '1/');
  const wrongs = [D.thetaStr(k, p + 1), D.thetaStr(k, p), `Θ(n^${round3(c)})`, D.thetaStr(k, 0), `Θ(n^${round3(c)} log n)`].filter((x) => x !== r.answer);
  return mcq(`Solve T(n) = ${a === 1 ? '' : a}T(n/${b}) + ${fstr} using the Master theorem.`, r.answer, [...new Set(wrongs)].slice(0, 3), `${r.case} ⇒ ${r.answer}.`);
};
const decQ: QGen = (rng) => {
  const a = rng.pick([1, 1, 2, 3]);
  const b = rng.pick([1, 1, 2]);
  const k = rng.int(0, 2);
  const ans = D.masterDecreasing(a, b, k);
  const f = k === 0 ? '1' : k === 1 ? 'n' : 'n^2';
  const wrongs = [D.masterDecreasing(1, b, k), D.masterDecreasing(2, b, k), `O(n^${k})`, `O(${a}^n)`, D.masterDecreasing(a, b, k + 1)].filter((x) => x !== ans);
  return mcq(`By the Master theorem for decreasing functions, T(n) = ${a === 1 ? '' : a}T(n − ${b}) + ${f} is…`, ans, [...new Set(wrongs)].slice(0, 3), `a ${a < 1 ? '< 1' : a === 1 ? '= 1 ⇒ O(n^(k+1))' : '> 1 ⇒ O(n^k · a^(n/b))'} with k = ${k}: ${ans}.`);
};
const caseQ: QGen = (rng) => {
  const a = rng.pick([2, 4, 8, 9]);
  const b = rng.pick([2, 3]);
  const k = rng.int(1, 3);
  const c = Math.log(a) / Math.log(b);
  const which = Math.abs(c - k) < 1e-9 ? 'Case 2 (f = Θ(n^(log_b a)))' : c > k ? 'Case 1 (leaves dominate)' : 'Case 3 (root dominates)';
  return mcq(`Which Master-theorem case applies to T(n) = ${a}T(n/${b}) + n^${k}?`, which, ['Case 1 (leaves dominate)', 'Case 2 (f = Θ(n^(log_b a)))', 'Case 3 (root dominates)', 'Not applicable'].filter((x) => x !== which), `log_${b} ${a} = ${round3(c)} vs k = ${k}.`);
};
const L19_BANK = [
  mcq('Can the CLRS Master theorem solve T(n) = 2T(n/2) + n/log n?', 'No — f falls between cases 1 and 2 (not polynomially smaller)', ['Yes, case 1', 'Yes, case 2', 'Yes, case 3'], 'The extended form gives Θ(n log log n).'),
  mcq('T(n) = 2T(n/2) + n/log n (extended Master theorem)?', 'Θ(n log log n)', ['Θ(n log n)', 'Θ(n)', 'Θ(n/log n)'], 'log₂ 2 = 1 = k and p = −1.'),
  mcq('Which recurrence is NOT solvable by the Master theorem?', 'T(n) = T(n/3) + T(2n/3) + n', ['T(n) = 4T(n/2) + n', 'T(n) = T(n/2) + 1', 'T(n) = 3T(n/4) + n²'], 'Unequal subproblem sizes.'),
  mcq('Strassen\'s recurrence T(n) = 7T(n/2) + Θ(n²) gives…', 'Θ(n^log₂7) ≈ Θ(n^2.81)', ['Θ(n³)', 'Θ(n² log n)', 'Θ(n²)'], 'log₂ 7 ≈ 2.807 > 2: case 1.'),
  mcq('Case 3 of the CLRS Master theorem additionally requires…', 'the regularity condition a·f(n/b) ≤ c·f(n) for some c < 1', ['a = b', 'f(n) to be a polynomial', 'n to be a power of 2'], 'It guarantees the root really dominates.'),
  mcq('T(n) = T(n − 1) + n² by the decreasing master theorem?', 'O(n³)', ['O(n²)', 'O(2ⁿ)', 'O(n² log n)'], 'a = 1 ⇒ O(n^(k+1)).'),
  tf('T(n) = 2T(n − 1) + n is Θ(n·2ⁿ).', false, 'The decreasing theorem gives the upper bound O(n·2ⁿ), but unrolling shows Θ(2ⁿ).'),
];

const L19: Level = {
  id: 'L19',
  n: 19,
  world: 5,
  title: 'The Master Theorem',
  blurb: 'Dividing recurrences (CLRS form and the extended nᵏ logᵖ n form from your deck), decreasing recurrences, and when the theorem does not apply.',
  syllabus: ["DAA U1 · Master's theorem", 'DAA U2 · D&C recurrence relations'],
  snippets: [],
  Lesson: L19Lesson,
  quiz: [masterQ, masterQ, masterQ, masterQ, decQ, decQ, caseQ, bank(L19_BANK), bank(L19_BANK)],
  cards: [
    { q: 'Extended Master theorem, log_b a = k?', a: 'p > −1: Θ(nᵏ log^(p+1) n); p = −1: Θ(nᵏ log log n); p < −1: Θ(nᵏ).' },
    { q: 'Decreasing master theorem?', a: 'T(n) = aT(n−b) + O(nᵏ): a<1 O(nᵏ); a=1 O(nᵏ⁺¹); a>1 O(nᵏ·a^(n/b)).' },
  ],
  refs: [
    'Cormen et al., Introduction to Algorithms 3e — §4.5 The master method (Theorem 4.1).',
    'GeeksforGeeks — "Advanced master theorem for divide and conquer recurrences" and "Master theorem for subtract and conquer recurrences".',
    'Your DAA deck "5. Recurrence Relation" (slides 31–48: decreasing and dividing master theorems).',
  ],
};

/* =====================================================================
   Level 20 — Merge sort
   ===================================================================== */

function L20Lesson() {
  return (
    <>
      <Sec title="Divide and conquer">
        <p>Your DAA deck's three parts of every divide-and-conquer algorithm:</p>
        <ol className="steps">
          <li>
            <b>Divide</b> the problem into subproblems that are smaller instances of the same problem.
          </li>
          <li>
            <b>Conquer</b> the subproblems recursively (small enough ones directly — the base case).
          </li>
          <li>
            <b>Combine</b> the sub-solutions into a solution of the original.
          </li>
        </ol>
        <F>T(n) = a·T(n/b) + D(n) + C(n)   (divide cost D, combine cost C)</F>
        <p>Merge sort: divide = find the middle (O(1)), conquer = sort both halves, combine = merge (Θ(n)). So T(n) = 2T(n/2) + Θ(n) = Θ(n log n).</p>
      </Sec>
      <Sec title="The algorithm">
        <Code id="merge_sort" />
        <ul>
          <li>Θ(n log n) in the best, average and worst case — the split doesn't depend on the data.</li>
          <li>
            <b>Stable</b>: on ties, merge takes from the left half first (<code>L[i] &lt;= R[j]</code>). Using &lt; would break stability.
          </li>
          <li>
            <b>Not in-place</b>: Θ(n) extra memory for L and R, plus O(log n) recursion stack.
          </li>
          <li>Merging lists of sizes p and q takes at most p + q − 1 comparisons.</li>
          <li>Great for linked lists and external sorting (Level 36) because it only reads data sequentially.</li>
        </ul>
      </Sec>
      <AlgoViz
        title="Merge sort, step by step"
        fields={[{ name: 'a', label: 'array', initial: '38, 27, 43, 3, 9, 82, 10', random: (r) => r.ints(r.int(5, 8), 1, 90).join(', ') }]}
        build={(v) => D.mergeSortFrames(nums(v.a, { maxLen: 8 }))}
        code="merge_sort"
      />
      <Sec title="Iterative (bottom-up) merge sort — Lab Experiment 1">
        <p>Skip the recursion: merge runs of width 1 into sorted pairs, then pairs into fours, and so on. Same merge(), same Θ(n log n).</p>
        <Code id="merge_sort_iter" />
      </Sec>
    </>
  );
}

const mergeStateQ: QGen = (rng) => {
  const a = rng.distinct(rng.int(6, 8), 1, 60);
  const { merges } = D.mergeSort(a);
  const k = rng.int(2, 4);
  const b = a.slice();
  for (const [l, m, r] of merges.slice(0, k)) {
    const L = b.slice(l, m + 1);
    const R = b.slice(m + 1, r + 1);
    let i = 0;
    let j = 0;
    let t = l;
    while (i < L.length && j < R.length) b[t++] = L[i] <= R[j] ? L[i++] : R[j++];
    while (i < L.length) b[t++] = L[i++];
    while (j < R.length) b[t++] = R[j++];
  }
  return seq(`Recursive merge sort (mid = l + (r − l)/2) on [${a.join(', ')}]. Write the array after the first ${k} calls to merge().`, b, `The first ${k} merges are ${merges.slice(0, k).map(([l, m, r]) => `[${l}..${m}]+[${m + 1}..${r}]`).join(', ')}.`);
};
const mergeCompQ: QGen = (rng) => {
  const a = rng.distinct(rng.int(5, 8), 1, 60);
  const c = D.mergeSort(a).comps;
  return num(`How many element comparisons (L[i] <= R[j]) does merge sort make on [${a.join(', ')}]?`, c, `Summing comparisons over all merges gives ${c}.`);
};
const L20_BANK = [
  mcq('Merge sort\'s worst-case time?', 'Θ(n log n)', ['Θ(n²)', 'Θ(n)', 'Θ(log n)'], 'Same in every case.'),
  mcq('Extra space used by array merge sort?', 'Θ(n)', ['O(1)', 'Θ(log n)', 'Θ(n²)'], 'Temporary arrays for merging.'),
  mcq('Which comparison keeps merge sort stable?', 'L[i] <= R[j]', ['L[i] < R[j]', 'L[i] >= R[j]', 'R[j] <= L[i]'], 'On a tie, take from the left half first.'),
  mcq('The combine step of merge sort costs…', 'Θ(n)', ['Θ(1)', 'Θ(log n)', 'Θ(n log n)'], 'One merge pass over the subarray.'),
  mcq('Maximum comparisons when merging sorted lists of sizes p and q?', 'p + q − 1', ['p·q', 'max(p, q)', 'p + q + 1'], 'Each comparison outputs one element; the last element needs none.'),
  mcq('Recurrence for merge sort?', 'T(n) = 2T(n/2) + Θ(n)', ['T(n) = T(n/2) + Θ(1)', 'T(n) = T(n − 1) + Θ(n)', 'T(n) = 2T(n/2) + Θ(1)'], 'Two halves plus a linear merge.'),
  tf('Merge sort is an in-place sort.', false, 'It needs Θ(n) auxiliary memory for arrays.'),
];

const L20: Level = {
  id: 'L20',
  n: 20,
  world: 5,
  title: 'Merge Sort',
  blurb: 'The divide-and-conquer template, merging two sorted halves, why it is stable and Θ(n log n) always — recursive and bottom-up.',
  syllabus: ['DS U4 · Merge sort', 'DAA U2 · Structure of divide-and-conquer', 'DAA U2 · Merge sort'],
  snippets: ['merge_sort'],
  extraSnippets: ['merge_sort_iter'],
  Lesson: L20Lesson,
  quiz: [mergeStateQ, mergeStateQ, mergeStateQ, mergeCompQ, bank(L20_BANK), bank(L20_BANK), bank(L20_BANK), bank(L20_BANK)],
  cards: [
    { q: 'Merge sort cost, space, stability?', a: 'Θ(n log n) all cases; Θ(n) extra; stable (≤ takes left on ties).' },
    { q: 'Divide-and-conquer recurrence template?', a: 'T(n) = aT(n/b) + D(n) + C(n).' },
  ],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §2.3 Designing algorithms (merge sort).', 'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Merge sort (iterative and recursive).', 'Your DAA decks "6. Divide and Conquer", "10. merge sort" and Lab Experiment 1.'],
};

/* =====================================================================
   Level 21 — Quick sort
   ===================================================================== */

function L21Lesson() {
  return (
    <>
      <Sec title="Partition-exchange sort">
        <p>
          Quick sort picks a <b>pivot</b>, <b>partitions</b> the array so the pivot lands in its final sorted position with smaller-or-equal elements to its
          left and larger ones to its right, then sorts the two sides recursively. All the work is in the divide step; combine is free.
        </p>
        <p>
          The game teaches the version in your <code>11. QuickSort</code> deck: pivot = first element; <b>i</b> moves right while a[i] ≤ pivot, <b>j</b> moves
          left while a[j] &gt; pivot; if i &lt; j swap; repeat; finally swap the pivot with a[j].
        </p>
        <Code id="quick_sort" />
      </Sec>
      <AlgoViz
        title="Quick sort (first-element pivot)"
        fields={[{ name: 'a', label: 'array', initial: '10, 80, 30, 90, 40, 50, 70', random: (r) => r.ints(r.int(5, 8), 1, 90).join(', ') }]}
        build={(v) => D.quickSortFrames(nums(v.a, { maxLen: 9 }))}
        code="quick_sort"
      />
      <Sec title="Analysis (from your deck)">
        <F>T(n) = T(k) + T(n − 1 − k) + Θ(n)   (k = elements left of the pivot)</F>
        <Table
          head={['Case', 'When', 'Recurrence', 'Time']}
          rows={[
            ['Best', 'pivot splits evenly', 'T(n) = 2T(n/2) + Θ(n)', 'Θ(n log n)'],
            ['Worst', 'pivot is the smallest/largest — e.g. sorted input with first-element pivot', 'T(n) = T(n − 1) + Θ(n)', 'Θ(n²)'],
            ['Average', 'random input', '—', 'Θ(n log n) (about 1.39 n log₂ n comparisons)'],
          ]}
        />
        <ul>
          <li>Fix for the worst case: choose the middle, a random element, or the median of three as pivot.</li>
          <li>In-place (only swaps); recursion stack O(log n) on average, O(n) in the worst case.</li>
          <li>Not stable: long-distance swaps reorder equal keys.</li>
        </ul>
      </Sec>
      <Callout kind="convention" title="Other partition schemes">
        <p>
          CLRS uses <b>Lomuto</b> partitioning (pivot = last element, one index i growing the "≤ pivot" region). Hoare's original scheme uses two pointers like
          your deck but returns a split point rather than the pivot's final index. Exams follow the scheme taught in class — trace with the deck's version unless
          told otherwise. Lomuto is in the dojo as a bonus snippet.
        </p>
        <Code id="quick_sort_lomuto" />
      </Callout>
    </>
  );
}

function L21Practice() {
  return (
    <AlgoViz
      title="Predict every i stop, j stop and pivot landing"
      fields={[{ name: 'a', label: 'array', initial: '50, 20, 80, 10, 70, 30, 60', random: (r) => r.ints(r.int(6, 8), 1, 90).join(', ') }]}
      build={(v) => D.quickSortFrames(nums(v.a, { maxLen: 9 }), true, true)}
      code="quick_sort"
      predict
    />
  );
}

const partQ: QGen = (rng) => {
  const a = rng.distinct(rng.int(6, 8), 1, 60);
  const b = a.slice();
  const j = D.partitionHoareFirst(b, 0, b.length - 1);
  return rng.chance(0.5)
    ? seq(`Apply one partition() (pivot = first element, your deck's i/j scheme) to [${a.join(', ')}]. Write the array afterwards.`, b, `Pivot ${a[0]} lands at index ${j}: [${b.join(', ')}].`)
    : num(`partition() (pivot = first element) on [${a.join(', ')}] returns which index?`, j, `Pivot ${a[0]} ends at index ${j}.`);
};
const qsSwapQ: QGen = (rng) => {
  const a = rng.distinct(rng.int(5, 7), 1, 60);
  const b = a.slice();
  const log: [number, number][] = [];
  D.partitionHoareFirst(b, 0, b.length - 1, log);
  return num(`How many times is swap() called during one partition() (pivot = first element, including the final pivot swap) on [${a.join(', ')}]?`, log.length, `Swaps: ${log.map(([x, y]) => `(${x},${y})`).join(' ')}.`);
};
const L21_BANK = [
  mcq('Worst case for quick sort with the first element as pivot?', 'An already sorted array', ['A random array', 'All distinct values', 'An array of size 2'], 'Every partition peels off one element: Θ(n²).'),
  mcq('Quick sort best-case recurrence?', 'T(n) = 2T(n/2) + Θ(n)', ['T(n) = T(n − 1) + Θ(n)', 'T(n) = T(n/2) + Θ(1)', 'T(n) = 2T(n − 1) + 1'], 'Pivot splits evenly.'),
  mcq('Average-case time of quick sort?', 'Θ(n log n)', ['Θ(n²)', 'Θ(n)', 'Θ(log n)'], 'Partitions are reasonably balanced on average.'),
  mcq('Which is TRUE of quick sort?', 'It is in-place but not stable', ['It is stable but not in-place', 'It is stable and in-place', 'It needs Θ(n) extra arrays'], 'Only swaps; long-distance swaps break stability.'),
  mcq('After partition(), the pivot is…', 'in its final sorted position', ['at index 0', 'at the middle index', 'at the end'], 'Everything left ≤ pivot, right > pivot.'),
  mcq('In the deck\'s partition, i stops when…', 'it finds an element greater than the pivot (or reaches high)', ['it finds an element smaller than the pivot', 'it meets j', 'it reaches the middle'], 'while (a[i] <= p && i <= high − 1) i++.'),
  mcq('A common way to avoid quick sort\'s worst case?', 'Pick a random (or median-of-three) pivot', ['Always pick the first element', 'Sort the array first', 'Use a bigger stack'], 'Makes bad splits unlikely.'),
  tf('Quick sort\'s combine step is trivial.', true, 'The partition already placed everything correctly relative to the pivot.'),
];

const L21: Level = {
  id: 'L21',
  n: 21,
  world: 5,
  title: 'Quick Sort',
  blurb: "Your DAA deck's first-element-pivot partition traced exactly, best/worst/average analysis, pivot strategies, and Lomuto as the other convention.",
  syllabus: ['DS U4 · Quick sort', 'DAA U2 · Quick sort'],
  snippets: ['quick_sort'],
  extraSnippets: ['quick_sort_lomuto'],
  Lesson: L21Lesson,
  Practice: L21Practice,
  quiz: [partQ, partQ, partQ, qsSwapQ, bank(L21_BANK), bank(L21_BANK), bank(L21_BANK), bank(L21_BANK)],
  cards: [
    { q: "Deck's partition loop?", a: 'p = a[low]; i = low; j = high; while (i < j) { while (a[i] <= p && i <= high-1) i++; while (a[j] > p && j >= low+1) j--; if (i < j) swap(a[i], a[j]); } swap(a[low], a[j]); return j;' },
    { q: 'Quick sort best / worst / average?', a: 'Θ(n log n) / Θ(n²) (sorted input, first pivot) / Θ(n log n).' },
  ],
  refs: ['Your DAA deck "11. QuickSort" (partition code, slides 12–13).', 'Cormen et al., Introduction to Algorithms 3e — Ch. 7 Quicksort (Lomuto partition, Problem 7-1 Hoare partition).', 'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Quick sort.'],
};

/* =====================================================================
   Level 22 — Strassen
   ===================================================================== */

function strassenFrames(A: D.M2, B: D.M2): Frame[] {
  const { M, C } = D.strassen(A, B);
  const names = ['M1 = (A11 + A22)(B11 + B22)', 'M2 = (A21 + A22)·B11', 'M3 = A11·(B12 − B22)', 'M4 = A22·(B21 − B11)', 'M5 = (A11 + A12)·B22', 'M6 = (A21 − A11)(B11 + B12)', 'M7 = (A12 − A22)(B21 + B22)'];
  const base = (k: number, showC: boolean): Scene => {
    const ga = grid(A, { x: 50, y: 50, key: 'A', cw: 48 });
    const gb = grid(B, { x: 200, y: 50, key: 'B', cw: 48 });
    const gc = grid(showC ? C : [[null, null], [null, null]], { x: 350, y: 50, key: 'C', cw: 56, tone: () => (showC ? 'done' : 'ghost') });
    const nodes: SNode[] = [
      ...ga.nodes,
      ...gb.nodes,
      ...gc.nodes,
      { id: 'tA', x: 98, y: 30, shape: 'text', label: 'A', tone: 'muted' },
      { id: 'tB', x: 248, y: 30, shape: 'text', label: 'B', tone: 'muted' },
      { id: 'tC', x: 406, y: 30, shape: 'text', label: 'C = AB', tone: 'muted' },
      ...M.slice(0, k).map((v, i) => ({ id: `m${i}`, x: 50, y: 160 + i * 24, shape: 'text' as const, label: `${names[i]} = ${v}`, anchor: 'start' as const, tone: i === k - 1 ? ('active' as const) : ('base' as const), fontSize: 13 })),
    ];
    return { w: 520, h: 340, nodes };
  };
  const F: Frame[] = [{ scene: base(0, false), say: 'Split each matrix into four blocks (here 1×1). Ordinary multiplication needs 8 block products; Strassen needs 7.' }];
  for (let k = 1; k <= 7; k++) F.push({ scene: base(k, false), say: `${names[k - 1]} = ${M[k - 1]}.`, sfx: 'tick', vars: { products: k } });
  F.push({ scene: base(7, true), say: `C11 = M1 + M4 − M5 + M7 = ${C[0][0]}, C12 = M3 + M5 = ${C[0][1]}, C21 = M2 + M4 = ${C[1][0]}, C22 = M1 − M2 + M3 + M6 = ${C[1][1]}. Same as ordinary AB.`, sfx: 'found' });
  return F;
}

function StrassenViz() {
  const [s, setS] = useState('1 3 7 5 | 6 8 4 2');
  const parsed = useMemo(() => {
    const parts = s.split('|');
    if (parts.length !== 2) return null;
    const a = parts[0].trim().split(/[\s,]+/).map(Number);
    const b = parts[1].trim().split(/[\s,]+/).map(Number);
    if (a.length !== 4 || b.length !== 4 || [...a, ...b].some((x) => !Number.isInteger(x) || Math.abs(x) > 99)) return null;
    return strassenFrames([[a[0], a[1]], [a[2], a[3]]], [[b[0], b[1]], [b[2], b[3]]]);
  }, [s]);
  return (
    <Viz title="Strassen's seven products on a 2×2 example" note="Enter A as a11 a12 a21 a22, then |, then B.">
      <div className="inputbar">
        <label>
          <span>A | B</span>
          <input value={s} onChange={(e) => setS(e.target.value)} style={{ minWidth: 260 }} />
        </label>
        {!parsed && <span className="input-err">Format: 1 3 7 5 | 6 8 4 2 (integers ≤ 99)</span>}
      </div>
      {parsed && <Player frames={parsed} />}
    </Viz>
  );
}

function L22Lesson() {
  return (
    <>
      <Sec title="Divide-and-conquer matrix multiplication">
        <p>
          Split n×n matrices A, B into four n/2 × n/2 blocks. The block formula C11 = A11B11 + A12B21 (etc.) needs <b>8</b> recursive multiplications and 4
          additions of n/2 × n/2 matrices (Θ(n²)):
        </p>
        <F>T(n) = 8T(n/2) + Θ(n²)  ⇒  Θ(n^(log₂ 8)) = Θ(n³)   — no better than the triple loop</F>
      </Sec>
      <Sec title="Strassen's idea: 7 multiplications, more additions">
        <Table
          head={['Product', 'Formula']}
          rows={[
            ['M1', '(A11 + A22)(B11 + B22)'],
            ['M2', '(A21 + A22) B11'],
            ['M3', 'A11 (B12 − B22)'],
            ['M4', 'A22 (B21 − B11)'],
            ['M5', '(A11 + A12) B22'],
            ['M6', '(A21 − A11)(B11 + B12)'],
            ['M7', '(A12 − A22)(B21 + B22)'],
          ]}
        />
        <F>
          C11 = M1 + M4 − M5 + M7     C12 = M3 + M5
          <br />
          C21 = M2 + M4               C22 = M1 − M2 + M3 + M6
        </F>
        <F>T(n) = 7T(n/2) + Θ(n²)  ⇒  Θ(n^(log₂ 7)) ≈ Θ(n^2.807)</F>
        <p>
          18 block additions/subtractions replace one multiplication — additions are Θ(n²), multiplications are recursive, so trading one multiplication for many
          additions wins asymptotically. For n = 2ᵏ, Strassen does 7ᵏ scalar multiplications instead of 8ᵏ.
        </p>
        <Callout kind="convention">
          <p>
            Some texts (and your deck) name the products P, Q, R, S, T, U, V in the same order as M1…M7. CLRS 3e uses a different but equivalent set (S1…S10 sums,
            P1…P7 products). Learn one set exactly — the game uses M1…M7 above.
          </p>
        </Callout>
        <p>
          Practical notes: pad n to a power of two; switch to the ordinary method below a crossover size; Strassen is less numerically stable for floating point.
        </p>
      </Sec>
      <StrassenViz />
    </>
  );
}

const strassenQ: QGen = (rng) => {
  const m = (): D.M2 => [[rng.int(-5, 9), rng.int(-5, 9)], [rng.int(-5, 9), rng.int(-5, 9)]];
  const A = m();
  const B = m();
  const { M, C } = D.strassen(A, B);
  const k = rng.int(0, 7);
  const names = ['(A11 + A22)(B11 + B22)', '(A21 + A22)·B11', 'A11·(B12 − B22)', 'A22·(B21 − B11)', '(A11 + A12)·B22', '(A21 − A11)(B11 + B12)', '(A12 − A22)(B21 + B22)'];
  const show = `A = [[${A[0].join(', ')}], [${A[1].join(', ')}]],  B = [[${B[0].join(', ')}], [${B[1].join(', ')}]]`;
  if (k < 7) return num(`${show}. Compute Strassen's M${k + 1} = ${names[k]}.`, M[k], `M${k + 1} = ${M[k]}.`);
  return num(`${show}. Using Strassen's products, C22 = M1 − M2 + M3 + M6 = ?`, C[1][1], `C22 = ${M[0]} − ${M[1]} + ${M[2]} + ${M[5]} = ${C[1][1]} (= A21·B12 + A22·B22).`);
};
const multQ: QGen = (rng) => {
  const k = rng.int(1, 6);
  return rng.chance(0.5)
    ? num(`How many scalar multiplications does Strassen's algorithm perform for n = ${2 ** k} (recursing down to 1×1)?`, 7 ** k, `7^${k} = ${7 ** k} (ordinary: 8^${k} = ${8 ** k}).`)
    : num(`How many scalar multiplications does the ordinary method need for two ${2 ** k} × ${2 ** k} matrices?`, 8 ** k, `n³ = ${8 ** k}.`);
};
const L22_BANK = [
  mcq('C12 in Strassen\'s method equals…', 'M3 + M5', ['M2 + M4', 'M1 + M4 − M5 + M7', 'M1 − M2 + M3 + M6'], 'C12 = A11B12 + A12B22 = M3 + M5.'),
  mcq('C21 in Strassen\'s method equals…', 'M2 + M4', ['M3 + M5', 'M1 + M2', 'M4 − M2'], 'C21 = A21B11 + A22B21.'),
  mcq('Strassen\'s time complexity?', 'Θ(n^log₂7) ≈ Θ(n^2.81)', ['Θ(n³)', 'Θ(n² log n)', 'Θ(n^2.5)'], '7 subproblems of half size.'),
  mcq('Plain divide-and-conquer multiplication (8 products) runs in…', 'Θ(n³)', ['Θ(n^2.81)', 'Θ(n²)', 'Θ(n log n)'], 'T(n) = 8T(n/2) + Θ(n²).'),
  mcq('How many recursive multiplications per level does Strassen use?', '7', ['8', '4', '18'], 'Plus 18 additions/subtractions.'),
  mcq('Why is trading one multiplication for many additions worthwhile?', 'Additions cost Θ(n²) while each multiplication is a full recursive subproblem', ['Additions are free', 'Multiplications are inaccurate', 'It reduces memory'], 'The recurrence\'s a drops from 8 to 7.'),
  tf('Strassen\'s algorithm is always faster in practice for small matrices.', false, 'The constant factors and extra additions make it slower below a crossover size.'),
];

const L22: Level = {
  id: 'L22',
  n: 22,
  world: 5,
  title: "Strassen's Matrix Multiplication",
  blurb: 'Why block multiplication alone stays Θ(n³), how seven clever products beat it, the exact M1…M7 formulas, and when it pays off.',
  syllabus: ['DAA U2 · Strassen matrix multiplication'],
  snippets: [],
  Lesson: L22Lesson,
  quiz: [strassenQ, strassenQ, strassenQ, multQ, bank(L22_BANK), bank(L22_BANK), bank(L22_BANK)],
  cards: [
    { q: 'Strassen M1…M7?', a: 'M1=(A11+A22)(B11+B22) M2=(A21+A22)B11 M3=A11(B12−B22) M4=A22(B21−B11) M5=(A11+A12)B22 M6=(A21−A11)(B11+B12) M7=(A12−A22)(B21+B22)' },
    { q: 'Strassen C blocks?', a: 'C11=M1+M4−M5+M7, C12=M3+M5, C21=M2+M4, C22=M1−M2+M3+M6' },
  ],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §4.2 Strassen\'s algorithm for matrix multiplication.', 'Your DAA deck "strsn multi" (Strassen\'s matrix multiplication).'],
};

export default [L18, L19, L20, L21, L22];
