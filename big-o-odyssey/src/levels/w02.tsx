import type { Frame, Level, QGen, Scene, SNode } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, nums, int, sortedNums } from '../core/vizkit';
import { mcq, num, seq, txt, tf, bank, near } from '../core/qhelp';
import { memoryOrder, addressByEnumeration, count, type Bounds, type Major } from '../engines/memory';
import * as A from '../engines/arrays';
import * as S from '../engines/strings';
import type { Rng } from '../core/rng';

/* =====================================================================
   Level 4 — Arrays in memory
   ===================================================================== */

function parseRange(s: string, name: string): [number, number] {
  const m = /^\s*(-?\d+)\s*\.\.\s*(-?\d+)\s*$/.exec(s);
  if (!m) throw new Error(`${name}: write it as lower..upper, e.g. 1..3`);
  const l = +m[1];
  const u = +m[2];
  if (u < l || u - l > 5) throw new Error(`${name}: need lower ≤ upper and at most 6 values.`);
  return [l, u];
}

function memFrames(rows: [number, number], cols: [number, number], base: number, w: number, major: Major, at: [number, number]): Frame[] {
  const b: Bounds = [rows, cols];
  const ord = memoryOrder(b, major);
  const R = rows[1] - rows[0] + 1;
  const C = cols[1] - cols[0] + 1;
  const N = C;
  const M = R;
  const perRow = 9;
  const cellW = 66;
  const gridNodes = (filled: number, hiIdx: number): SNode[] => {
    const nodes: SNode[] = [];
    for (let i = rows[0]; i <= rows[1]; i++)
      for (let j = cols[0]; j <= cols[1]; j++) {
        const k = ord.findIndex(([x, y]) => x === i && y === j);
        nodes.push({
          id: `g${i}_${j}`,
          x: 70 + (j - cols[0]) * 58,
          y: 50 + (i - rows[0]) * 44,
          w: 54,
          h: 38,
          shape: 'rect',
          label: `[${i}][${j}]`,
          fontSize: 11,
          tone: k === hiIdx ? 'active' : k < filled ? 'done' : i === at[0] && j === at[1] ? 'compare' : 'base',
        });
      }
    for (let i = rows[0]; i <= rows[1]; i++) nodes.push({ id: `rl${i}`, x: 30, y: 50 + (i - rows[0]) * 44, shape: 'text', label: `row ${i}`, tone: 'muted', fontSize: 11 });
    return nodes;
  };
  const top = 70 + R * 44;
  const memNodes = (filled: number, hiIdx: number): SNode[] =>
    ord.slice(0, filled).map(([i, j], k) => ({
      id: `m${k}`,
      x: 50 + (k % perRow) * cellW,
      y: top + 30 + Math.floor(k / perRow) * 62,
      w: cellW - 6,
      h: 36,
      shape: 'rect' as const,
      label: `[${i}][${j}]`,
      sub: base + w * k,
      fontSize: 11,
      tone: k === hiIdx ? ('active' as const) : i === at[0] && j === at[1] ? ('compare' as const) : ('base' as const),
    }));
  const total = R * C;
  const sc = (filled: number, hi: number): Scene => ({
    w: Math.max(80 + C * 58, 60 + perRow * cellW),
    h: top + 60 + Math.ceil(Math.max(1, total) / perRow) * 62,
    nodes: [...gridNodes(filled, hi), { id: 'memlbl', x: 20, y: top + 2, shape: 'text', label: `memory (${major}-major), base = ${base}, w = ${w}`, anchor: 'start', tone: 'muted', fontSize: 12 }, ...memNodes(filled, hi)],
  });
  const F: Frame[] = [{ scene: sc(0, -1), say: `A[${rows[0]}..${rows[1]}][${cols[0]}..${cols[1]}] has ${R} × ${C} = ${total} elements. Lay them out ${major === 'row' ? 'row by row' : 'column by column'}.`, vars: { M, N } }];
  const target = ord.findIndex(([i, j]) => i === at[0] && j === at[1]);
  for (let k = 0; k < total; k++) {
    const [i, j] = ord[k];
    const isT = k === target;
    F.push({
      scene: sc(k + 1, k),
      say: isT
        ? major === 'row'
          ? `A[${i}][${j}] → offset (${i}−${rows[0]})·${N} + (${j}−${cols[0]}) = ${k}, so LOC = ${base} + ${w}·${k} = ${base + w * k}.`
          : `A[${i}][${j}] → offset (${j}−${cols[0]})·${M} + (${i}−${rows[0]}) = ${k}, so LOC = ${base} + ${w}·${k} = ${base + w * k}.`
        : `A[${i}][${j}] stored at ${base} + ${w}·${k} = ${base + w * k}.`,
      vars: { offset: k, address: base + w * k },
      sfx: isT ? 'found' : 'tick',
    });
  }
  return F;
}

function L4Lesson() {
  return (
    <>
      <Sec title="One-dimensional arrays">
        <p>
          An array is a set of (index, value) pairs stored in <b>consecutive</b> memory locations. If A runs from index LB to UB and each element takes{' '}
          <i>w</i> bytes (words):
        </p>
        <F>Number of elements = UB − LB + 1        LOC(A[k]) = Base(A) + w · (k − LB)</F>
        <p>
          Because the address is computed with one multiplication and one addition, accessing <b>any</b> element is O(1) — this is what "random access"
          means, and it is why binary search needs an array (or anything else with O(1) indexing).
        </p>
      </Sec>
      <Sec title="Two-dimensional arrays: row-major vs column-major">
        <p>
          Memory is one long line, so a 2-D array A[L1..U1][L2..U2] must be linearised. Let M = U1 − L1 + 1 (rows) and N = U2 − L2 + 1 (columns).
        </p>
        <Table
          head={['Order', 'Which index varies fastest', 'Address of A[i][j]', 'Used by']}
          rows={[
            ['Row-major', 'column index j', 'Base + w·[ (i − L1)·N + (j − L2) ]', 'C, C++, Java, Python (NumPy default)'],
            ['Column-major', 'row index i', 'Base + w·[ (j − L2)·M + (i − L1) ]', 'Fortran, MATLAB, R'],
          ]}
        />
        <p>
          Read row-major as: "skip (i − L1) complete rows of N elements each, then (j − L2) more elements in this row". Column-major: skip whole columns
          of M elements.
        </p>
        <Callout kind="pitfall">
          <p>
            Row-major multiplies by the number of <b>columns</b> N; column-major by the number of <b>rows</b> M. Swapping them is the #1 mistake. Also never
            forget to subtract the lower bounds — exam questions love A[−2..5][3..8].
          </p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Watch an array being laid out in memory"
        note="rows/cols as lower..upper (max 6 each). The yellow cell is the element whose address we want."
        fields={[
          { name: 'rows', label: 'rows', initial: '1..3', width: 90 },
          { name: 'cols', label: 'cols', initial: '1..4', width: 90 },
          { name: 'base', label: 'base', initial: '1000', width: 90 },
          { name: 'w', label: 'w (bytes)', initial: '4', width: 80 },
          { name: 'major', label: 'row / col major', initial: 'row', width: 110 },
          { name: 'at', label: 'find A[i][j]', initial: '2,3', width: 90 },
        ]}
        build={(v) => {
          const r = parseRange(v.rows, 'rows');
          const c = parseRange(v.cols, 'cols');
          const major = v.major.trim().toLowerCase().startsWith('c') ? 'col' : 'row';
          const at = nums(v.at, { minLen: 2, maxLen: 2 }) as [number, number];
          if (at[0] < r[0] || at[0] > r[1] || at[1] < c[0] || at[1] > c[1]) throw new Error('The element to find must be inside the bounds.');
          return memFrames(r, c, int(v.base, 'base', 0, 99999), int(v.w, 'w', 1, 16), major, at);
        }}
      />
      <Sec title="Three and more dimensions">
        <p>For A[L1..U1][L2..U2][L3..U3] with sizes S1, S2, S3 (Sᵢ = Uᵢ − Lᵢ + 1):</p>
        <F>
          Row-major:    LOC(A[i][j][k]) = Base + w·[ (i−L1)·S2·S3 + (j−L2)·S3 + (k−L3) ]
          <br />
          Column-major: LOC(A[i][j][k]) = Base + w·[ (k−L3)·S1·S2 + (j−L2)·S1 + (i−L1) ]
        </F>
        <p>
          General rule (Horowitz–Sahni, row-major, n dimensions): offset = Σ (iₚ − Lₚ)·aₚ where aₙ = 1 and aₚ₋₁ = Sₚ·aₚ — each index is multiplied by
          the product of the sizes of all dimensions to its right. In column-major it is the product of sizes to its left.
        </p>
      </Sec>
      <Sec title="Accessing elements and sparse matrices">
        <p>
          Element access is O(1) in any number of dimensions. When most entries of a matrix are zero (a <b>sparse matrix</b>), storing all m·n entries
          wastes memory; Horowitz–Sahni store only the non-zero entries as triples ⟨row, col, value⟩ sorted by row then column, with a header triple ⟨m, n,
          count⟩. That is a direct time–space trade-off: less memory, but A[i][j] is no longer O(1).
        </p>
      </Sec>
      <Callout kind="exam">
        <p>Standard question: "A[−5..10][4..20], base 1000, w = 2. Find the address of A[3][7] in row-major and column-major." Do both, show the formula.</p>
      </Callout>
    </>
  );
}

function boundsPair(rng: Rng): [number, number] {
  const l = rng.pick([0, 1, 1, -2, -3, 2, 5]);
  return [l, l + rng.int(2, 9)];
}
const addr1Q: QGen = (rng) => {
  const b = boundsPair(rng);
  const base = rng.int(10, 200) * 10;
  const w = rng.pick([1, 2, 4, 8]);
  const k = rng.int(b[0], b[1]);
  const ans = addressByEnumeration([b], 'row', base, w, [k]);
  return num(`A[${b[0]}..${b[1]}] is stored from Base = ${base}, w = ${w} bytes per element. LOC(A[${k}]) = ?`, ans, `Base + w·(k − LB) = ${base} + ${w}·(${k} − ${b[0]}) = ${ans}.`);
};
const addr2Q: QGen = (rng) => {
  const r = boundsPair(rng);
  const c = boundsPair(rng);
  const base = rng.int(10, 300) * 10;
  const w = rng.pick([1, 2, 4, 8]);
  const major = rng.pick(['row', 'col'] as const);
  const at = [rng.int(r[0], r[1]), rng.int(c[0], c[1])];
  const ans = addressByEnumeration([r, c], major, base, w, at);
  const M = r[1] - r[0] + 1;
  const N = c[1] - c[0] + 1;
  const how =
    major === 'row'
      ? `Row-major: Base + w·[(i−L1)·N + (j−L2)] = ${base} + ${w}·[(${at[0]}−${r[0]})·${N} + (${at[1]}−${c[0]})] = ${ans}.`
      : `Column-major: Base + w·[(j−L2)·M + (i−L1)] = ${base} + ${w}·[(${at[1]}−${c[0]})·${M} + (${at[0]}−${r[0]})] = ${ans}.`;
  return num(`A[${r[0]}..${r[1]}][${c[0]}..${c[1]}], Base = ${base}, w = ${w}, stored in **${major}-major** order. LOC(A[${at[0]}][${at[1]}]) = ?`, ans, how);
};
const addr3Q: QGen = (rng) => {
  const b: Bounds = [boundsPair(rng), [1, rng.int(2, 4)], [0, rng.int(2, 5)]];
  const base = rng.int(10, 200) * 10;
  const w = rng.pick([2, 4]);
  const major = rng.pick(['row', 'col'] as const);
  const at = b.map(([l, u]) => rng.int(l, u));
  const ans = addressByEnumeration(b, major, base, w, at);
  const s = b.map(([l, u]) => u - l + 1);
  const how =
    major === 'row'
      ? `Sizes S = ${s.join('×')}. Row-major offset = (i−L1)·S2·S3 + (j−L2)·S3 + (k−L3) = ${(ans - base) / w}; LOC = ${base} + ${w}·${(ans - base) / w} = ${ans}.`
      : `Sizes S = ${s.join('×')}. Column-major offset = (k−L3)·S1·S2 + (j−L2)·S1 + (i−L1) = ${(ans - base) / w}; LOC = ${base} + ${w}·${(ans - base) / w} = ${ans}.`;
  return num(`A[${b.map(([l, u]) => `${l}..${u}`).join('][')}], Base = ${base}, w = ${w}, **${major}-major**. LOC(A[${at.join('][')}]) = ?`, ans, how);
};
const countQ: QGen = (rng) => {
  const b: Bounds = rng.chance(0.5) ? [boundsPair(rng), boundsPair(rng)] : [boundsPair(rng), boundsPair(rng), [1, rng.int(2, 5)]];
  const c = count(b);
  return num(`How many elements does A[${b.map(([l, u]) => `${l}..${u}`).join('][')}] have?`, c, `Product of (U − L + 1) over dimensions: ${b.map(([l, u]) => u - l + 1).join(' × ')} = ${c}.`);
};
const baseQ: QGen = (rng) => {
  const r = boundsPair(rng);
  const c = boundsPair(rng);
  const base = rng.int(10, 300) * 10;
  const w = rng.pick([2, 4]);
  const at = [rng.int(r[0], r[1]), rng.int(c[0], c[1])];
  const loc = addressByEnumeration([r, c], 'row', base, w, at);
  return num(`In row-major A[${r[0]}..${r[1]}][${c[0]}..${c[1]}] with w = ${w}, LOC(A[${at[0]}][${at[1]}]) = ${loc}. What is the base address?`, base, `Offset = (${at[0]}−${r[0]})·${c[1] - c[0] + 1} + (${at[1]}−${c[0]}) = ${(loc - base) / w}; Base = ${loc} − ${w}·${(loc - base) / w} = ${base}.`);
};
const L4_BANK = [
  mcq('In row-major order, which index changes fastest as you walk through memory?', 'The last (column) index', ['The first (row) index', 'Both equally', 'It depends on w'], 'Row-major stores a whole row contiguously, so the column index advances first.'),
  mcq('C and C++ store 2-D arrays in…', 'row-major order', ['column-major order', 'random order', 'diagonal order'], 'Fortran and MATLAB use column-major.'),
  mcq('Why is A[i] an O(1) access?', 'Its address is Base + w·(i − LB), computed directly', ['Arrays are sorted', 'The CPU caches every element', 'Arrays are stored in a tree'], 'One multiplication and one addition — independent of n.'),
  mcq('In the row-major formula Base + w·[(i−L1)·N + (j−L2)], N is…', 'the number of columns', ['the number of rows', 'the total number of elements', 'the element size'], 'Skipping a row skips N elements.'),
  mcq('A sparse matrix stored as ⟨row, col, value⟩ triples trades…', 'O(1) element access for much less memory', ['memory for faster access', 'correctness for speed', 'nothing — it is strictly better'], 'Looking up A[i][j] now needs a search through the triples.'),
  tf('In column-major order, consecutive memory locations hold consecutive elements of a column.', true, 'Column-major stores each column contiguously.'),
];

const L4: Level = {
  id: 'L04',
  n: 4,
  world: 2,
  title: 'Arrays in Memory',
  blurb: 'How 1-D, 2-D and n-D arrays are laid out in a linear memory, row-major vs column-major, and exact address calculation with any lower bounds.',
  syllabus: ['DS U1 · Representation of arrays in memory', 'DS U1 · Accessing elements'],
  snippets: [],
  Lesson: L4Lesson,
  quiz: [addr1Q, addr2Q, addr2Q, addr2Q, addr3Q, countQ, baseQ, bank(L4_BANK), bank(L4_BANK)],
  cards: [
    { q: 'Row-major address of A[i][j] in A[L1..U1][L2..U2]?', a: 'Base + w·[(i−L1)·N + (j−L2)], N = U2 − L2 + 1 (number of columns).' },
    { q: 'Column-major address of A[i][j]?', a: 'Base + w·[(j−L2)·M + (i−L1)], M = U1 − L1 + 1 (number of rows).' },
    { q: '3-D row-major offset?', a: '(i−L1)·S2·S3 + (j−L2)·S3 + (k−L3)' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Arrays, Representation of multidimensional arrays, Sparse matrices.', 'Tremblay & Sorenson, An Introduction to Data Structures with Applications — storage structures for arrays.'],
};

/* =====================================================================
   Level 5 — Array operations: traverse, insert, delete
   ===================================================================== */

function L5Lesson() {
  return (
    <>
      <Sec title="The array as a list: n, capacity and shifting">
        <p>
          A static array has a fixed <b>capacity</b> (cap) but holds only <b>n</b> meaningful elements at a time, in a[0..n−1]. Traversal visits a[0] … a[n−1]
          once each — Θ(n). Insertion and deletion must keep the elements contiguous, so they <b>shift</b> elements:
        </p>
        <Table
          head={['Operation', 'Elements moved', 'Best', 'Worst']}
          rows={[
            ['Traverse', '—', 'Θ(n)', 'Θ(n)'],
            ['Insert at pos', 'n − pos (shift right)', 'O(1) at the end', 'O(n) at the front'],
            ['Delete at pos', 'n − pos − 1 (shift left)', 'O(1) at the end', 'O(n) at the front'],
            ['Access a[i]', '—', 'O(1)', 'O(1)'],
          ]}
        />
      </Sec>
      <Sec title="Insertion — shift from the right end">
        <Code id="array_insert" />
        <Callout kind="pitfall">
          <p>
            The loop must run <b>backwards</b> (i = n−1 down to pos). If you shift forwards — a[pos+1] = a[pos], then a[pos+2] = a[pos+1], … — you copy a[pos]
            into every slot and destroy the rest of the array.
          </p>
        </Callout>
        <p>
          Overflow: if n == cap there is no free slot; the function refuses (−1). Valid positions are 0 … n (inserting at n appends).
        </p>
      </Sec>
      <AlgoViz
        title="Insert into an array"
        fields={[
          { name: 'a', label: 'array', initial: '12, 5, 9, 31, 7', random: (r) => r.ints(r.int(3, 7), 1, 50).join(', ') },
          { name: 'cap', label: 'capacity', initial: '7', width: 80 },
          { name: 'pos', label: 'pos', initial: '1', width: 70, random: (r) => String(r.int(0, 3)) },
          { name: 'x', label: 'x', initial: '42', width: 70 },
        ]}
        build={(v) => {
          const a = nums(v.a, { maxLen: 9 });
          return A.insertFrames(a, int(v.cap, 'capacity', a.length, 10), int(v.pos, 'pos', -1, 10), int(v.x, 'x'));
        }}
        code="array_insert"
      />
      <Sec title="Deletion — shift from the left">
        <Code id="array_delete" />
        <p>Deleting a[pos] pulls every later element one step left, so the loop runs forwards from pos to n−2.</p>
      </Sec>
      <AlgoViz
        title="Delete from an array"
        fields={[
          { name: 'a', label: 'array', initial: '12, 5, 9, 31, 7', random: (r) => r.ints(r.int(3, 8), 1, 50).join(', ') },
          { name: 'pos', label: 'pos', initial: '1', width: 70, random: (r) => String(r.int(0, 2)) },
        ]}
        build={(v) => A.deleteFrames(nums(v.a, { maxLen: 10 }), int(v.pos, 'pos', -1, 10))}
        code="array_delete"
      />
      <Callout kind="tip">
        <p>
          If order doesn't matter, delete in O(1): copy the last element into a[pos] and decrement n. Same trick appears in heaps (Level 29) — move the last
          element to the hole.
        </p>
      </Callout>
    </>
  );
}

const insQ: QGen = (rng) => {
  const a = rng.ints(rng.int(4, 7), 1, 60);
  const pos = rng.int(0, a.length);
  const x = rng.int(61, 99);
  const r = A.insertAt(a, a.length + 2, pos, x)!;
  return seq(`a = [${a.join(', ')}] (n = ${a.length}, capacity ${a.length + 2}). Write the array after insertAt(a, n, cap, ${pos}, ${x}).`, r, `Shift a[${a.length - 1}] … a[${pos}] right by one, then a[${pos}] = ${x}.`);
};
const delQ: QGen = (rng) => {
  const a = rng.ints(rng.int(4, 8), 1, 60);
  const pos = rng.int(0, a.length - 1);
  const r = A.deleteAt(a, pos)!;
  return seq(`a = [${a.join(', ')}]. Write the array after deleteAt(a, n, ${pos}).`, r, `Elements after index ${pos} shift one place left.`);
};
const shiftQ: QGen = (rng) => {
  const n = rng.int(5, 40);
  const ins = rng.chance(0.5);
  const pos = rng.int(0, ins ? n : n - 1);
  const ans = ins ? n - pos : n - pos - 1;
  return num(`An array holds n = ${n} elements. How many elements are moved when you ${ins ? 'insert at' : 'delete'} index ${pos}?`, ans, ins ? `Insert moves a[pos..n−1]: n − pos = ${ans}.` : `Delete moves a[pos+1..n−1]: n − pos − 1 = ${ans}.`);
};
const L5_BANK = [
  mcq('insertAt(a, n, cap, pos, x) is called with n == cap. It returns…', '-1 (overflow)', ['n + 1', '0', 'cap'], 'There is no free slot; the guard `n == cap` rejects the insert.'),
  mcq('Which positions are valid for insertion into a[0..n−1]?', '0 … n', ['0 … n − 1', '1 … n', '1 … n + 1'], 'Position n appends at the end.'),
  mcq('Why must the insertion loop run from i = n − 1 down to pos?', 'Shifting forwards would overwrite elements before they are moved', ['It is faster', 'The compiler requires it', 'To keep the array sorted'], 'a[i+1] = a[i] must read each a[i] before it gets overwritten.'),
  mcq('Worst-case time of deletion from an n-element array?', 'O(n)', ['O(1)', 'O(log n)', 'O(n²)'], 'Deleting a[0] shifts n − 1 elements.'),
  mcq('Best-case time to insert into an array with free capacity?', 'O(1) — inserting at the end', ['O(n)', 'O(log n)', 'O(n log n)'], 'pos = n: the loop body never runs.'),
  mcq('If element order doesn\'t matter, deletion can be made O(1) by…', 'moving the last element into the hole and decrementing n', ['sorting first', 'using binary search', 'doubling the capacity'], 'One move instead of n − pos − 1.'),
  tf('Accessing a[i] in an array costs O(i).', false, 'It is O(1): address = base + w·i.'),
];

const L5: Level = {
  id: 'L05',
  n: 5,
  world: 2,
  title: 'Array Operations',
  blurb: 'Traversal, insertion and deletion on a static array: why elements must shift, which direction, and what it costs.',
  syllabus: ['DS U1 · Array operations: insertion, deletion', 'DS U1 · List data structure'],
  snippets: ['array_insert', 'array_delete'],
  Lesson: L5Lesson,
  quiz: [insQ, insQ, delQ, delQ, shiftQ, shiftQ, bank(L5_BANK), bank(L5_BANK), bank(L5_BANK)],
  cards: [
    { q: 'Elements moved by insert at pos / delete at pos?', a: 'Insert: n − pos (shift right, loop backwards). Delete: n − pos − 1 (shift left, loop forwards).' },
    { q: 'Insertion loop direction and why?', a: 'From i = n−1 down to pos, so each a[i] is copied before being overwritten.' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Arrays and structures: the ordered (linear) list.', 'Lipschutz, Data Structures (Schaum) — Inserting and deleting.'],
};

/* =====================================================================
   Level 6 — Searching: linear, binary, interpolation
   ===================================================================== */

function L6Lesson() {
  return (
    <>
      <Sec title="Linear search">
        <p>
          Compare the key with a[0], a[1], … until a match or the end. Works on <b>any</b> array, sorted or not, and on linked lists. Comparisons: best 1,
          worst n (absent or last), average (n+1)/2 when present and equally likely anywhere.
        </p>
        <Code id="linear_search" />
      </Sec>
      <AlgoViz
        title="Linear search"
        fields={[
          { name: 'a', label: 'array', initial: '14, 3, 27, 8, 19, 42, 5', random: (r) => r.ints(r.int(5, 9), 1, 60).join(', ') },
          { name: 'k', label: 'key', initial: '19', width: 80 },
        ]}
        build={(v) => A.linearFrames(nums(v.a), int(v.k, 'key'))}
        code="linear_search"
      />
      <Sec title="Binary search — divide and conquer on a sorted array">
        <p>
          Precondition: the array is <b>sorted</b> and supports O(1) access. Compare the key with the middle element; equal → done; smaller → the key can only
          be in the left half; larger → right half. Each comparison halves the range.
        </p>
        <Code id="binary_search" />
        <Callout kind="tip">
          <p>
            <code>mid = low + (high − low) / 2</code> gives the same value as <code>(low + high) / 2</code> for non-negative indices but cannot overflow when
            low + high exceeds INT_MAX. Both are accepted in exams; the game uses the safe form.
          </p>
        </Callout>
        <Table
          head={['', 'Linear search', 'Binary search']}
          rows={[
            ['Precondition', 'none', 'sorted, random access'],
            ['Best', 'O(1)', 'O(1)'],
            ['Worst', 'O(n)', 'O(log n): at most ⌊log₂ n⌋ + 1 probes'],
            ['Recurrence', '—', 'T(n) = T(n/2) + c  ⇒  Θ(log n)'],
            ['Access pattern', 'sequential', 'random'],
          ]}
        />
      </Sec>
      <AlgoViz
        title="Binary search"
        note="Enter a sorted array. Grey cells are ruled out."
        fields={[
          { name: 'a', label: 'sorted array', initial: '3, 8, 11, 17, 23, 31, 38, 44, 52, 60, 71', random: (r) => r.ints(r.int(7, 13), 1, 99).sort((x, y) => x - y).join(', ') },
          { name: 'k', label: 'key', initial: '44', width: 80, random: (r) => String(r.int(1, 99)) },
        ]}
        build={(v) => A.binaryFrames(sortedNums(v.a, { maxLen: 14 }), int(v.k, 'key'))}
        code="binary_search"
      />
      <Sec title="Recursive binary search">
        <p>
          The same idea written recursively — the form your DAA deck uses to derive the recurrence T(n) = T(n/2) + 1. Each call works on half the range;
          the base case is an empty range (low &gt; high). Space is Θ(log n) for the call stack, vs O(1) for the iterative version.
        </p>
        <Code id="binary_search_rec" />
      </Sec>
      <Sec title="Interpolation search">
        <p>
          When values are roughly <b>uniformly distributed</b>, guess the position proportionally — the way you open a dictionary near "T" for "tree"
          instead of in the middle:
        </p>
        <F>pos = low + (key − a[low]) · (high − low) / (a[high] − a[low])</F>
        <Code id="interpolation_search" />
        <ul>
          <li>Average O(log log n) probes on uniformly distributed keys.</li>
          <li>Worst case O(n) — e.g. 1, 2, 3, …, 99, 10⁶ searching for 99 creeps one step at a time.</li>
          <li>The loop guard key ∈ [a[low], a[high]] keeps pos inside the range; the a[high] == a[low] check avoids dividing by zero.</li>
          <li>Integer arithmetic: (key − a[low])·(high − low) can overflow for large values — fine for exam-sized data.</li>
        </ul>
      </Sec>
      <AlgoViz
        title="Interpolation search"
        fields={[
          { name: 'a', label: 'sorted array', initial: '10, 20, 30, 40, 50, 60, 70, 80, 90, 100', random: (r) => r.ints(r.int(7, 12), 1, 99).sort((x, y) => x - y).join(', ') },
          { name: 'k', label: 'key', initial: '70', width: 80, random: (r) => String(r.int(1, 99)) },
        ]}
        build={(v) => A.interpolationFrames(sortedNums(v.a, { maxLen: 14 }), int(v.k, 'key'))}
        code="interpolation_search"
      />
      <Callout kind="daa">
        <p>
          Binary search is the first divide-and-conquer algorithm in your DAA Unit 2: divide (pick mid), conquer (search one half), combine (nothing).
          Solving T(n) = T(n/2) + 1 by iteration: T(n) = T(n/2ᵏ) + k, stop at n/2ᵏ = 1 ⇒ k = log₂ n ⇒ Θ(log n).
        </p>
      </Callout>
    </>
  );
}

function L6Practice() {
  return (
    <AlgoViz
      title="Predict every binary-search move"
      fields={[
        { name: 'a', label: 'sorted array', initial: '2, 9, 14, 21, 26, 33, 40, 47, 58, 61, 77, 80, 95', random: (r) => r.ints(r.int(9, 14), 1, 99).sort((x, y) => x - y).join(', ') },
        { name: 'k', label: 'key', initial: '26', width: 80, random: (r) => String(r.int(1, 99)) },
      ]}
      build={(v) => A.binaryFrames(sortedNums(v.a, { maxLen: 14 }), int(v.k, 'key'), true)}
      code="binary_search"
      predict
    />
  );
}

const probesQ: QGen = (rng) => {
  const a = rng.ints(rng.int(8, 16), 1, 99).sort((x, y) => x - y);
  const key = rng.chance(0.6) ? rng.pick(a) : rng.int(0, 100);
  const r = A.binarySearch(a, key);
  return seq(
    `Binary search (mid = low + (high − low)/2) on a = [${a.join(', ')}] for key ${key}. List the indices of mid in the order they are probed.`,
    r.probes,
    `Probes: ${r.probes.join(' → ')}; result ${r.idx}.`,
  );
};
const linCompQ: QGen = (rng) => {
  const a = rng.ints(rng.int(6, 12), 1, 60);
  const key = rng.chance(0.6) ? rng.pick(a) : 61 + rng.int(0, 30);
  const r = A.linearSearch(a, key);
  return num(`Linear search for ${key} in [${a.join(', ')}]: how many key comparisons?`, r.comps, r.idx >= 0 ? `First match at index ${r.idx}: ${r.comps} comparisons.` : `Absent: all ${a.length} elements compared.`);
};
const interpQ: QGen = (rng) => {
  const n = rng.int(8, 12);
  const step = rng.int(3, 12);
  const start = rng.int(1, 20);
  const a = Array.from({ length: n }, (_, i) => start + i * step + (rng.chance(0.3) ? rng.int(0, step - 1) : 0)).sort((x, y) => x - y);
  const key = rng.int(a[0], a[n - 1]);
  const pos = Math.trunc(((key - a[0]) * (n - 1)) / (a[n - 1] - a[0]));
  return num(`Interpolation search on a = [${a.join(', ')}] (indices 0..${n - 1}) for key ${key}. Which index is probed first? (integer division)`, pos, `pos = 0 + (${key} − ${a[0]})·(${n - 1} − 0)/(${a[n - 1]} − ${a[0]}) = ${(key - a[0]) * (n - 1)}/${a[n - 1] - a[0]} = ${pos}.`);
};
const worstBinQ: QGen = (rng) => {
  const n = rng.int(5, 2000);
  const ans = Math.floor(Math.log2(n)) + 1;
  return mcq(`What is the maximum number of probes (comparisons with a[mid]) binary search makes on a sorted array of n = ${n}?`, String(ans), near(rng, ans, 3, 2).filter((x) => x > 0).map(String), `⌊log₂ ${n}⌋ + 1 = ${ans}.`);
};
const L6_BANK = [
  mcq('Binary search requires…', 'a sorted array with random access', ['any array', 'a linked list', 'distinct elements only'], 'Halving needs order (to discard a half) and O(1) access to the middle.'),
  mcq('Recurrence for binary search?', 'T(n) = T(n/2) + 1', ['T(n) = 2T(n/2) + 1', 'T(n) = T(n − 1) + 1', 'T(n) = 2T(n/2) + n'], 'One comparison, then one half-size subproblem.'),
  mcq('Average-case probes of interpolation search on uniformly distributed keys?', 'O(log log n)', ['O(log n)', 'O(1)', 'O(√n)'], 'Each probe shrinks the range to about √(range).'),
  mcq('Worst case of interpolation search?', 'O(n)', ['O(log n)', 'O(log log n)', 'O(n log n)'], 'Skewed data can make each probe move one position.'),
  mcq('Linear search average comparisons for a present key (equally likely positions)?', '(n + 1)/2', ['n', 'n/2', 'log₂ n'], 'Average of 1..n.'),
  mcq('Which search works on an unsorted linked list?', 'Linear search', ['Binary search', 'Interpolation search', 'None'], 'Only sequential scanning needs neither order nor random access.'),
  mcq('Space used by recursive binary search?', 'Θ(log n) stack frames', ['O(1)', 'Θ(n)', 'Θ(n log n)'], 'Recursion depth ≤ ⌊log₂ n⌋ + 1. Iterative binary search uses O(1).'),
  mcq('Why write mid = low + (high − low)/2?', 'It avoids integer overflow of low + high', ['It is a different algorithm', 'It rounds up', 'It works on unsorted arrays'], 'Same value, no overflow.'),
  tf('Binary search on a sorted array of 1,000,000 elements needs at most 20 probes.', true, '⌊log₂ 10⁶⌋ + 1 = 19 + 1 = 20.'),
];

const L6: Level = {
  id: 'L06',
  n: 6,
  world: 2,
  title: 'Searching',
  blurb: 'Linear search, binary search (iterative and recursive) and interpolation search — preconditions, exact probe sequences and complexities.',
  syllabus: ['DS U1 · Searching', 'DS U4 · Linear, binary, interpolation search', 'DAA U2 · Binary search'],
  snippets: ['linear_search', 'binary_search', 'binary_search_rec', 'interpolation_search'],
  Lesson: L6Lesson,
  Practice: L6Practice,
  quiz: [probesQ, probesQ, probesQ, linCompQ, interpQ, interpQ, worstBinQ, bank(L6_BANK), bank(L6_BANK), bank(L6_BANK)],
  cards: [
    { q: 'Max probes of binary search on n elements?', a: '⌊log₂ n⌋ + 1' },
    { q: 'Interpolation search probe formula?', a: 'pos = low + (key − a[low])·(high − low)/(a[high] − a[low])' },
    { q: 'Interpolation search average / worst?', a: 'O(log log n) on uniform data / O(n).' },
  ],
  refs: [
    'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — binary search (binsearch).',
    'Knuth, TAOCP Vol. 3 §6.2.1 — binary and interpolation search (O(log log N) on uniform keys).',
    'Your DAA deck "8. Search Algorithm" (linear vs binary, recurrence relation).',
  ],
};

/* =====================================================================
   Level 7 — Simple sorts
   ===================================================================== */

function L7Lesson() {
  return (
    <>
      <Sec title="Three quadratic sorts you must be able to trace and write">
        <Table
          head={['Sort', 'Idea', 'Best', 'Average', 'Worst', 'Stable', 'In-place', 'Online']}
          rows={[
            ['Bubble (optimised)', 'swap adjacent out-of-order pairs; largest bubbles to the end', 'O(n)', 'O(n²)', 'O(n²)', 'yes', 'yes', 'no'],
            ['Selection', 'select the minimum of the unsorted part, swap it to the front', 'O(n²)', 'O(n²)', 'O(n²)', 'no', 'yes', 'no'],
            ['Insertion', 'insert each element into the sorted prefix', 'O(n)', 'O(n²)', 'O(n²)', 'yes', 'yes', 'yes'],
          ]}
        />
        <Callout kind="errata">
          <p>
            The summary table in your <code>10. merge sort</code> deck lists selection sort's best case as <b>n</b>. It is <b>Θ(n²)</b> in every case:
            selection sort always scans the whole unsorted part, making exactly n(n−1)/2 comparisons even on sorted input. (It does at most n − 1 swaps,
            which is its one advantage.)
          </p>
        </Callout>
        <ul>
          <li>
            <b>Stable</b>: equal keys keep their relative order. Selection sort's long-distance swap can jump an element over an equal one (e.g. [5a, 5b, 1] →
            [1, 5b, 5a]).
          </li>
          <li>
            <b>In-place</b>: only O(1) extra memory. <b>Online</b>: can sort data as it arrives — insertion sort, because each step only needs the prefix.
          </li>
          <li>Bubble-sort swaps and insertion-sort shifts both equal the number of <b>inversions</b> (pairs i &lt; j with a[i] &gt; a[j]).</li>
        </ul>
      </Sec>
      <Sec title="Bubble sort">
        <p>
          Pass i compares a[0..n−i−2] with their right neighbours. After pass i, the i+1 largest values are in place. The <code>swapped</code> flag ends the sort
          after a pass with no swaps — that is what makes the best case O(n).
        </p>
        <Code id="bubble_sort" />
      </Sec>
      <AlgoViz
        title="Bubble sort"
        fields={[{ name: 'a', label: 'array', initial: '5, 1, 4, 2, 8', random: (r) => r.ints(r.int(5, 8), 1, 40).join(', ') }]}
        build={(v) => A.bubbleFrames(nums(v.a, { maxLen: 9 }))}
        code="bubble_sort"
      />
      <Sec title="Selection sort">
        <p>Pass i finds the index of the minimum of a[i..n−1] and swaps it into position i. Comparisons never depend on the data.</p>
        <Code id="selection_sort" />
      </Sec>
      <AlgoViz
        title="Selection sort"
        fields={[{ name: 'a', label: 'array', initial: '29, 10, 14, 37, 13', random: (r) => r.ints(r.int(5, 8), 1, 40).join(', ') }]}
        build={(v) => A.selectionFrames(nums(v.a, { maxLen: 9 }))}
        code="selection_sort"
      />
      <Sec title="Insertion sort">
        <p>
          Like sorting a hand of cards: lift a[i] out as <code>key</code>, slide every larger element of the sorted prefix one place right, and drop key into
          the gap. Few inversions ⇒ few shifts, so it is excellent on nearly-sorted data and for small n (many library sorts switch to it for tiny
          sub-arrays).
        </p>
        <Code id="insertion_sort" />
      </Sec>
      <AlgoViz
        title="Insertion sort"
        fields={[{ name: 'a', label: 'array', initial: '12, 11, 13, 5, 6', random: (r) => r.ints(r.int(5, 8), 1, 40).join(', ') }]}
        build={(v) => A.insertionFrames(nums(v.a, { maxLen: 9 }))}
        code="insertion_sort"
      />
      <Callout kind="exam">
        <p>
          Typical: "Show the array after each pass of bubble/selection/insertion sort on 25, 17, 31, 13, 2." Passes are numbered from the first outer
          iteration. Also: count comparisons and swaps, state stability, best/worst inputs.
        </p>
      </Callout>
    </>
  );
}

function L7Practice() {
  return (
    <>
      <AlgoViz title="Predict bubble-sort swaps" fields={[{ name: 'a', label: 'array', initial: '7, 3, 9, 1, 5', random: (r) => r.ints(r.int(5, 7), 1, 30).join(', ') }]} build={(v) => A.bubbleFrames(nums(v.a, { maxLen: 8 }), true)} code="bubble_sort" predict />
      <AlgoViz title="Predict selection-sort minimums" fields={[{ name: 'a', label: 'array', initial: '64, 25, 12, 22, 11', random: (r) => r.ints(r.int(5, 7), 1, 70).join(', ') }]} build={(v) => A.selectionFrames(nums(v.a, { maxLen: 8 }), true)} code="selection_sort" predict />
      <AlgoViz title="Predict where insertion sort drops each key" fields={[{ name: 'a', label: 'array', initial: '9, 4, 7, 1, 8', random: (r) => r.ints(r.int(5, 7), 1, 30).join(', ') }]} build={(v) => A.insertionFrames(nums(v.a, { maxLen: 8 }), true)} code="insertion_sort" predict />
    </>
  );
}

const passQ: QGen = (rng) => {
  const kind = rng.pick(['bubble', 'selection', 'insertion'] as const);
  const a = rng.distinct(rng.int(5, 7), 1, 60);
  const t = kind === 'bubble' ? A.bubbleSort(a) : kind === 'selection' ? A.selectionSort(a) : A.insertionSort(a);
  const k = rng.int(1, Math.min(2, t.passes.length));
  return seq(`Show the array after pass ${k} of ${kind} sort on [${a.join(', ')}]. (Pass 1 = the first outer-loop iteration of the lesson's C++ code.)`, t.passes[k - 1], `After pass ${k}: [${t.passes[k - 1].join(', ')}].`);
};
const swapCountQ: QGen = (rng) => {
  const a = rng.ints(rng.int(5, 8), 1, 30);
  const t = A.bubbleSort(a);
  return num(`How many swaps does bubble sort perform on [${a.join(', ')}]?`, t.swaps.length, `Swaps = number of inversions = ${t.swaps.length}.`);
};
const compQ: QGen = (rng) => {
  const kind = rng.pick(['selection', 'bubble', 'insertion'] as const);
  const a = rng.ints(rng.int(5, 8), 1, 30);
  const t = kind === 'bubble' ? A.bubbleSort(a) : kind === 'selection' ? A.selectionSort(a) : A.insertionSort(a);
  const how =
    kind === 'selection'
      ? `Selection sort always makes n(n−1)/2 = ${t.comps}.`
      : kind === 'bubble'
        ? `Count a[j] > a[j+1] tests over the passes actually executed (it stops after the first swap-free pass): ${t.comps}.`
        : `Count evaluations of a[j] > key (each stops at the first non-greater element or j < 0): ${t.comps}.`;
  return num(`How many element comparisons does ${kind} sort (the lesson's C++ code) make on [${a.join(', ')}]?`, t.comps, how);
};
const L7_BANK = [
  mcq('Best-case time of selection sort?', 'Θ(n²)', ['Θ(n)', 'Θ(n log n)', 'Θ(1)'], 'It always makes n(n−1)/2 comparisons. (Your deck\'s table says n — that is an error.)'),
  mcq('Best-case time of optimised bubble sort (sorted input)?', 'Θ(n)', ['Θ(n²)', 'Θ(n log n)', 'Θ(log n)'], 'One pass with no swaps, then the flag stops it.'),
  mcq('Which of these sorts is NOT stable?', 'Selection sort', ['Bubble sort', 'Insertion sort', 'Merge sort'], 'The long-distance swap can reorder equal keys.'),
  mcq('Which sort is online?', 'Insertion sort', ['Selection sort', 'Bubble sort', 'Heap sort'], 'It only needs the elements seen so far.'),
  mcq('Insertion sort worst case input?', 'Reverse-sorted', ['Already sorted', 'All equal', 'Random'], 'Every key shifts past the whole prefix: n(n−1)/2 comparisons.'),
  mcq('Maximum number of swaps made by selection sort on n elements?', 'n − 1', ['n(n−1)/2', 'n', 'log n'], 'One swap per pass.'),
  mcq('The number of bubble-sort swaps equals…', 'the number of inversions', ['n − 1', 'n(n−1)/2 always', 'the number of passes'], 'Each adjacent swap removes exactly one inversion.'),
  mcq('After pass i (0-based) of bubble sort, which elements are certainly in final position?', 'The i + 1 largest, at the end', ['The i + 1 smallest, at the front', 'None', 'Only a[0]'], 'Each pass bubbles the largest remaining value right.'),
  tf('Insertion sort uses O(1) extra space.', true, 'Only key and j.'),
  tf('Selection sort makes fewer comparisons on an already-sorted array.', false, 'Exactly n(n−1)/2 regardless of input.'),
];

const L7: Level = {
  id: 'L07',
  n: 7,
  world: 2,
  title: 'Bubble, Selection & Insertion Sort',
  blurb: 'Trace every pass, count comparisons and swaps, and know which sorts are stable, in-place and online — with the selection-sort errata fixed.',
  syllabus: ['DS U1 · Sorting elements of arrays', 'DS U4 · Insertion sort', 'DAA · Selection, insertion, bubble (deck 7)'],
  snippets: ['bubble_sort', 'selection_sort', 'insertion_sort'],
  Lesson: L7Lesson,
  Practice: L7Practice,
  quiz: [passQ, passQ, passQ, swapCountQ, compQ, compQ, bank(L7_BANK), bank(L7_BANK), bank(L7_BANK)],
  cards: [
    { q: 'Selection sort comparisons?', a: 'Always n(n−1)/2 → Θ(n²) best, average and worst.' },
    { q: 'Stable among bubble / selection / insertion?', a: 'Bubble and insertion are stable; selection (swap version) is not.' },
    { q: 'What makes bubble sort O(n) in the best case?', a: 'The swapped flag: a pass with no swaps means sorted → break.' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Insertion sort.', 'Cormen et al., Introduction to Algorithms 3e — §2.1 Insertion sort; Problem 2-2 Bubble sort.', 'Your DAA deck "7. Selection and insertion Sort and bubble".'],
};

/* =====================================================================
   Level 8 — Strings
   ===================================================================== */

function L8Lesson() {
  return (
    <>
      <Sec title="Strings as character arrays">
        <p>
          In C/C++ a string is an array of <code>char</code> terminated by the null character <code>'\0'</code>. "DSA" occupies 4 bytes: 'D', 'S', 'A',
          '\0'. Every string operation walks until it meets '\0' — so length is Θ(n), not O(1) as with a stored count.
        </p>
        <Table
          head={['Operation', 'Library (C)', 'What it does', 'Cost']}
          rows={[
            ['length', 'strlen(s)', 'count chars before \\0', 'Θ(n)'],
            ['concatenation', 'strcat(d, s)', 'append s at the end of d', 'Θ(|d| + |s|)'],
            ['copy', 'strcpy(d, s)', 'copy s into d', 'Θ(|s|)'],
            ['compare', 'strcmp(a, b)', 'lexicographic: <0, 0, >0', 'Θ(min length)'],
            ['substring', '—', 'len chars from pos', 'Θ(len)'],
            ['pattern match', 'strstr(t, p)', 'first occurrence of p in t', 'naive O((n−m+1)·m)'],
          ]}
        />
        <p>Writing them yourself (no library) is a standard lab/exam task:</p>
        <Code id="string_ops" />
        <Callout kind="pitfall">
          <p>
            Always write the terminating <code>'\0'</code> after building a string, and make sure the destination has room: concat into a buffer of size
            |dest| + |src| + 1.
          </p>
        </Callout>
      </Sec>
      <Sec title="Naive pattern matching">
        <p>
          Slide the pattern (length m) over the text (length n) at every shift i = 0 … n − m and compare character by character. Worst case (e.g. text
          "aaaa…a", pattern "aa…ab") makes (n − m + 1)·m comparisons.
        </p>
        <Code id="pattern_match" />
      </Sec>
      <AlgoViz
        title="Naive pattern matching"
        fields={[
          { name: 't', label: 'text', initial: 'aabaacaadaabaaba', random: (r) => Array.from({ length: r.int(10, 16) }, () => 'ab'[r.int(0, 1)]).join('') },
          { name: 'p', label: 'pattern', initial: 'aaba', width: 120, random: (r) => Array.from({ length: r.int(2, 4) }, () => 'ab'[r.int(0, 1)]).join('') },
        ]}
        build={(v) => {
          if (!/^[a-z]{1,18}$/.test(v.t) || !/^[a-z]{1,8}$/.test(v.p)) throw new Error('Use lowercase letters: text ≤ 18, pattern ≤ 8.');
          return S.naiveFrames(v.t, v.p);
        }}
        code="pattern_match"
      />
      <Sec title="Bonus: KMP — never move backwards in the text">
        <p>
          After a partial match of j characters, the naive method throws that knowledge away. Knuth–Morris–Pratt precomputes, for every prefix of the
          pattern, the length of its longest proper prefix that is also a suffix (<b>lps</b>, called the failure function in Horowitz–Sahni). On a mismatch
          it continues with j = lps[j − 1] without moving the text pointer back. Total time Θ(n + m).
        </p>
        <Code id="kmp_search" />
      </Sec>
      <AlgoViz
        title="Build the lps (failure) table"
        fields={[{ name: 'p', label: 'pattern', initial: 'aabaaab', random: (r) => Array.from({ length: r.int(5, 9) }, () => 'ab'[r.int(0, 1)]).join('') }]}
        build={(v) => {
          if (!/^[a-z]{1,12}$/.test(v.p)) throw new Error('Use 1–12 lowercase letters.');
          return S.lpsFrames(v.p);
        }}
        code="kmp_search"
      />
      <Callout kind="tip">
        <p>KMP is beyond the syllabus wording ("string operations"), so it's a bonus snippet — studied in the dojo but not required to pass the level.</p>
      </Callout>
    </>
  );
}

function L8Practice() {
  return (
    <AlgoViz
      title="Predict the first comparison at each shift"
      fields={[
        { name: 't', label: 'text', initial: 'abababbaab', random: (r) => Array.from({ length: r.int(9, 14) }, () => 'ab'[r.int(0, 1)]).join('') },
        { name: 'p', label: 'pattern', initial: 'abb', width: 110, random: (r) => Array.from({ length: r.int(2, 3) }, () => 'ab'[r.int(0, 1)]).join('') },
      ]}
      build={(v) => {
        if (!/^[a-z]{1,18}$/.test(v.t) || !/^[a-z]{1,8}$/.test(v.p)) throw new Error('Use lowercase letters.');
        return S.naiveFrames(v.t, v.p, true);
      }}
      code="pattern_match"
      predict
    />
  );
}

const wordAB = (rng: Rng, k: number) => Array.from({ length: k }, () => 'ab'[rng.int(0, 1)]).join('');
const matchIdxQ: QGen = (rng) => {
  const t = wordAB(rng, rng.int(8, 14));
  const p = rng.chance(0.7) ? t.slice(rng.int(0, t.length - 3)).slice(0, rng.int(2, 4)) : wordAB(rng, 3);
  const r = S.naiveMatch(t, p);
  return num(`patternMatch("${t}", "${p}") returns?`, r.idx, r.idx >= 0 ? `First occurrence starts at index ${r.idx}.` : 'No occurrence: −1.');
};
const matchCompQ: QGen = (rng) => {
  const t = wordAB(rng, rng.int(7, 11));
  const p = wordAB(rng, rng.int(2, 3));
  const r = S.naiveMatch(t, p);
  return num(`How many character comparisons (text[i+j] == pat[j] evaluations) does naive matching make for text "${t}", pattern "${p}"?`, r.comps, `Shift by shift until ${r.idx >= 0 ? `the match at ${r.idx}` : 'the last shift'}: ${r.comps} comparisons.`);
};
const lpsQ: QGen = (rng) => {
  const p = Array.from({ length: rng.int(5, 8) }, () => 'ab'[rng.int(0, 1)]).join('');
  return seq(`Write the lps (failure) array for pattern "${p}".`, S.lps(p), `lps = [${S.lps(p).join(', ')}]: for each prefix, the longest proper prefix that is also its suffix.`);
};
const strOpQ: QGen = (rng) => {
  const s = rng.pick(['algorithm', 'datastructure', 'recursion', 'polynomial', 'interpolation', 'hashing']);
  const pos = rng.int(0, s.length - 4);
  const len = rng.int(2, 4);
  return txt(`substring("${s}", ${pos}, ${len}, out) — what is out?`, S.substring(s, pos, len), `Characters ${pos} … ${pos + len - 1} (0-based).`);
};
const L8_BANK = [
  mcq('How many bytes does the C string "DTU" occupy?', '4', ['3', '2', '5'], "3 characters + '\\0'."),
  mcq('Worst-case comparisons of naive pattern matching (text n, pattern m)?', '(n − m + 1)·m', ['n + m', 'n·log m', 'n − m'], 'Every shift can compare all m characters.'),
  mcq('KMP runs in…', 'Θ(n + m)', ['Θ(nm)', 'Θ(n log m)', 'Θ(m²)'], 'O(m) to build lps, O(n) to scan; the text pointer never moves back.'),
  mcq('Why is strlen Θ(n)?', 'It must walk to the terminating null character', ['It sorts the string', 'It copies the string', 'It is O(1) in C'], 'C strings don\'t store their length.'),
  mcq('lps[i] for a pattern is…', 'the length of the longest proper prefix of pat[0..i] that is also a suffix of it', ['the number of occurrences of pat[i]', 'the index of the last mismatch', 'the length of pat'], 'Also called the failure function.'),
  mcq('After concat(dest, src), the character at index |dest| + |src| is…', "'\\0'", ["src[0]", 'whatever byte was there before', "dest[0]"], 'The terminator must be written explicitly.'),
  tf('Naive matching tries every shift i from 0 to n − m.', true, 'That is n − m + 1 alignments.'),
];

const L8: Level = {
  id: 'L08',
  n: 8,
  world: 2,
  title: 'Strings & Pattern Matching',
  blurb: "Null-terminated strings, writing length/concat/substring yourself, naive pattern matching — and a bonus KMP with its failure table.",
  syllabus: ['DS U1 · Strings and string operations'],
  snippets: ['string_ops', 'pattern_match'],
  extraSnippets: ['kmp_search'],
  Lesson: L8Lesson,
  Practice: L8Practice,
  quiz: [matchIdxQ, matchIdxQ, matchCompQ, matchCompQ, lpsQ, strOpQ, bank(L8_BANK), bank(L8_BANK)],
  cards: [
    { q: 'Naive pattern matching worst case?', a: '(n − m + 1)·m comparisons → O(nm).' },
    { q: 'What does lps[j−1] tell KMP on a mismatch after j matches?', a: 'How many pattern characters are still matched: continue with j = lps[j−1].' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Strings (string operations, nfind, KMP pattern matching with the failure function).', 'Cormen et al., Introduction to Algorithms 3e — §32.1 naive matching, §32.4 KMP.'],
};

export default [L4, L5, L6, L7, L8];
