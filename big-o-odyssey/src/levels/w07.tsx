import type { Frame, Level, QGen, Scene, SNode, SEdge } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, nums, int } from '../core/vizkit';
import { mcq, num, seq, tf, bank } from '../core/qhelp';
import * as H from '../engines/hash';

/* =====================================================================
   Level 32 — Hash functions
   ===================================================================== */

function hashFnFrames(key: number, m: number): Frame[] {
  const s = String(key);
  const box = (lines: string[]): Scene => ({
    w: 560,
    h: 60 + lines.length * 30,
    nodes: lines.map((l, i) => ({ id: `l${i}`, x: 20, y: 40 + i * 30, shape: 'text', label: l, anchor: 'start', fontSize: 15, tone: i === lines.length - 1 ? 'accent' : 'base' }) as SNode),
  });
  const F: Frame[] = [];
  const lines: string[] = [`key k = ${key}, table size M = ${m}`];
  F.push({ scene: box(lines), say: 'Four ways to turn the same key into a table address.' });
  lines.push(`Division:      k mod M = ${key} mod ${m} = ${H.hDivision(key, m)}`);
  F.push({ scene: box(lines), say: `Division: remainder after dividing by M. Choose M prime and not close to a power of 2 so all digits of the key matter.`, sfx: 'tick' });
  if (key >= 1000 && key <= 9999) {
    const ms = H.hMidSquare(key);
    lines.push(`Mid-square:    k² = ${ms.sq} → digits 4–5 → ${String(ms.addr).padStart(2, '0')}`);
    F.push({ scene: box(lines), say: 'Mid-square: square the key and take the middle digits — they depend on every digit of the key.', sfx: 'tick' });
  } else {
    lines.push('Mid-square:    (enter a 4-digit key to see it)');
    F.push({ scene: box(lines), say: 'Mid-square is shown for 4-digit keys (square padded to 8 digits, take the 4th–5th digits).' });
  }
  const parts = H.foldParts(s, 2);
  lines.push(`Shift fold:    ${parts.join(' + ')} = ${H.foldShift(s, 2)}`);
  F.push({ scene: box(lines), say: 'Shift folding: cut the key into equal parts and add them.', sfx: 'tick' });
  lines.push(`Boundary fold: ${parts.map((p, i) => (i % 2 ? [...p].reverse().join('') : p)).join(' + ')} = ${H.foldBoundary(s, 2)}`);
  F.push({ scene: box(lines), say: 'Boundary folding: reverse every other part (as if folding paper at the boundaries), then add.', sfx: 'tick' });
  lines.push(`Multiplication: ⌊M · frac(k · 0.618034)⌋ = ${H.hMultiplication(key, m)}`);
  F.push({ scene: box(lines), say: "Multiplication (Knuth): A ≈ (√5 − 1)/2. M's value matters less here.", sfx: 'found' });
  return F;
}

function L32Lesson() {
  return (
    <>
      <Sec title="Hashing: compute the address">
        <p>
          Searching by comparisons costs at least O(log n). <b>Hashing</b> computes where a key lives: a <b>hash function</b> h maps a key to an address in a{' '}
          <b>hash table</b> of M slots (buckets), giving expected O(1) search, insert and delete. Two different keys with the same address <b>collide</b> (they
          are synonyms); collisions are unavoidable when the key space is larger than M, so we need a good h <i>and</i> a collision-resolution method (next level).
        </p>
        <p>A good hash function is fast to compute, uses every part of the key, and spreads keys uniformly over 0 … M − 1.</p>
      </Sec>
      <Sec title="Standard hash functions">
        <Table
          head={['Method', 'Rule', 'Notes']}
          rows={[
            ['Division', 'h(k) = k mod M', 'Most common. Pick M prime, not near a power of 2.'],
            ['Mid-square', 'square k, take the middle r digits (or bits)', 'Middle digits depend on all digits of k.'],
            ['Folding (shift)', 'split k into parts of r digits, add them', 'Drop a final carry to fit the address size if required.'],
            ['Folding (boundary)', 'as shift folding, but reverse every alternate part', 'Horowitz–Sahni example below.'],
            ['Digit analysis', 'for a static, fully known key set: delete the digits with the most skewed distributions', 'Used when keys are known in advance.'],
            ['Multiplication', 'h(k) = ⌊M · frac(k·A)⌋, 0 < A < 1', 'Knuth suggests A ≈ (√5 − 1)/2 ≈ 0.618034.'],
          ]}
        />
        <F>
          Horowitz–Sahni folding: k = 12320324111220 → parts 123 | 203 | 241 | 112 | 20
          <br />
          shift: 123 + 203 + 241 + 112 + 20 = 699     boundary: 123 + 302 + 241 + 211 + 20 = 897
        </F>
        <F>Lipschutz mid-square (4th and 5th digits of k² as 8 digits): 3205² = 10272025 → 72;  7148² = 51093904 → 93;  2345² = 05499025 → 99</F>
      </Sec>
      <AlgoViz
        title="One key, five hash functions"
        fields={[
          { name: 'k', label: 'key', initial: '3205', width: 130, random: (r) => String(r.int(1000, 9999)) },
          { name: 'm', label: 'table size M', initial: '97', width: 110 },
        ]}
        build={(v) => hashFnFrames(int(v.k, 'key', 0, 99999999), int(v.m, 'M', 2, 1000))}
      />
      <Callout kind="pitfall">
        <p>M = 2^p makes k mod M just the last p bits of k — keys that differ only in higher bits all collide. Likewise M = 10^p in decimal. That is why a prime is preferred.</p>
      </Callout>
    </>
  );
}

const divQ: QGen = (rng) => {
  const m = rng.pick([7, 11, 13, 17, 19, 23, 97]);
  const k = rng.int(10, 9999);
  return num(`Division method with M = ${m}: h(${k}) = ?`, H.hDivision(k, m), `${k} mod ${m} = ${H.hDivision(k, m)}.`);
};
const midQ: QGen = (rng) => {
  const k = rng.int(1000, 9999);
  const r = H.hMidSquare(k);
  return num(`Mid-square hashing on 4-digit keys: square the key, write it as 8 digits (leading zeros if needed) and take the 4th and 5th digits. h(${k}) = ?`, r.addr, `${k}² = ${r.sq} → digits 4–5 = ${String(r.addr).padStart(2, '0')}.`);
};
const foldQ: QGen = (rng) => {
  const len = rng.int(7, 12);
  const key = String(rng.int(1, 9)) + Array.from({ length: len - 1 }, () => rng.int(0, 9)).join('');
  const boundary = rng.chance(0.5);
  const parts = H.foldParts(key, 3);
  const ans = boundary ? H.foldBoundary(key, 3) : H.foldShift(key, 3);
  return num(`Fold the key ${key} into 3-digit parts from the left (${parts.join(' | ')}) using ${boundary ? 'BOUNDARY' : 'SHIFT'} folding. What is the sum (no truncation)?`, ans, boundary ? `Reverse parts 2, 4, …: ${parts.map((p, i) => (i % 2 ? [...p].reverse().join('') : p)).join(' + ')} = ${ans}.` : `${parts.join(' + ')} = ${ans}.`);
};
const multQ: QGen = (rng) => {
  const k = rng.int(10, 999);
  const m = rng.pick([10, 100, 1000]);
  const ans = H.hMultiplication(k, m);
  return num(`Multiplication method: h(k) = ⌊M · frac(k · A)⌋ with A = 0.618034 and M = ${m}. h(${k}) = ?`, ans, `k·A = ${(k * 0.618034).toFixed(6)}; frac = ${((k * 618034) % 1000000 / 1e6).toFixed(6)}; × ${m} → ${ans}.`);
};
const L32_BANK = [
  mcq('Why is a prime table size preferred for the division method?', 'It spreads keys better; powers of 2 or 10 keep only the low-order digits', ['Primes are faster to divide by', 'It avoids all collisions', 'Required by the C++ % operator'], 'h(k) = k mod 2^p ignores all higher bits.'),
  mcq('Two keys that hash to the same address are called…', 'synonyms (a collision)', ['duplicates', 'buckets', 'clusters'], 'Collision.'),
  mcq('Which hash method suits a static set of keys known in advance?', 'Digit analysis', ['Division', 'Mid-square', 'Multiplication'], 'Analyse digit distributions and keep the most uniform ones.'),
  mcq('Expected search time with a good hash function and bounded load factor?', 'O(1)', ['O(log n)', 'O(n)', 'O(n log n)'], 'Independent of n.'),
  mcq('Knuth\'s suggested constant for the multiplication method?', 'A ≈ (√5 − 1)/2 ≈ 0.618', ['A = 0.5', 'A = π/4', 'A = 1/e'], 'The golden-ratio conjugate.'),
  tf('A perfect hash function for an arbitrary dynamic key set is always possible.', false, 'If the key universe exceeds M, collisions are unavoidable (pigeonhole).'),
];

const L32: Level = {
  id: 'L32',
  n: 32,
  world: 7,
  title: 'Hash Functions',
  blurb: 'Why hashing gives O(1) expected search, and the standard hash functions: division, mid-square, shift/boundary folding, digit analysis, multiplication.',
  syllabus: ['DS U6 · Hashing', 'DS U6 · Hash functions'],
  snippets: [],
  Lesson: L32Lesson,
  quiz: [divQ, midQ, midQ, foldQ, foldQ, multQ, bank(L32_BANK), bank(L32_BANK)],
  cards: [
    { q: 'Shift vs boundary folding?', a: 'Shift adds the parts; boundary reverses every alternate part before adding (H–S: 699 vs 897 for 12320324111220).' },
    { q: 'Division method best M?', a: 'A prime not close to a power of 2.' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Static hashing (hash functions: division, mid-square, folding, digit analysis).', 'Lipschutz, Data Structures (Schaum\'s Outline) — Hashing (mid-square, folding examples).', 'Knuth, TAOCP Vol. 3 §6.4 (multiplicative hashing).'],
};

/* =====================================================================
   Level 33 — Collision resolution
   ===================================================================== */

function L33Lesson() {
  return (
    <>
      <Sec title="1. Separate chaining">
        <p>
          Each slot holds a linked list of all keys hashing there. Inserting is O(1) (at the front); searching walks one chain of expected length α = n/M (the{' '}
          <b>load factor</b>, which may exceed 1). Deletion is just a list deletion.
        </p>
        <Code id="hash_chaining" />
      </Sec>
      <AlgoViz
        title="Separate chaining"
        fields={[
          { name: 'k', label: 'keys', initial: '15, 11, 27, 8, 12, 25, 35, 41', width: 300, random: (r) => r.distinct(r.int(7, 10), 0, 99).join(', ') },
          { name: 'b', label: 'buckets', initial: '10', width: 80 },
        ]}
        build={(v) => H.chainFrames(nums(v.k, { maxLen: 14, min: 0, max: 9999 }), int(v.b, 'buckets', 2, 12))}
        code="hash_chaining"
      />
      <Sec title="2. Open addressing: everything inside the table">
        <p>On a collision, probe a sequence of other slots h(k, 0), h(k, 1), … until a free one. α ≤ 1 always.</p>
        <Table
          head={['Probing', 'i-th probe', 'Problem']}
          rows={[
            ['Linear', '(h(k) + i) mod M', 'primary clustering — long runs of occupied slots grow'],
            ['Quadratic', '(h(k) + i²) mod M', 'secondary clustering (same h ⇒ same sequence); may not reach every slot'],
            ['Double hashing', '(h₁(k) + i·h₂(k)) mod M, h₂(k) ≠ 0 (e.g. R − k mod R)', 'needs h₂ coprime with M; best spread'],
          ]}
        />
        <Code id="hash_linear_probe" />
        <Callout kind="convention">
          <p>
            Horowitz–Sahni's quadratic probing alternates (h(k) ± i²) mod b with b a prime of the form 4j + 3, which provably visits every slot. Many exam
            questions use the simpler (h(k) + i²) mod M used here — read which one is asked.
          </p>
        </Callout>
        <Callout kind="pitfall">
          <p>
            Deleting from an open-addressed table can't simply empty the slot: later keys in the same probe chain would become unreachable. Mark it{' '}
            <b>deleted</b> (a tombstone): search skips it, insert may reuse it.
          </p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Open addressing"
        note="scheme: linear, quadratic or double (h₂(k) = R − k mod R)."
        fields={[
          { name: 's', label: 'scheme', initial: 'linear', width: 110 },
          { name: 'k', label: 'keys', initial: '22, 33, 44, 10, 11, 21, 32', width: 260, random: (r) => r.distinct(r.int(6, 9), 0, 99).join(', ') },
          { name: 'm', label: 'M', initial: '11', width: 70 },
          { name: 'r', label: 'R (double)', initial: '7', width: 80 },
        ]}
        build={(v) => {
          const s = v.s.trim().toLowerCase();
          const scheme = s.startsWith('q') ? 'quadratic' : s.startsWith('d') ? 'double' : s.startsWith('l') ? 'linear' : null;
          if (!scheme) throw new Error('scheme must be linear, quadratic or double');
          const m = int(v.m, 'M', 3, 13);
          const R = int(v.r, 'R', 2, 12);
          if (scheme === 'double' && R >= m) throw new Error('R should be a prime smaller than M.');
          return H.openAddressFrames(nums(v.k, { maxLen: 13, min: 0, max: 9999 }), m, scheme, R);
        }}
        code="hash_linear_probe"
      />
      <Sec title="Performance and rehashing">
        <Table
          head={['Method', 'Expected probes, successful', 'Expected probes, unsuccessful']}
          rows={[
            ['Chaining', '≈ 1 + α/2', '≈ α (or 1 + α counting the slot)'],
            ['Linear probing (Knuth)', '≈ ½ (1 + 1/(1 − α))', '≈ ½ (1 + 1/(1 − α)²)'],
          ]}
        />
        <p>
          As α → 1, open addressing degrades sharply, so tables are <b>rehashed</b> into a larger table (typically about double, prime size) once α passes a
          threshold such as 0.5–0.75. Every key is re-inserted with the new h.
        </p>
      </Sec>
    </>
  );
}

function L33Practice() {
  return <AlgoViz title="Predict where each key lands (linear probing)" fields={[{ name: 'k', label: 'keys', initial: '18, 41, 22, 44, 59, 32, 31, 73', width: 300, random: (r) => r.distinct(r.int(6, 9), 0, 99).join(', ') }, { name: 'm', label: 'M', initial: '13', width: 70 }]} build={(v) => H.openAddressFrames(nums(v.k, { maxLen: 12, min: 0, max: 9999 }), int(v.m, 'M', 5, 13), 'linear', 7, true)} code="hash_linear_probe" predict />;
}

const oaQ: QGen = (rng) => {
  const scheme = rng.pick(['linear', 'linear', 'quadratic', 'double'] as const);
  const m = rng.pick([7, 11, 13]);
  const R = m === 7 ? 5 : 7;
  for (;;) {
    const keys = rng.distinct(rng.int(5, Math.min(8, m - 1)), 0, 99);
    const r = H.openAddress(keys, m, scheme, R);
    if (!r.placed.every(Boolean)) continue;
    const desc = scheme === 'linear' ? '(h + i) mod M' : scheme === 'quadratic' ? '(h + i²) mod M' : `(h + i·h₂) mod M with h₂(k) = ${R} − (k mod ${R})`;
    return seq(`Insert ${keys.join(', ')} into an empty table of size M = ${m}, h(k) = k mod ${m}, ${scheme} probing ${desc}. Write the table from slot 0 to ${m - 1} (use - for empty).`, r.table.map((x) => (x === null ? '-' : String(x))), `Final table: ${r.table.map((x) => x ?? '-').join(' ')}.`);
  }
};
const probesQ: QGen = (rng) => {
  const m = rng.pick([11, 13]);
  const keys = rng.distinct(rng.int(6, 8), 0, 99);
  const r = H.openAddress(keys, m, 'linear');
  const i = rng.int(0, keys.length - 1);
  return num(`Linear probing, M = ${m}, h(k) = k mod ${m}. Keys inserted in order: ${keys.join(', ')}. How many probes (slots examined) did inserting ${keys[i]} take?`, r.probes[i].length, `Probe sequence for ${keys[i]}: ${r.probes[i].join(' → ')}.`);
};
const chainQ: QGen = (rng) => {
  const b = rng.pick([5, 7, 10]);
  const keys = rng.distinct(rng.int(6, 9), 0, 99);
  const ch = H.chain(keys, b);
  const j = rng.pick(ch.map((c, i) => [c, i] as const).filter(([c]) => c.length > 0)).at(1) as number;
  return seq(`Separate chaining, ${b} buckets, h(k) = k mod ${b}, new keys inserted at the FRONT of a chain. Insert ${keys.join(', ')}. List chain ${j} from front to back.`, ch[j], `Chain ${j}: ${ch[j].join(' → ')}.`);
};
const loadQ: QGen = (rng) => {
  const m = rng.pick([10, 20, 50, 100]);
  const n = rng.int(1, m - 1);
  const a = n / m;
  const kind = rng.int(0, 1);
  if (kind === 0) return num(`A hash table of size ${m} holds ${n} keys. Load factor α = ? (decimal)`, a, `α = n/M = ${n}/${m} = ${a}.`);
  const succ = 0.5 * (1 + 1 / (1 - a));
  const r2 = Math.round(succ * 100) / 100;
  return num(`Linear probing at α = ${a}. Using Knuth's estimate ½(1 + 1/(1 − α)), expected probes for a successful search? (round to 2 decimals)`, r2, `½(1 + 1/${(1 - a).toFixed(2)}) = ${r2}.`);
};
const L33_BANK = [
  mcq('Primary clustering is a problem of…', 'linear probing', ['separate chaining', 'double hashing', 'quadratic probing only'], 'Occupied runs grow and absorb new keys.'),
  mcq('Which method can have a load factor greater than 1?', 'Separate chaining', ['Linear probing', 'Quadratic probing', 'Double hashing'], 'Chains can be arbitrarily long.'),
  mcq('Secondary clustering means…', 'keys with the same home address follow the same probe sequence', ['chains get too long', 'the table must be rehashed', 'two hash functions collide'], 'Quadratic probing suffers from it; double hashing avoids it.'),
  mcq('In double hashing, h₂(k) must never be…', '0', ['odd', 'prime', 'greater than 1'], 'Otherwise the probe sequence never moves.'),
  mcq('Why are deleted slots marked with a tombstone in open addressing?', 'So searches don\'t stop early at a slot that used to hold a key', ['To save memory', 'To speed up insertion', 'To avoid rehashing'], 'An empty slot ends a search.'),
  mcq('Rehashing means…', 'building a larger table and re-inserting every key with the new hash function', ['hashing a key twice', 'using double hashing', 'deleting collided keys'], 'Triggered by a high load factor.'),
  tf('Quadratic probing (h + i²) mod M is guaranteed to find an empty slot whenever one exists.', false, 'Only some slots are reachable; with M prime it reaches at least half when α ≤ ½.'),
];

const L33: Level = {
  id: 'L33',
  n: 33,
  world: 7,
  title: 'Collision Resolution',
  blurb: 'Separate chaining, open addressing with linear/quadratic probing and double hashing, clustering, tombstones, load factor and rehashing.',
  syllabus: ['DS U6 · Collision resolution techniques'],
  snippets: ['hash_chaining', 'hash_linear_probe'],
  Lesson: L33Lesson,
  Practice: L33Practice,
  quiz: [oaQ, oaQ, oaQ, probesQ, chainQ, chainQ, loadQ, bank(L33_BANK), bank(L33_BANK)],
  cards: [
    { q: 'Probe formulas?', a: 'Linear (h + i) mod M; quadratic (h + i²) mod M; double (h₁ + i·h₂) mod M.' },
    { q: 'Linear probing expected probes (Knuth)?', a: 'Successful ½(1 + 1/(1−α)); unsuccessful ½(1 + 1/(1−α)²).' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Overflow handling (linear open addressing, quadratic probing, rehashing, chaining).', 'Knuth, TAOCP Vol. 3 §6.4 (analysis of linear probing).', 'Cormen et al., Introduction to Algorithms 3e — §11.2 chaining, §11.4 open addressing.'],
};

/* =====================================================================
   Level 34 — File organisation and indexing
   ===================================================================== */

function indexFrames(keys: number[], perBlock: number, target: number): Frame[] {
  const sorted = [...keys].sort((a, b) => a - b);
  const blocks: number[][] = [];
  for (let i = 0; i < sorted.length; i += perBlock) blocks.push(sorted.slice(i, i + perBlock));
  const idx = blocks.map((b) => b[0]);
  const F: Frame[] = [];
  const sc = (hiIdx: number | null, hiBlock: number | null, hiRec: number | null): Scene => {
    const nodes: SNode[] = [];
    const edges: SEdge[] = [];
    nodes.push({ id: 'ilbl', x: 50, y: 24, shape: 'text', label: 'sparse primary index', tone: 'muted', fontSize: 11 });
    idx.forEach((k, i) => {
      nodes.push({ id: `i${i}`, x: 50, y: 56 + i * 44, w: 60, h: 34, shape: 'rect', label: k, tone: i === hiIdx ? 'active' : 'accent' });
      nodes.push({ id: `blk${i}`, x: 160, y: 56 + i * 44, shape: 'text', label: `block ${i}`, tone: 'muted', fontSize: 11 });
      edges.push({ from: `i${i}`, to: `r${i}-0`, directed: true, tone: i === hiIdx ? 'active' : 'muted' });
    });
    blocks.forEach((b, i) =>
      b.forEach((k, j) => nodes.push({ id: `r${i}-${j}`, x: 220 + j * 52, y: 56 + i * 44, w: 48, h: 34, shape: 'rect', label: k, tone: i === hiBlock ? (j === hiRec ? 'done' : 'compare') : 'base' })),
    );
    return { w: 260 + perBlock * 52, h: 80 + blocks.length * 44, nodes, edges };
  };
  F.push({ scene: sc(null, null, null), say: `${sorted.length} records sorted on the key, ${perBlock} per block → ${blocks.length} blocks. The sparse index keeps one entry per block: the block's first key.` });
  let bi = -1;
  for (let i = 0; i < idx.length; i++) {
    if (idx[i] <= target) bi = i;
  }
  F.push({ scene: sc(Math.max(0, bi), null, null), say: bi < 0 ? `${target} is smaller than every index key: not in the file.` : `Search the (small, sorted) index for the last entry ≤ ${target}: ${idx[bi]} → block ${bi}. (Binary search on the index: ⌈log₂ ${idx.length}⌉ = ${Math.ceil(Math.log2(Math.max(2, idx.length)))} steps.)`, sfx: 'compare' });
  if (bi < 0) return F;
  const j = blocks[bi].indexOf(target);
  F.push({ scene: sc(bi, bi, j >= 0 ? j : null), say: j >= 0 ? `Read block ${bi} (one block access) and find ${target} at position ${j}.` : `Read block ${bi}: ${target} is not there, so it is not in the file.`, sfx: j >= 0 ? 'found' : 'wrong' });
  return F;
}

function L34Lesson() {
  return (
    <>
      <Sec title="Files, records and keys">
        <p>
          A <b>file</b> is a collection of <b>records</b>; a record is a collection of <b>fields</b>. The <b>primary key</b> identifies a record uniquely; other
          fields used for retrieval are <b>secondary keys</b>. Files live on block devices: the unit of transfer is a block, so cost is counted in{' '}
          <b>block accesses</b>.
        </p>
      </Sec>
      <Sec title="File organisations">
        <Table
          head={['Organisation', 'How records are placed', 'Good at', 'Weak at']}
          rows={[
            ['Serial / heap', 'in arrival order', 'fast insertion', 'search = scan, O(b) blocks'],
            ['Sequential (ordered)', 'sorted on a key', 'batch processing, range scans, binary search', 'insertion/deletion (shift or overflow)'],
            ['Indexed sequential (ISAM)', 'sorted + a multi-level index + overflow areas', 'both sequential and random access', 'overflow chains grow; periodic reorganisation'],
            ['Direct / relative / hashed', 'address computed from the key (Level 32)', 'O(1) random access by key', 'range queries, sorted output'],
            ['Multi-key: inverted / multilist (H–S)', 'secondary-key indexes or record lists per key value', 'queries on secondary keys', 'update cost, extra storage'],
          ]}
        />
      </Sec>
      <Sec title="Indexes">
        <ul>
          <li>
            <b>Dense</b> index: one entry per record. <b>Sparse</b>: one entry per block (only possible when the file is sorted on that key).
          </li>
          <li>
            <b>Primary index</b>: on the ordering key of a sorted file — sparse, entries = number of blocks.
          </li>
          <li>
            <b>Clustering index</b>: on an ordering non-key field — one entry per distinct value.
          </li>
          <li>
            <b>Secondary index</b>: on a non-ordering field — must be dense; several per file are possible.
          </li>
          <li>
            <b>Multilevel index</b>: index the index until one block remains; with fan-out fo, levels ≈ ⌈log_fo(entries)⌉.
          </li>
          <li>
            <b>B-tree / B⁺-tree index</b>: a dynamic multilevel index (Level 31). In a B⁺-tree all record pointers are in the leaves, which are chained for
            sequential access; internal nodes hold only keys, so fan-out is higher.
          </li>
        </ul>
      </Sec>
      <AlgoViz
        title="Searching through a sparse primary index"
        fields={[
          { name: 'k', label: 'record keys', initial: '5, 12, 17, 23, 31, 38, 44, 50, 57, 63, 71, 78, 85, 92', width: 360, random: (r) => r.distinct(r.int(10, 16), 1, 99).join(', ') },
          { name: 'p', label: 'records/block', initial: '3', width: 100 },
          { name: 't', label: 'find', initial: '57', width: 80 },
        ]}
        build={(v) => indexFrames(nums(v.k, { maxLen: 24, min: 0, max: 9999 }), int(v.p, 'records per block', 1, 6), int(v.t, 'key', 0, 9999))}
      />
      <Sec title="Block-access arithmetic (Elmasri–Navathe style)">
        <F>
          blocking factor bfr = ⌊B / R⌋   (B = block size, R = record size)      blocks b = ⌈r / bfr⌉
          <br />
          unordered file: linear search ≈ b/2 block accesses (b if absent)     ordered file: binary search ≈ ⌈log₂ b⌉
          <br />
          primary index with b entries of size Rᵢ: bfrᵢ = ⌊B / Rᵢ⌋, bᵢ = ⌈b / bfrᵢ⌉, search = ⌈log₂ bᵢ⌉ + 1
          <br />
          multilevel index: fan-out fo = bfrᵢ, levels t = ⌈log_fo(bᵢ … entries)⌉, search = t + 1
        </F>
      </Sec>
    </>
  );
}

const blockQ: QGen = (rng) => {
  const B = rng.pick([512, 1024, 2048, 4096]);
  const R = rng.pick([60, 75, 100, 120, 150, 200]);
  const r = rng.pick([10000, 30000, 50000, 100000]);
  const bfr = Math.floor(B / R);
  const b = Math.ceil(r / bfr);
  const k = rng.int(0, 3);
  if (k === 0) return num(`Block size B = ${B} bytes, record size R = ${R} bytes. Blocking factor bfr = ⌊B/R⌋ = ?`, bfr, `⌊${B}/${R}⌋ = ${bfr}.`);
  if (k === 1) return num(`r = ${r} records, B = ${B}, R = ${R} (unspanned). How many blocks does the file need?`, b, `bfr = ${bfr}; b = ⌈${r}/${bfr}⌉ = ${b}.`);
  if (k === 2) return num(`r = ${r} records, B = ${B}, R = ${R}; the file is sorted on the key. Block accesses for a binary search = ⌈log₂ b⌉ = ?`, Math.ceil(Math.log2(b)), `b = ${b}; ⌈log₂ ${b}⌉ = ${Math.ceil(Math.log2(b))}.`);
  const Ri = rng.pick([8, 10, 12, 16]);
  const bfri = Math.floor(B / Ri);
  const bi = Math.ceil(b / bfri);
  return num(`Sorted file of ${b} blocks with a sparse primary index; entries are ${Ri} bytes, B = ${B}. Block accesses to find a record via binary search on the index (⌈log₂ bᵢ⌉ + 1)?`, Math.ceil(Math.log2(bi)) + 1, `bfrᵢ = ⌊${B}/${Ri}⌋ = ${bfri}; bᵢ = ⌈${b}/${bfri}⌉ = ${bi}; ⌈log₂ ${bi}⌉ + 1 = ${Math.ceil(Math.log2(bi)) + 1}.`);
};
const levelsQ: QGen = (rng) => {
  const fo = rng.pick([32, 64, 68, 100, 128]);
  const entries = rng.pick([1000, 5000, 30000, 100000, 1000000]);
  let t = 0;
  for (let e = entries; e > 1; e = Math.ceil(e / fo)) t++;
  return num(`A multilevel index with fan-out ${fo} indexes ${entries} first-level entries. How many index levels are needed until a single top block remains?`, t, `Repeatedly divide by ${fo} (rounding up) until 1: ${t} level(s).`);
};
const L34_BANK = [
  mcq('A sparse index has one entry per…', 'block', ['record', 'field', 'file'], 'Requires the file to be sorted on the indexed key.'),
  mcq('A secondary index on a non-ordering field must be…', 'dense', ['sparse', 'clustered', 'hashed'], 'Records with any key value may be in any block.'),
  mcq('Which organisation gives the fastest random access by key but no useful order?', 'Direct (hashed)', ['Sequential', 'Indexed sequential', 'Serial'], 'Address computed from the key.'),
  mcq('ISAM files combine…', 'a sorted file, a multilevel index and overflow areas', ['two hash tables', 'a heap and a stack', 'B-trees and linked lists only'], 'Indexed Sequential Access Method.'),
  mcq('In a B⁺-tree index, record pointers are stored…', 'only in the leaves, which are linked', ['in every node', 'only in the root', 'in a separate hash table'], 'Internal nodes hold only routing keys.'),
  mcq('Batch processing with a high hit ratio is best served by…', 'sequential organisation', ['direct organisation', 'inverted files', 'hashing with chaining'], 'One pass over a sorted file.'),
  mcq('An inverted file is…', 'an index per secondary key listing the records with each key value', ['a file stored backwards', 'a file sorted in descending order', 'a hash table'], 'Horowitz–Sahni\'s multi-key organisation.'),
  tf('A file can have several secondary indexes but only one primary (ordering) index.', true, 'It can be physically sorted on only one key.'),
];

const L34: Level = {
  id: 'L34',
  n: 34,
  world: 7,
  title: 'File Organisation & Indexing',
  blurb: 'Records and keys, serial/sequential/indexed-sequential/direct/inverted files, dense vs sparse, primary/clustering/secondary/multilevel and B⁺-tree indexes, and block-access arithmetic.',
  syllabus: ['DS U6 · File organization', 'DS U6 · Indexing'],
  snippets: [],
  Lesson: L34Lesson,
  quiz: [blockQ, blockQ, blockQ, blockQ, levelsQ, bank(L34_BANK), bank(L34_BANK), bank(L34_BANK)],
  cards: [
    { q: 'Dense vs sparse index?', a: 'Dense: entry per record. Sparse: entry per block (file must be sorted on the key).' },
    { q: 'Blocks for r records?', a: 'bfr = ⌊B/R⌋, b = ⌈r/bfr⌉; binary search ⌈log₂ b⌉.' },
  ],
  refs: ['Horowitz & Sahni, Fundamentals of Data Structures (Galgotia — the syllabus edition) — chapter "Files" (file organisations, indexing techniques, inverted and multilist files).', 'Elmasri & Navathe, Fundamentals of Database Systems — Ch. 16–17 (blocking factor, primary/clustering/secondary/multilevel indexes, B⁺-trees).'],
};

export default [L32, L33, L34];
