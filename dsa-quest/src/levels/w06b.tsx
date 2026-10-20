import type { Level, QGen } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, nums, int } from '../core/vizkit';
import { mcq, num, seq, tf, bank } from '../core/qhelp';
import * as T from '../engines/trees';
import type { Rng } from '../core/rng';

const distinctTree = (rng: Rng, n: number): T.TN | null => {
  const vals = rng.shuffle([...Array(40).keys()].map((x) => x + 1)).slice(0, n);
  const t = T.randomTree(rng, n);
  let k = 0;
  const relabel = (x: T.TN | null): void => {
    if (!x) return;
    x.v = vals[k++];
    relabel(x.left);
    relabel(x.right);
  };
  relabel(t);
  return t;
};

/* =====================================================================
   Level 28 — Threaded binary trees
   ===================================================================== */

function L28Lesson() {
  return (
    <>
      <Sec title="Put the null links to work">
        <p>
          A linked binary tree with n nodes has n + 1 null links. Perlis and Thornton's idea (as presented by Horowitz–Sahni): replace them with{' '}
          <b>threads</b>:
        </p>
        <ul>
          <li>a null <code>left</code> link points to the node's <b>inorder predecessor</b>;</li>
          <li>a null <code>right</code> link points to its <b>inorder successor</b>;</li>
          <li>
            two boolean flags, <code>leftThread</code> and <code>rightThread</code>, tell a thread from a real child;
          </li>
          <li>
            a <b>head node</b> closes the loose ends: head→left is the root, and the first node's left thread and the last node's right thread point to head.
            An empty tree is a head whose left is a thread to itself.
          </li>
        </ul>
        <Code id="threaded_tree" />
        <p>
          <b>insucc(t)</b>: if t's right link is a thread, it <i>is</i> the successor; otherwise go to the right child and then follow left links until you hit a
          node whose left link is a thread. Inorder traversal is then a loop of insucc calls — no stack, no recursion, Θ(n) total.
        </p>
      </Sec>
      <AlgoViz
        title="Traverse a threaded tree without a stack"
        note="Tree as preorder with # for empty."
        fields={[{ name: 't', label: 'tree', initial: '1 2 4 # # 5 # # 3 # 6 # #', width: 340, random: (r) => T.serialise(distinctTree(r, r.int(5, 8))).trim() }]}
        build={(v) => {
          const t = T.parseTree(v.t);
          if (T.countNodes(t) > 12) throw new Error('At most 12 nodes.');
          return T.threadedFrames(t);
        }}
        code="threaded_tree"
      />
      <Sec title="Variations">
        <ul>
          <li>
            <b>One-way (right) threading</b>: only null right links become successor threads — enough for forward inorder traversal.
          </li>
          <li>
            <b>Two-way threading</b>: both kinds (above) — supports finding the predecessor too.
          </li>
          <li>Inserting a node as the right child of s (H–S insertRight) must copy s's right thread into the new node and fix the thread of its successor.</li>
        </ul>
        <Callout kind="pitfall">
          <p>Always test the thread flag before descending. Treating a thread as a child walks you back up the tree and causes infinite loops.</p>
        </Callout>
      </Sec>
    </>
  );
}

const threadQ: QGen = (rng) => {
  const t = distinctTree(rng, rng.int(5, 8));
  const ino = T.inorder(t);
  const k = rng.int(0, 2);
  if (k === 2) return num(`How many threads does the inorder-threaded version of a binary tree with ${T.countNodes(t)} nodes contain (counting the two that point to the head node)?`, T.countNodes(t) + 1, 'One thread per null link: n + 1.');
  const nodesWithNullRight: number[] = [];
  const nodesWithNullLeft: number[] = [];
  const walk = (x: T.TN | null) => {
    if (!x) return;
    if (!x.right) nodesWithNullRight.push(x.v);
    if (!x.left) nodesWithNullLeft.push(x.v);
    walk(x.left);
    walk(x.right);
  };
  walk(t);
  const scene = T.tnScene(t);
  if (k === 0) {
    const x = rng.pick(nodesWithNullRight);
    const i = ino.indexOf(x);
    const ans = i + 1 < ino.length ? String(ino[i + 1]) : 'head';
    return mcq(`In the inorder-threaded version of this tree, where does ${x}'s right thread point?`, ans, [...new Set(['head', ...ino.map(String)])].filter((o) => o !== ans && o !== String(x)).slice(0, 3), `Right thread → inorder successor: ${ans}. Inorder: ${ino.join(' ')}.`, { scene });
  }
  const x = rng.pick(nodesWithNullLeft);
  const i = ino.indexOf(x);
  const ans = i > 0 ? String(ino[i - 1]) : 'head';
  return mcq(`In the inorder-threaded version of this tree, where does ${x}'s left thread point?`, ans, [...new Set(['head', ...ino.map(String)])].filter((o) => o !== ans && o !== String(x)).slice(0, 3), `Left thread → inorder predecessor: ${ans}. Inorder: ${ino.join(' ')}.`, { scene });
};
const L28_BANK = [
  mcq('In an inorder-threaded binary tree, a null right link is replaced by a pointer to…', 'the inorder successor', ['the inorder predecessor', 'the parent', 'the root'], 'Left threads point to predecessors.'),
  mcq('Why does each node of a threaded tree need two extra flags?', 'To distinguish threads from real child pointers', ['To store the height', 'To mark deleted nodes', 'To count children'], 'leftThread / rightThread.'),
  mcq('Main advantage of a threaded binary tree?', 'Inorder traversal without a stack or recursion', ['Faster insertion', 'Smaller nodes', 'Automatic balancing'], 'Threads lead directly to the successor.'),
  mcq('In H–S\'s threaded tree, the head node\'s left link points to…', 'the root (or to head itself when the tree is empty)', ['the last node', 'NULL', 'the leftmost node'], 'head->right points to head.'),
  mcq('insucc(t) when t->rightThread is false…', 'goes to t->right, then follows left links until a left thread', ['returns t->right directly', 'returns the parent', 'returns head'], 'The successor is the leftmost node of the right subtree.'),
  tf('A threaded tree with n nodes has exactly n + 1 threads.', true, 'There are n + 1 null links to replace.'),
];

const L28: Level = {
  id: 'L28',
  n: 28,
  world: 6,
  title: 'Threaded Binary Trees',
  blurb: 'Replace the n + 1 null links with inorder threads, the H–S head node, insucc, and stack-free inorder traversal.',
  syllabus: ['DS U3 · Threaded trees'],
  snippets: ['threaded_tree'],
  Lesson: L28Lesson,
  quiz: [threadQ, threadQ, threadQ, threadQ, bank(L28_BANK), bank(L28_BANK), bank(L28_BANK)],
  cards: [{ q: 'insucc in a threaded tree?', a: 'temp = t->right; if (!t->rightThread) while (!temp->leftThread) temp = temp->left; return temp;' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Threaded binary trees (insucc, tinorder, insertRight).'],
};

/* =====================================================================
   Level 29 — Heaps, heap sort, heap priority queue
   ===================================================================== */

function L29Lesson() {
  return (
    <>
      <Sec title="Max-heaps and min-heaps">
        <p>
          A <b>max-heap</b> is a <b>complete</b> binary tree in which every node's key is ≥ its children's keys (a min-heap: ≤). The maximum is at the root.
          Equal keys are allowed (as your heap deck notes). Because it is complete, it lives in an array with no gaps:
        </p>
        <Table
          head={['', '1-based (H–S, CLRS)', '0-based (code here)']}
          rows={[
            ['parent of i', '⌊i/2⌋', '⌊(i − 1)/2⌋'],
            ['left child', '2i', '2i + 1'],
            ['right child', '2i + 1', '2i + 2'],
            ['last internal node', '⌊n/2⌋', 'n/2 − 1'],
          ]}
        />
      </Sec>
      <Sec title="Insert (sift up) and delete-max (sift down)">
        <Code id="heap_pq" />
        <ul>
          <li>Insert: add at the next free leaf, then swap upward while larger than the parent — O(log n) (O(1) if it already fits, as your deck notes).</li>
          <li>Delete-max: the root leaves; the last element moves to the root and sifts down by swapping with the <b>larger</b> child — O(log n).</li>
        </ul>
      </Sec>
      <AlgoViz
        title="Heap as a priority queue"
        note="Operations: ins x, del"
        fields={[{ name: 'ops', label: 'operations', initial: 'ins 30, ins 50, ins 20, ins 60, ins 10, ins 55, del, del', width: 420 }]}
        build={(v) => {
          const ops = v.ops.split(',').map((p) => p.trim().toLowerCase()).filter(Boolean).map((p) => {
            const m = /^(ins|insert)\s+(-?\d+)$/.exec(p);
            if (m) return { k: 'ins' as const, x: +m[2] };
            if (/^(del|deletemax)$/.test(p)) return { k: 'del' as const };
            throw new Error(`Can't read "${p}" — use ins x or del.`);
          });
          if (ops.length > 14) throw new Error('At most 14 operations.');
          return T.heapPQFrames(ops);
        }}
        code="heap_pq"
      />
      <Sec title="Building a heap: two ways">
        <Table
          head={['Method', 'How', 'Cost']}
          rows={[
            ['Top-down (repeated insertion) — your deck', 'insert elements one by one', 'O(n log n)'],
            ['Bottom-up (heapify) — Floyd / CLRS', 'heapify nodes n/2−1 … 0 in reverse', 'O(n) — most nodes are near the bottom and sift only a little'],
          ]}
        />
        <Callout kind="pitfall">
          <p>The two methods can produce <b>different</b> heaps from the same input. Read which one the question asks for; the code here (and most exam heap-sort answers) builds bottom-up.</p>
        </Callout>
      </Sec>
      <Sec title="Heap sort (Lab Experiment 3)">
        <Code id="heap_sort" />
        <p>
          Build a max-heap, then n − 1 times swap the root (max) with the last element of the heap, shrink the heap by one and heapify the root. Θ(n log n) in
          every case, in place (O(1) extra), <b>not stable</b>.
        </p>
      </Sec>
      <AlgoViz
        title="Heap sort"
        fields={[{ name: 'a', label: 'array', initial: '4, 10, 3, 5, 1, 8, 7', random: (r) => r.ints(r.int(6, 9), 1, 60).join(', ') }]}
        build={(v) => T.heapSortFrames(nums(v.a, { maxLen: 10 }))}
        code="heap_sort"
      />
      <Callout kind="daa">
        <p>Heaps power priority queues in Dijkstra, Prim and Huffman (World 9–10), and heap sort is one of DAA Unit 2's sorting algorithms.</p>
      </Callout>
    </>
  );
}

function L29Practice() {
  return <AlgoViz title="Predict every heapify decision" fields={[{ name: 'a', label: 'array', initial: '3, 9, 2, 1, 4, 5, 8', random: (r) => r.ints(r.int(6, 8), 1, 60).join(', ') }]} build={(v) => T.heapSortFrames(nums(v.a, { maxLen: 9 }), true, true)} code="heap_sort" predict />;
}

const buildQ: QGen = (rng) => {
  const a = rng.distinct(rng.int(6, 9), 1, 60);
  if (rng.chance(0.6)) return seq(`Build a max-heap from [${a.join(', ')}] using the bottom-up method (heapify from the last internal node down to the root). Write the array.`, T.buildHeap(a), `Bottom-up: [${T.buildHeap(a).join(', ')}].`);
  const h: number[] = [];
  for (const x of a) T.heapInsert(h, x);
  return seq(`Insert ${a.join(', ')} one at a time into an empty max-heap (sift-up insertion). Write the final array.`, h, `Top-down: [${h.join(', ')}].`);
};
const delQ: QGen = (rng) => {
  const h = T.buildHeap(rng.distinct(rng.int(6, 9), 1, 60));
  const before = h.slice();
  T.heapDeleteMax(h);
  return seq(`Max-heap array [${before.join(', ')}]. Perform one deleteMax. Write the array.`, h, `Last element to the root, then sift down: [${h.join(', ')}].`);
};
const hsQ: QGen = (rng) => {
  const a = rng.distinct(rng.int(6, 8), 1, 60);
  const h = T.buildHeap(a);
  const k = rng.int(1, 2);
  for (let i = h.length - 1; i > h.length - 1 - k; i--) {
    [h[0], h[i]] = [h[i], h[0]];
    T.heapify(h, i, 0);
  }
  return seq(`Heap sort on [${a.join(', ')}]: after building the max-heap (bottom-up), perform ${k} extraction step(s) (swap root with last, shrink, heapify). Write the whole array.`, h, `Array: [${h.join(', ')}].`);
};
const idxQ: QGen = (rng) => {
  const i = rng.int(1, 30);
  const zero = rng.chance(0.5);
  return zero
    ? num(`0-based heap array: index of the right child of index ${i}?`, 2 * i + 2, 'Right child = 2i + 2.')
    : num(`0-based heap array: index of the parent of index ${i}?`, Math.floor((i - 1) / 2), 'Parent = ⌊(i − 1)/2⌋.');
};
const L29_BANK = [
  mcq('Time to build a heap bottom-up from n elements?', 'O(n)', ['O(n log n)', 'O(log n)', 'O(n²)'], 'Σ (height × nodes at that height) is O(n).'),
  mcq('Time to build a heap by inserting n elements one by one?', 'O(n log n)', ['O(n)', 'O(log n)', 'O(n²)'], 'Each insertion is O(log n).'),
  mcq('Heap sort worst-case time?', 'Θ(n log n)', ['Θ(n²)', 'Θ(n)', 'Θ(log n)'], 'Same in all cases.'),
  mcq('Is heap sort stable?', 'No', ['Yes', 'Only for distinct keys', 'Only in-place versions'], 'Swaps with the root reorder equal keys.'),
  mcq('In a max-heap, the minimum element is…', 'in one of the leaves', ['at the root', 'always the last array element', 'always a left child'], 'Any leaf can hold it.'),
  mcq('Where is the last internal node of an n-element 0-based heap?', 'index n/2 − 1', ['index n − 1', 'index n/2', 'index 0'], 'Heapify starts here when building bottom-up.'),
  mcq('deleteMax moves which element to the root before sifting down?', 'the last element of the heap array', ['the larger child', 'the smallest element', 'a random leaf'], 'Keeps the tree complete.'),
  tf('A heap is a binary search tree.', false, 'Only the parent–child order holds; left vs right is unordered.'),
];

const L29: Level = {
  id: 'L29',
  n: 29,
  world: 6,
  title: 'Heaps & Heap Sort',
  blurb: 'Max/min heaps in an array, sift-up insert and sift-down delete, bottom-up O(n) build vs top-down, heap sort, and heap priority queues.',
  syllabus: ['DS U4 · Heap sort', 'DS U1 · Priority queues', 'DAA U2 · Heap sort'],
  snippets: ['heap_sort', 'heap_pq'],
  Lesson: L29Lesson,
  Practice: L29Practice,
  quiz: [buildQ, buildQ, buildQ, delQ, hsQ, hsQ, idxQ, bank(L29_BANK), bank(L29_BANK)],
  cards: [
    { q: 'heapify(a, n, i) in words?', a: 'largest of i, 2i+1, 2i+2 (within n); if not i, swap and heapify there.' },
    { q: 'Heap sort steps?', a: 'Build bottom-up (i = n/2−1 … 0); for i = n−1 … 1: swap(a[0], a[i]); heapify(a, i, 0).' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Heaps, Heap sort.', 'Cormen et al., Introduction to Algorithms 3e — Ch. 6 Heapsort (BUILD-MAX-HEAP is O(n)).', 'Your DAA deck "9. heap" and Lab Experiment 3.'],
};

/* =====================================================================
   Level 30 — AVL trees
   ===================================================================== */

function L30Lesson() {
  return (
    <>
      <Sec title="Height-balanced trees">
        <p>
          Horowitz–Sahni: an empty tree is height-balanced. A non-empty binary tree T with subtrees T<sub>L</sub> and T<sub>R</sub> is height-balanced iff T
          <sub>L</sub> and T<sub>R</sub> are height-balanced and |h<sub>L</sub> − h<sub>R</sub>| ≤ 1. An <b>AVL tree</b> (Adelson-Velskii and Landis) is a
          height-balanced binary search tree.
        </p>
        <F>balance factor BF(T) = h(left subtree) − h(right subtree) ∈ {'{'}−1, 0, +1{'}'}</F>
        <p>
          Height is O(log n) — at most about 1.44 log₂ n — so search, insert and delete are all O(log n). The fewest nodes an AVL tree of height h can have
          satisfies N(h) = N(h−1) + N(h−2) + 1, with N(1) = 1, N(2) = 2 (root at level 1): 1, 2, 4, 7, 12, 20, 33, … (Fibonacci-like).
        </p>
      </Sec>
      <Sec title="Rotations after insertion">
        <p>
          After a normal BST insertion, walk back up. Let A be the nearest ancestor whose BF became ±2. The case is named by the first two steps of the path from A
          to the new node:
        </p>
        <Table
          head={['Case', 'New node is in…', 'Fix']}
          rows={[
            ['LL', 'left subtree of A\'s left child', 'single right rotation at A'],
            ['RR', 'right subtree of A\'s right child', 'single left rotation at A'],
            ['LR', 'right subtree of A\'s left child', 'left rotation at the left child, then right rotation at A'],
            ['RL', 'left subtree of A\'s right child', 'right rotation at the right child, then left rotation at A'],
          ]}
        />
        <Code id="avl_rotations" />
        <Code id="avl_insert" />
        <p>After an insertion, at most one (single or double) rotation is needed, and it restores the subtree to its height before the insertion.</p>
      </Sec>
      <AlgoViz
        title="AVL insertion with rotations"
        note="Balance factors are shown beside each node."
        fields={[{ name: 'k', label: 'insert keys', initial: '10, 20, 30, 40, 50, 25', width: 320, random: (r) => r.distinct(r.int(6, 9), 1, 99).join(', ') }]}
        build={(v) => T.avlInsertFrames(nums(v.k, { maxLen: 14, min: 0, max: 999 }))}
        code="avl_insert"
      />
      <Sec title="Deletion">
        <p>
          Delete as in a BST, then check every ancestor on the way up. Here the rotation is chosen by the <b>balance factor of the sibling-side child</b>, not by
          the deleted key. Indian textbooks name them by the side of deletion and that child's BF: deleting from the right with the left child's BF 0, +1, −1 gives
          R0, R1 (single right rotations) and R−1 (double, LR); symmetrically L0, L−1 (single left) and L1 (double, RL). Unlike insertion, a deletion may need
          rotations at several ancestors.
        </p>
        <Code id="avl_delete" />
      </Sec>
      <AlgoViz
        title="AVL deletion"
        fields={[
          { name: 'k', label: 'build from', initial: '50, 30, 70, 20, 40, 60, 80, 10, 35, 45, 5', width: 300 },
          { name: 'd', label: 'delete', initial: '60, 80', width: 120 },
        ]}
        build={(v) => T.avlDeleteFrames(nums(v.k, { maxLen: 14, min: 0, max: 999 }), nums(v.d, { maxLen: 6, min: 0, max: 999 }))}
      />
    </>
  );
}

function L30Practice() {
  return <AlgoViz title="Name the rotation before it happens" fields={[{ name: 'k', label: 'insert keys', initial: '50, 40, 30, 60, 70, 55, 45, 42', width: 320, random: (r) => r.distinct(r.int(7, 9), 1, 99).join(', ') }]} build={(v) => T.avlInsertFrames(nums(v.k, { maxLen: 14, min: 0, max: 999 }), true)} code="avl_insert" predict />;
}

const avlShapeQ: QGen = (rng) => {
  const keys = rng.distinct(rng.int(6, 8), 1, 99);
  const r = keys.reduce<T.AVL | null>((x, k) => T.avlInsert(x, k), null);
  return seq(`Insert ${keys.join(', ')} (in order) into an empty AVL tree. Write the preorder traversal.`, T.avlPre(r), `Preorder: ${T.avlPre(r).join(' ')}.`);
};
const avlCaseQ: QGen = (rng) => {
  for (;;) {
    const keys = rng.distinct(rng.int(3, 6), 1, 99);
    let r: T.AVL | null = null;
    for (let i = 0; i < keys.length; i++) {
      const rots: T.Rot[] = [];
      r = T.avlInsert(r, keys[i], rots);
      if (rots.length) {
        const kind = rots[0].kind;
        return mcq(`Inserting ${keys.slice(0, i + 1).join(', ')} into an empty AVL tree: the insertion of ${keys[i]} triggers which rotation case?`, kind, ['LL', 'RR', 'LR', 'RL'].filter((x) => x !== kind), `Node ${rots[0].at} becomes unbalanced; ${kind} case.`);
      }
    }
  }
};
const minNodesQ: QGen = (rng) => {
  const h = rng.int(3, 9);
  const N = [0, 1, 2];
  for (let i = 3; i <= h; i++) N[i] = N[i - 1] + N[i - 2] + 1;
  return num(`Minimum number of nodes in an AVL tree of height ${h} (root at level 1, so a single node has height 1)?`, N[h], `N(h) = N(h−1) + N(h−2) + 1 with N(1) = 1, N(2) = 2: ${N.slice(1, h + 1).join(', ')}.`);
};
const L30_BANK = [
  mcq('Balance factor (H–S) of a node is…', 'height(left) − height(right)', ['height(right) − height(left)', 'number of children', 'size(left) − size(right)'], 'Allowed values −1, 0, +1.'),
  mcq('Inserting 30, 20, 10 into an empty AVL tree needs…', 'an LL (single right) rotation at 30', ['an RR rotation', 'an LR rotation', 'no rotation'], 'Left-left path from 30.'),
  mcq('Inserting 10, 30, 20 into an empty AVL tree needs…', 'an RL double rotation at 10', ['an RR rotation', 'an LR rotation', 'no rotation'], 'Right child then left grandchild.'),
  mcq('Worst-case height of an AVL tree with n nodes?', 'O(log n) (≈ 1.44 log₂ n)', ['O(n)', 'O(√n)', 'exactly log₂ n'], 'Fibonacci-like minimum sizes.'),
  mcq('How many rotations (single or double) can one insertion require?', 'At most one', ['One per ancestor', 'Two always', 'log n'], 'The rotated subtree regains its old height.'),
  mcq('An LR imbalance is fixed by…', 'left rotation at the left child, then right rotation at the node', ['a single right rotation', 'a single left rotation', 'right then left rotation at the node'], 'Double rotation.'),
  tf('A deletion from an AVL tree may require rotations at more than one ancestor.', true, 'Height can shrink and propagate imbalance upward.'),
];

const L30: Level = {
  id: 'L30',
  n: 30,
  world: 6,
  title: 'AVL Trees',
  blurb: 'Height-balanced BSTs: balance factors, the LL/RR/LR/RL rotations on insertion, R0/R1/R−1-style deletion, and the O(log n) height guarantee.',
  syllabus: ['DS U3 · AVL trees'],
  snippets: ['avl_rotations', 'avl_insert'],
  extraSnippets: ['avl_delete'],
  Lesson: L30Lesson,
  Practice: L30Practice,
  quiz: [avlShapeQ, avlShapeQ, avlShapeQ, avlCaseQ, avlCaseQ, minNodesQ, bank(L30_BANK), bank(L30_BANK)],
  cards: [
    { q: 'AVL rotation cases on insert?', a: 'LL → right rotation; RR → left; LR → left at child then right; RL → right at child then left.' },
    { q: 'rotateRight(y) body?', a: 'x = y->left; y->left = x->right; x->right = y; update(y); update(x); return x;' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — AVL trees (balance factor, LL/LR/RR/RL).', 'Weiss, Data Structures and Algorithm Analysis — §4.4 AVL trees.', 'Knuth, TAOCP Vol. 3 §6.2.3 Balanced trees.'],
};

/* =====================================================================
   Level 31 — B-trees
   ===================================================================== */

function L31Lesson() {
  return (
    <>
      <Sec title="Why multiway trees">
        <p>
          On disk, one node read costs a whole block access — thousands of times slower than a comparison. So make nodes <b>wide</b> (many keys per block) and the
          tree <b>shallow</b>. An <b>m-way search tree</b> node holds up to m − 1 sorted keys K₁ &lt; K₂ &lt; … and m child pointers; all keys in subtree Aᵢ lie
          between Kᵢ and Kᵢ₊₁.
        </p>
      </Sec>
      <Sec title="B-tree of order m (Knuth / Horowitz–Sahni)">
        <ul>
          <li>Every node has at most m children (m − 1 keys).</li>
          <li>Every node except the root has at least ⌈m/2⌉ children (⌈m/2⌉ − 1 keys).</li>
          <li>The root has at least 2 children unless it is a leaf.</li>
          <li>All leaves are on the same level — the tree grows and shrinks only at the root.</li>
        </ul>
        <Table
          head={['Order m', 'Max keys/node', 'Min keys (non-root)', 'Children']}
          rows={[
            ['3 (2-3 tree)', '2', '1', '2–3'],
            ['4 (2-3-4 tree)', '3', '1', '2–4'],
            ['5', '4', '2', '3–5'],
          ]}
        />
        <F>Height h (levels) with N keys: max keys mʰ − 1; min keys 2⌈m/2⌉ʰ⁻¹ − 1 ⇒ h = O(log_⌈m/2⌉ N)</F>
        <Callout kind="convention" title="Order m vs minimum degree t">
          <p>
            CLRS describes B-trees by <b>minimum degree t</b>: non-root nodes have t − 1 … 2t − 1 keys (so order 2t), and it splits full nodes on the way <i>down</i>.
            The game follows Knuth/H–S <b>order m</b> with bottom-up splitting. For even m the split median is a convention — the code takes index (m − 1)/2, the
            left median; quiz questions use odd orders, where the median is unambiguous.
          </p>
        </Callout>
      </Sec>
      <Sec title="Search and insertion">
        <Code id="btree_search" />
        <p>
          Insert into the correct leaf. If that leaf now holds m keys it <b>splits</b>: the median key moves up into the parent, the keys left of it stay, the keys
          right of it form a new sibling. The parent may overflow and split too; if the root splits, a new root is created and the height grows by one.
        </p>
        <Code id="btree_insert" />
      </Sec>
      <AlgoViz
        title="B-tree insertion"
        fields={[
          { name: 'm', label: 'order m (3–6)', initial: '5', width: 90 },
          { name: 'k', label: 'keys', initial: '10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130', width: 360, random: (r) => r.distinct(r.int(10, 16), 1, 99).join(', ') },
        ]}
        build={(v) => T.btInsertFrames(nums(v.k, { maxLen: 20, min: 0, max: 999 }), int(v.m, 'm', 3, 6))}
        code="btree_insert"
      />
      <Sec title="Deletion">
        <ol className="steps">
          <li>If the key is in an internal node, replace it by its inorder predecessor (largest key of the left subtree) and delete that from the leaf.</li>
          <li>Delete from the leaf. If the leaf still has ≥ ⌈m/2⌉ − 1 keys, done.</li>
          <li>Underflow: <b>borrow</b> — a sibling with spare keys gives one up to the parent and the parent's separator comes down.</li>
          <li>Otherwise <b>merge</b> with a sibling, pulling the separator down from the parent; the parent may underflow in turn. An empty root disappears and the height shrinks.</li>
        </ol>
        <Callout kind="convention">
          <p>Borrowing preference (left sibling first here) and predecessor vs successor vary by textbook; state yours in an exam.</p>
        </Callout>
      </Sec>
      <AlgoViz
        title="B-tree deletion"
        fields={[
          { name: 'm', label: 'order m', initial: '5', width: 80 },
          { name: 'k', label: 'build from', initial: '10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120', width: 300 },
          { name: 'd', label: 'delete', initial: '60, 20, 30', width: 140 },
        ]}
        build={(v) => T.btDeleteFrames(nums(v.k, { maxLen: 20, min: 0, max: 999 }), nums(v.d, { maxLen: 8, min: 0, max: 999 }), int(v.m, 'm', 3, 6))}
      />
    </>
  );
}

function L31Practice() {
  return <AlgoViz title="Predict how many splits each insertion causes" fields={[{ name: 'm', label: 'order m', initial: '3', width: 80 }, { name: 'k', label: 'keys', initial: '8, 5, 1, 7, 3, 12, 9, 6, 13, 4', width: 300, random: (r) => r.distinct(r.int(9, 12), 1, 99).join(', ') }]} build={(v) => T.btInsertFrames(nums(v.k, { maxLen: 16, min: 0, max: 999 }), int(v.m, 'm', 3, 6), true)} code="btree_insert" predict />;
}

const btQ: QGen = (rng) => {
  const m = rng.pick([3, 5]);
  const keys = rng.distinct(rng.int(8, 13), 1, 99);
  const r = T.btFrom(keys, m);
  const k = rng.int(0, 2);
  const depth = (x: T.BT): number => (x.kids.length ? 1 + depth(x.kids[0]) : 1);
  const count = (x: T.BT): number => 1 + x.kids.reduce((s, c) => s + count(c), 0);
  if (k === 0) return seq(`Insert ${keys.join(', ')} (in order) into an empty B-tree of order ${m} (split median moves up). Write the keys of the root.`, r.keys, `Final tree ${T.btDump(r)}; root [${r.keys.join(' ')}].`);
  if (k === 1) return num(`Insert ${keys.join(', ')} into an empty B-tree of order ${m}. How many levels does it have?`, depth(r), `Final tree ${T.btDump(r)}.`);
  return num(`Insert ${keys.join(', ')} into an empty B-tree of order ${m}. How many nodes does it have?`, count(r), `Final tree ${T.btDump(r)}.`);
};
const btFormulaQ: QGen = (rng) => {
  const m = rng.pick([3, 4, 5, 6, 7]);
  const h = rng.int(2, 4);
  const k = rng.int(0, 2);
  if (k === 0) return num(`Maximum number of keys in a B-tree of order ${m} with ${h} levels?`, m ** h - 1, `Every node full: (m − 1)(1 + m + … + m^(h−1)) = m^h − 1 = ${m ** h - 1}.`);
  if (k === 1) return num(`Minimum number of keys in a NON-root node of a B-tree of order ${m}?`, Math.ceil(m / 2) - 1, `⌈m/2⌉ − 1 = ${Math.ceil(m / 2) - 1}.`);
  const c = Math.ceil(m / 2);
  return num(`Minimum number of keys in a B-tree of order ${m} with ${h} levels?`, 2 * c ** (h - 1) - 1, `Root 1 key, then ≥ 2·${c}^(i−2) nodes on level i with ${c - 1} keys each: total 2·${c}^${h - 1} − 1 = ${2 * c ** (h - 1) - 1}.`);
};
const L31_BANK = [
  mcq('In a B-tree of order m, a non-root node has at least…', '⌈m/2⌉ children', ['2 children', 'm children', 'm − 1 children'], 'Hence ⌈m/2⌉ − 1 keys.'),
  mcq('All leaves of a B-tree are…', 'on the same level', ['at most one level apart', 'children of the root', 'empty'], 'The tree grows at the root.'),
  mcq('When a B-tree node overflows on insertion…', 'it splits and its median key moves up to the parent', ['the tree is rebuilt', 'a key is discarded', 'it rotates like an AVL tree'], 'The parent may split in turn.'),
  mcq('The height of a B-tree increases only when…', 'the root splits', ['a leaf splits', 'a key is deleted', 'never'], 'A new root is created above the old one.'),
  mcq('Why are B-trees used for databases and file indexes?', 'Wide nodes make the tree shallow, minimising disk block reads', ['They are always perfectly balanced binary trees', 'They need no comparisons', 'They store data only in the root'], 'Each node ≈ one disk block.'),
  mcq('A 2-3 tree is a B-tree of order…', '3', ['2', '4', '5'], 'Nodes have 2 or 3 children.'),
  mcq('On deletion, if a node underflows and its sibling has spare keys, we…', 'borrow through the parent (rotation)', ['merge always', 'delete the parent', 'split the sibling'], 'Merge only when no sibling can lend.'),
  tf('CLRS\'s minimum degree t corresponds to order 2t.', true, 'Max 2t children, min t (non-root).'),
];

const L31: Level = {
  id: 'L31',
  n: 31,
  world: 6,
  title: 'B-Trees',
  blurb: 'm-way search trees, B-trees of order m, search, insertion by splitting medians upward, deletion by borrowing and merging, and the order-m vs minimum-degree conventions.',
  syllabus: ['DS U3 · B-trees', 'DS U6 · Indexing (tree indexes)'],
  snippets: ['btree_search', 'btree_insert'],
  Lesson: L31Lesson,
  Practice: L31Practice,
  quiz: [btQ, btQ, btQ, btQ, btFormulaQ, btFormulaQ, bank(L31_BANK), bank(L31_BANK)],
  cards: [
    { q: 'B-tree of order m: key limits?', a: 'Max m − 1 keys; non-root min ⌈m/2⌉ − 1; root min 1.' },
    { q: 'Insertion overflow rule?', a: 'Node with m keys splits; median (index (m−1)/2) moves up; new root if the root splits.' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — B-trees (m-way search trees, insertion, deletion).', 'Cormen et al., Introduction to Algorithms 3e — Ch. 18 B-trees (minimum degree t).', 'Knuth, TAOCP Vol. 3 §6.2.4 Multiway trees.'],
};

export default [L28, L29, L30, L31];
