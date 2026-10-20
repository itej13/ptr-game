import type { Frame, Level, QGen, Scene, SNode, SEdge } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, nums } from '../core/vizkit';
import { mcq, num, seq, tf, bank } from '../core/qhelp';
import * as T from '../engines/trees';
import type { Rng } from '../core/rng';

/* ---------- helpers ---------- */
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
const parseTreeField = (s: string) => {
  const t = T.parseTree(s);
  if (T.countNodes(t) > 15) throw new Error('At most 15 nodes.');
  return t;
};

/* =====================================================================
   Level 23 — Terminology, properties, representation
   ===================================================================== */

function arrayRepFrames(t: T.TN | null): Frame[] {
  const idx = new Map<string, number>();
  const q: [T.TN, number][] = t ? [[t, 1]] : [];
  while (q.length) {
    const [x, i] = q.shift()!;
    idx.set(x.id, i);
    if (x.left) q.push([x.left, 2 * i]);
    if (x.right) q.push([x.right, 2 * i + 1]);
  }
  const maxI = Math.max(1, ...idx.values());
  const base = T.tnScene(t);
  const F: Frame[] = [];
  const order = [...idx.entries()].sort((a, b) => a[1] - b[1]);
  const sc = (k: number): Scene => {
    const shown = new Set(order.slice(0, k).map(([id]) => id));
    const ay = base.h + 30;
    const cells: SNode[] = [];
    for (let i = 1; i <= maxI; i++) {
      const hit = order.find(([, j]) => j === i);
      const filled = hit && shown.has(hit[0]);
      const tn = hit ? findNode(t, hit[0]) : null;
      cells.push({ id: `cell${i}`, x: 30 + (i - 1) * 40, y: ay, w: 36, h: 30, shape: 'rect', label: filled && tn ? tn.v : '', tone: filled ? (order[k - 1]?.[1] === i ? 'active' : 'base') : 'ghost', fontSize: 12 });
      cells.push({ id: `ci${i}`, x: 30 + (i - 1) * 40, y: ay + 26, shape: 'text', label: i, tone: 'muted', fontSize: 10 });
    }
    return { w: Math.max(base.w, 60 + maxI * 40), h: ay + 50, nodes: [...base.nodes.map((n) => ({ ...n, tone: shown.has(n.id) ? (order[k - 1]?.[0] === n.id ? ('active' as const) : ('done' as const)) : ('base' as const) })), ...cells], edges: base.edges };
  };
  F.push({ scene: sc(0), say: `Sequential (array) representation, 1-based as in Horowitz–Sahni: root at 1; children of i at 2i and 2i + 1. Array size needed: ${maxI}.` });
  order.forEach(([id, i], k) => {
    const x = findNode(t, id)!;
    F.push({ scene: sc(k + 1), say: i === 1 ? `Root ${x.v} → index 1.` : `${x.v} is the ${i % 2 === 0 ? 'left' : 'right'} child of index ${Math.floor(i / 2)} → index ${i}.`, sfx: 'tick' });
  });
  const wasted = maxI - idx.size;
  F.push({ scene: sc(order.length), say: `${idx.size} nodes use ${maxI} slots (${wasted} wasted). Complete trees waste nothing; skewed trees waste almost everything (depth k needs 2ᵏ − 1 slots).`, sfx: 'found' });
  return F;
}
function findNode(t: T.TN | null, id: string): T.TN | null {
  if (!t) return null;
  if (t.id === id) return t;
  return findNode(t.left, id) ?? findNode(t.right, id);
}

function L23Lesson() {
  return (
    <>
      <Sec title="Trees and their vocabulary">
        <p>
          Horowitz–Sahni: a <b>tree</b> is a finite set of one or more nodes such that there is a specially designated node called the <b>root</b>, and the
          remaining nodes are partitioned into n ≥ 0 disjoint sets T₁ … Tₙ, each of which is itself a tree (the <b>subtrees</b> of the root).
        </p>
        <Table
          head={['Term', 'Meaning']}
          rows={[
            ['Degree of a node', 'number of its subtrees (children)'],
            ['Leaf / terminal node', 'degree 0'],
            ['Internal / non-terminal node', 'degree > 0'],
            ['Parent, children, siblings', 'siblings share a parent'],
            ['Ancestors / descendants', 'all nodes on the path to the root / in the subtree'],
            ['Level', 'root is at level 1; children of a level-ℓ node are at ℓ + 1 (H–S)'],
            ['Height (depth) of a tree', 'maximum level of any node (H–S)'],
            ['Degree of a tree', 'maximum degree of its nodes'],
            ['Forest', 'a set of n ≥ 0 disjoint trees'],
          ]}
        />
        <Callout kind="convention" title="Levels and heights differ by book">
          <p>
            Horowitz–Sahni put the root at <b>level 1</b>, so a single node has height 1. CLRS and GeeksforGeeks measure <b>depth/height in edges</b>, so a
            single node has height 0. Formulas shift by one: max nodes at level i is 2^(i−1) (H–S) vs 2^d at depth d (edges). Always state your convention.
          </p>
        </Callout>
      </Sec>
      <Sec title="Binary trees">
        <p>
          A <b>binary tree</b> is a finite set of nodes that is either <b>empty</b> or consists of a root and two disjoint binary trees called the left and right
          subtrees. Unlike a general tree it may be empty, and left ≠ right matters: a root with only a left child differs from one with only a right child.
        </p>
        <Table
          head={['Property (H–S, root at level 1)', 'Value']}
          rows={[
            ['Max nodes on level i', '2^(i−1), i ≥ 1'],
            ['Max nodes in a binary tree of depth k', '2^k − 1, k ≥ 1'],
            ['Leaves vs degree-2 nodes', 'n₀ = n₂ + 1 for every non-empty binary tree'],
            ['Null links in a tree with n nodes', 'n + 1 (out of 2n)'],
            ['Min depth with n nodes', '⌈log₂(n + 1)⌉'],
          ]}
        />
        <p>
          Proof of n₀ = n₂ + 1: n = n₀ + n₁ + n₂ nodes; every node except the root has one incoming branch, so branches B = n − 1; branches also come out of nodes:
          B = n₁ + 2n₂. Equate: n₀ + n₁ + n₂ − 1 = n₁ + 2n₂ ⇒ n₀ = n₂ + 1.
        </p>
        <Callout kind="convention" title='"Full" and "complete"'>
          <p>
            H–S: a <b>full</b> binary tree of depth k has exactly 2ᵏ − 1 nodes (GeeksforGeeks calls this <b>perfect</b>). GeeksforGeeks' "full" means every node
            has 0 or 2 children (H–S/others: <b>strictly binary</b>). <b>Complete</b> (both): nodes fill every level left to right, only the last level may be
            partial — exactly the nodes numbered 1…n in a full tree.
          </p>
        </Callout>
      </Sec>
      <Sec title="Representations">
        <ul>
          <li>
            <b>Array (sequential)</b>, 1-based: node i has parent ⌊i/2⌋, left child 2i, right child 2i + 1 (if ≤ n). 0-based (as in the heap code): parent ⌊(i−1)/2⌋,
            children 2i + 1 and 2i + 2. Ideal for complete trees, wasteful for skewed ones.
          </li>
          <li>
            <b>Linked</b>: each node holds data and left/right pointers (optionally a parent pointer). Uses exactly n nodes; n + 1 links are null.
          </li>
        </ul>
        <Code id="tree_props" />
      </Sec>
      <AlgoViz
        title="Array representation of a binary tree"
        note="Tree as preorder with # for an empty subtree, e.g. 1 2 4 # # 5 # # 3 # 6 # #"
        fields={[{ name: 't', label: 'tree (preorder, # = empty)', initial: '1 2 4 # # 5 # # 3 # 6 # #', width: 360, random: (r) => T.serialise(distinctTree(r, r.int(4, 8))).trim() }]}
        build={(v) => arrayRepFrames(parseTreeField(v.t))}
      />
    </>
  );
}

const propsQ: QGen = (rng) => {
  const t = distinctTree(rng, rng.int(5, 10));
  const k = rng.int(0, 2);
  const scene = T.tnScene(t);
  if (k === 0) return num('Height of this binary tree (Horowitz–Sahni: root at level 1)?', T.height(t), `Longest root-to-leaf path has ${T.height(t)} nodes.`, { scene });
  if (k === 1) return num('How many leaves does this tree have?', T.countLeaves(t), `Leaves (degree 0): ${T.countLeaves(t)}.`, { scene });
  const [, , n2] = T.degrees(t);
  return num('How many nodes in this tree have degree 2?', n2, `n₂ = ${n2} (and n₀ = n₂ + 1 = ${n2 + 1}).`, { scene });
};
const formulaQ: QGen = (rng) => {
  const k = rng.int(0, 4);
  if (k === 0) {
    const n2 = rng.int(3, 40);
    return num(`A binary tree has ${n2} nodes of degree 2. How many leaves does it have?`, n2 + 1, 'n₀ = n₂ + 1.');
  }
  if (k === 1) {
    const i = rng.int(2, 9);
    return num(`Maximum number of nodes on level ${i} of a binary tree (root at level 1)?`, 2 ** (i - 1), `2^(i−1) = 2^${i - 1} = ${2 ** (i - 1)}.`);
  }
  if (k === 2) {
    const d = rng.int(2, 9);
    return num(`Maximum number of nodes in a binary tree of depth ${d} (root at level 1)?`, 2 ** d - 1, `2^k − 1 = ${2 ** d - 1}.`);
  }
  if (k === 3) {
    const n = rng.int(5, 60);
    return num(`A binary tree with ${n} nodes (linked representation) has how many NULL child pointers?`, n + 1, '2n pointers, n − 1 of them used by edges ⇒ n + 1 null.');
  }
  const i = rng.int(2, 40);
  const one = rng.chance(0.5);
  return one
    ? num(`Array representation, 1-based (root at 1). Index of the right child of node ${i}?`, 2 * i + 1, 'Right child of i is 2i + 1.')
    : num(`Array representation, 1-based. Index of the parent of node ${i}?`, Math.floor(i / 2), 'Parent of i is ⌊i/2⌋.');
};
const L23_BANK = [
  mcq('The degree of a tree is…', 'the maximum degree of any node', ['the number of nodes', 'the number of leaves', 'the height'], 'Node degree = number of children.'),
  mcq('Nodes with the same parent are called…', 'siblings', ['cousins', 'ancestors', 'descendants'], 'Standard terminology.'),
  mcq('How does a binary tree differ from a general tree (H–S)?', 'It may be empty, and left/right order matters', ['It cannot have leaves', 'It has exactly two children per node', 'It must be complete'], 'A tree has at least one node; a binary tree may be empty.'),
  mcq('In H–S terminology a "full binary tree of depth k" has…', '2^k − 1 nodes', ['2^k nodes', 'k nodes', 'every node with 0 or 2 children'], 'GeeksforGeeks calls this a perfect binary tree.'),
  mcq('Which representation wastes the most space for a right-skewed tree?', 'Array (sequential) representation', ['Linked representation', 'Both equally', 'Neither'], 'A skewed tree of depth k needs 2ᵏ − 1 array slots.'),
  mcq('0-based array: children of node i are at…', '2i + 1 and 2i + 2', ['2i and 2i + 1', 'i + 1 and i + 2', 'i/2 and i/2 + 1'], '1-based would be 2i and 2i + 1.'),
  tf('In every non-empty binary tree, the number of leaves is one more than the number of nodes of degree 2.', true, 'n₀ = n₂ + 1.'),
  tf('A single-node tree has height 1 under Horowitz–Sahni\'s convention.', true, 'Root at level 1 (CLRS would say 0).'),
];

const L23: Level = {
  id: 'L23',
  n: 23,
  world: 6,
  title: 'Tree Terminology & Representation',
  blurb: 'Trees, binary trees, the counting lemmas (2^(i−1), 2^k − 1, n₀ = n₂ + 1), naming conventions, and array vs linked representations.',
  syllabus: ['DS U3 · Basic terminology', 'DS U3 · Binary trees and their representation'],
  snippets: ['tree_props'],
  Lesson: L23Lesson,
  quiz: [propsQ, propsQ, propsQ, formulaQ, formulaQ, formulaQ, bank(L23_BANK), bank(L23_BANK)],
  cards: [
    { q: 'n₀ vs n₂ in a binary tree?', a: 'n₀ = n₂ + 1' },
    { q: 'Max nodes at level i / in depth k (H–S)?', a: '2^(i−1) / 2^k − 1' },
    { q: 'Array rep (1-based) parent/left/right of i?', a: '⌊i/2⌋, 2i, 2i + 1' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Introduction (terminology), Binary trees.', 'Cormen et al., Introduction to Algorithms 3e — Appendix B.5 Trees (edge-counting heights).'],
};

/* =====================================================================
   Level 24 — Traversals
   ===================================================================== */

function L24Lesson() {
  return (
    <>
      <Sec title="Depth-first traversals">
        <p>A traversal visits every node exactly once. With L = go left, V = visit, R = go right, and always left before right:</p>
        <Table
          head={['Traversal', 'Order', 'Typical use']}
          rows={[
            ['Inorder', 'L V R', 'BST keys in sorted order; infix expression'],
            ['Preorder', 'V L R', 'copying a tree; prefix expression'],
            ['Postorder', 'L R V', 'deleting/freeing a tree; postfix expression; computing sizes/heights'],
          ]}
        />
        <Code id="tree_traversals" />
        <p>Each runs in Θ(n) time and uses O(h) stack space for the recursion.</p>
      </Sec>
      <AlgoViz
        title="Traverse a binary tree"
        note="order: in, pre, post, iter (iterative inorder) or level. Tree as preorder with # for empty."
        fields={[
          { name: 'o', label: 'order', initial: 'in', width: 80 },
          { name: 't', label: 'tree', initial: '1 2 4 # # 5 # # 3 # 6 # #', width: 320, random: (r) => T.serialise(distinctTree(r, r.int(5, 8))).trim() },
        ]}
        build={(v) => {
          const t = parseTreeField(v.t);
          const o = v.o.trim().toLowerCase();
          if (o.startsWith('it')) return T.iterInorderFrames(t);
          if (o.startsWith('lev')) return T.levelOrderFrames(t);
          if (o === 'in' || o === 'pre' || o === 'post') return T.traversalFrames(t, o);
          throw new Error('order must be in, pre, post, iter or level');
        }}
        code="tree_traversals"
      />
      <Sec title="Without recursion: a stack, or a queue">
        <p>
          Horowitz–Sahni's iterative inorder pushes nodes while going left, pops and prints, then moves right — exactly what recursion does implicitly.{' '}
          <b>Level-order</b> (breadth-first) traversal visits level 1, then level 2, … using a <b>queue</b>.
        </p>
        <Code id="tree_iterative" />
      </Sec>
      <Sec title="Expression trees and rebuilding trees">
        <p>
          An expression tree has operands at the leaves and operators at internal nodes. Its inorder, preorder and postorder traversals give the infix (minus
          parentheses), prefix and postfix forms (Level 11).
        </p>
        <p>
          <b>Inorder + preorder</b> (or inorder + postorder) determine a binary tree uniquely when keys are distinct: the first preorder element (last postorder
          element) is the root; its position in the inorder splits the left and right subtrees; recurse. Preorder + postorder alone do <b>not</b> determine a
          tree in general (a single child could be left or right).
        </p>
      </Sec>
    </>
  );
}

function L24Practice() {
  return (
    <>
      <AlgoViz title="Predict the next printed node (inorder)" fields={[{ name: 't', label: 'tree', initial: '8 3 1 # # 6 4 # # 7 # # 10 # 14 13 # # #', width: 340, random: (r) => T.serialise(distinctTree(r, r.int(6, 9))).trim() }]} build={(v) => T.traversalFrames(parseTreeField(v.t), 'in', true)} code="tree_traversals" predict />
      <AlgoViz title="Predict the next printed node (postorder)" fields={[{ name: 't', label: 'tree', initial: '8 3 1 # # 6 4 # # 7 # # 10 # 14 13 # # #', width: 340, random: (r) => T.serialise(distinctTree(r, r.int(6, 9))).trim() }]} build={(v) => T.traversalFrames(parseTreeField(v.t), 'post', true)} code="tree_traversals" predict />
    </>
  );
}

const travQ: QGen = (rng) => {
  const t = distinctTree(rng, rng.int(6, 9));
  const o = rng.pick(['inorder', 'preorder', 'postorder', 'level-order'] as const);
  const ans = o === 'inorder' ? T.inorder(t) : o === 'preorder' ? T.preorder(t) : o === 'postorder' ? T.postorder(t) : T.levelOrder(t);
  return seq(`Write the ${o} traversal of this tree.`, ans, `${o}: ${ans.join(' ')}.`, { scene: T.tnScene(t) });
};
const rebuildQ: QGen = (rng) => {
  const t = distinctTree(rng, rng.int(5, 8));
  if (rng.chance(0.5)) return seq(`Inorder: ${T.inorder(t).join(' ')}. Preorder: ${T.preorder(t).join(' ')}. Write the postorder.`, T.postorder(t), `Root = first of preorder; split the inorder around it; recurse. Postorder: ${T.postorder(t).join(' ')}.`);
  return seq(`Inorder: ${T.inorder(t).join(' ')}. Postorder: ${T.postorder(t).join(' ')}. Write the preorder.`, T.preorder(t), `Root = last of postorder. Preorder: ${T.preorder(t).join(' ')}.`);
};
const L24_BANK = [
  mcq('Which traversal of a BST lists the keys in sorted order?', 'Inorder', ['Preorder', 'Postorder', 'Level order'], 'Left subtree < node < right subtree.'),
  mcq('Which traversal should be used to free (delete) every node of a tree?', 'Postorder', ['Preorder', 'Inorder', 'Level order'], 'Children must be freed before their parent.'),
  mcq('Level-order traversal uses a…', 'queue', ['stack', 'heap', 'hash table'], 'FIFO processes nodes level by level.'),
  mcq('Which pair of traversals does NOT always determine a unique binary tree?', 'Preorder and postorder', ['Inorder and preorder', 'Inorder and postorder', 'Inorder and level order'], 'A lone child could be left or right.'),
  mcq('The postorder traversal of an expression tree gives…', 'the postfix expression', ['the prefix expression', 'the infix expression with parentheses', 'the value'], 'Operands then operator.'),
  mcq('Extra space of recursive traversal on a tree of height h?', 'O(h)', ['O(1)', 'O(n²)', 'O(log n) always'], 'One stack frame per level of the current path.'),
  mcq('In preorder, the root is…', 'visited first', ['visited last', 'visited in the middle', 'not visited'], 'V L R.'),
  tf('Inorder traversal of any binary tree visits nodes in increasing key order.', false, 'Only for a binary SEARCH tree.'),
];

const L24: Level = {
  id: 'L24',
  n: 24,
  world: 6,
  title: 'Tree Traversals',
  blurb: 'Inorder, preorder, postorder (recursive and with an explicit stack), level order with a queue, expression trees, and rebuilding a tree from two traversals.',
  syllabus: ['DS U3 · Binary trees: traversals (operations on binary trees)'],
  snippets: ['tree_traversals', 'tree_iterative'],
  Lesson: L24Lesson,
  Practice: L24Practice,
  quiz: [travQ, travQ, travQ, travQ, rebuildQ, rebuildQ, bank(L24_BANK), bank(L24_BANK)],
  cards: [
    { q: 'In / pre / post order patterns?', a: 'L V R / V L R / L R V' },
    { q: 'Which two traversals determine a binary tree?', a: 'Inorder with preorder, or inorder with postorder (distinct keys).' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Binary tree traversals (iterInorder, level order).'],
};

/* =====================================================================
   Level 25 — BST search & insert
   ===================================================================== */

function L25Lesson() {
  return (
    <>
      <Sec title="Binary search trees">
        <p>A binary search tree is a binary tree in which, for every node, all keys in its left subtree are smaller and all keys in its right subtree are larger (keys are distinct, as in Horowitz–Sahni). Both subtrees are BSTs too.</p>
        <Code id="bst_search_insert" />
        <ul>
          <li>Search and insert follow one root-to-leaf path: O(h) where h is the height.</li>
          <li>h ranges from ⌈log₂(n+1)⌉ (balanced) to n (a chain — e.g. inserting keys in sorted order).</li>
          <li>Average over random insertion orders: h = O(log n).</li>
          <li>Inorder traversal of a BST outputs the keys in sorted order.</li>
        </ul>
      </Sec>
      <AlgoViz
        title="Build a BST by insertion"
        fields={[{ name: 'k', label: 'keys in insertion order', initial: '50, 30, 70, 20, 40, 60, 80, 35', width: 360, random: (r) => r.distinct(r.int(6, 10), 1, 99).join(', ') }]}
        build={(v) => T.bstInsertFrames(nums(v.k, { maxLen: 14, min: 0, max: 999 }))}
        code="bst_search_insert"
      />
      <AlgoViz
        title="Search a BST"
        fields={[
          { name: 'k', label: 'tree keys (insertion order)', initial: '50, 30, 70, 20, 40, 60, 80, 35', width: 300 },
          { name: 'x', label: 'search for', initial: '35', width: 90 },
        ]}
        build={(v) => T.bstSearchFrames(nums(v.k, { maxLen: 14, min: 0, max: 999 }), nums(v.x, { maxLen: 1 })[0])}
        code="bst_search_insert"
      />
      <Callout kind="pitfall">
        <p>The same set of keys gives different trees for different insertion orders. Sorted input degenerates into a linked list with O(n) search — the motivation for AVL trees (Level 30).</p>
      </Callout>
    </>
  );
}

function L25Practice() {
  return <AlgoViz title="Predict left/right at every comparison" fields={[{ name: 'k', label: 'keys', initial: '45, 15, 79, 90, 10, 55, 12, 20, 50', width: 360, random: (r) => r.distinct(r.int(7, 10), 1, 99).join(', ') }]} build={(v) => T.bstInsertFrames(nums(v.k, { maxLen: 14, min: 0, max: 999 }), true)} code="bst_search_insert" predict />;
}

const bstShapeQ: QGen = (rng) => {
  const keys = rng.distinct(rng.int(6, 9), 1, 99);
  const r = T.bstFrom(keys);
  const k = rng.int(0, 2);
  if (k === 0) return seq(`Insert ${keys.join(', ')} (in this order) into an empty BST. Write its preorder traversal.`, T.bstPre(r), `Preorder: ${T.bstPre(r).join(' ')}.`);
  if (k === 1) return num(`Insert ${keys.join(', ')} into an empty BST. What is its height (root at level 1)?`, T.bstHeight(r), `Height ${T.bstHeight(r)}.`);
  const x = rng.pick(keys);
  return num(`BST built by inserting ${keys.join(', ')}. How many key comparisons (nodes examined) does a successful search for ${x} make?`, T.bstPath(r, x).length, `Path: ${T.bstPath(r, x).join(' → ')}.`);
};
const L25_BANK = [
  mcq('Worst-case search time in a BST with n nodes?', 'O(n)', ['O(log n)', 'O(1)', 'O(n log n)'], 'A chain-shaped (skewed) tree.'),
  mcq('Inserting 10, 20, 30, 40, 50 into an empty BST gives…', 'a right-skewed chain', ['a balanced tree', 'a left-skewed chain', 'a complete tree'], 'Each key is larger than all previous ones.'),
  mcq('Where does a new key always end up in a BST?', 'As a new leaf', ['At the root', 'Anywhere in the middle', 'Replacing an existing node'], 'Insertion stops at the NULL where search failed.'),
  mcq('The smallest key in a BST is found by…', 'following left pointers from the root until NULL', ['following right pointers', 'checking every leaf', 'looking at the root'], 'Leftmost node.'),
  mcq('Expected height of a BST built from a random insertion order?', 'O(log n)', ['O(n)', 'O(√n)', 'O(1)'], 'Random BSTs are balanced on average.'),
  tf('Two different insertion orders of the same keys always produce the same BST.', false, 'Shape depends on order.'),
];

const L25: Level = {
  id: 'L25',
  n: 25,
  world: 6,
  title: 'BST: Search & Insert',
  blurb: 'The BST property, searching and inserting along one path, why height decides everything, and how insertion order shapes the tree.',
  syllabus: ['DS U3 · Binary search trees', 'DS U3 · Searching, insertion'],
  snippets: ['bst_search_insert'],
  Lesson: L25Lesson,
  Practice: L25Practice,
  quiz: [bstShapeQ, bstShapeQ, bstShapeQ, bstShapeQ, bank(L25_BANK), bank(L25_BANK), bank(L25_BANK)],
  cards: [{ q: 'BST search/insert cost?', a: 'O(h): ⌈log₂(n+1)⌉ ≤ h ≤ n.' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Binary search trees (search, insert).', 'Cormen et al., Introduction to Algorithms 3e — §12.1–12.3.'],
};

/* =====================================================================
   Level 26 — BST deletion & applications
   ===================================================================== */

function L26Lesson() {
  return (
    <>
      <Sec title="Deleting from a BST: three cases">
        <ol className="steps">
          <li>
            <b>Leaf</b>: remove it (its parent's pointer becomes NULL).
          </li>
          <li>
            <b>One child</b>: the parent adopts that child.
          </li>
          <li>
            <b>Two children</b>: replace the key with its <b>inorder successor</b> — the smallest key in the right subtree (go right once, then left as far as
            possible) — and delete that successor from the right subtree. The successor has no left child, so its deletion is case 1 or 2.
          </li>
        </ol>
        <Code id="bst_delete" />
        <Callout kind="convention">
          <p>
            Horowitz–Sahni allow either the <b>largest key in the left subtree</b> (inorder predecessor) or the <b>smallest in the right subtree</b> (successor).
            The game's code and questions use the successor; if your exam uses the predecessor, the resulting tree differs.
          </p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Delete from a BST"
        fields={[
          { name: 'k', label: 'tree keys (insertion order)', initial: '50, 30, 70, 20, 40, 60, 80, 65', width: 300, random: (r) => r.distinct(r.int(7, 10), 1, 99).join(', ') },
          { name: 'd', label: 'delete', initial: '20, 70, 50', width: 140 },
        ]}
        build={(v) => T.bstDeleteFrames(nums(v.k, { maxLen: 14, min: 0, max: 999 }), nums(v.d, { maxLen: 6, min: 0, max: 999 }))}
        code="bst_delete"
      />
      <Sec title="Applications of BSTs">
        <ul>
          <li>Dictionaries / symbol tables (compilers), sets and maps (C++ std::set/std::map use balanced BSTs — red-black trees).</li>
          <li>Sorting: insert everything, then inorder — "tree sort", O(n log n) on average.</li>
          <li>Range queries and ordered statistics (k-th smallest with subtree sizes), predecessor/successor queries.</li>
          <li>Database and file indexes use the multiway cousin, the B-tree (Level 31).</li>
        </ul>
      </Sec>
    </>
  );
}

function L26Practice() {
  return <AlgoViz title="Identify the deletion case" fields={[{ name: 'k', label: 'keys', initial: '60, 30, 90, 20, 45, 75, 100, 40, 80', width: 300 }, { name: 'd', label: 'delete', initial: '20, 30, 60, 90', width: 140 }]} build={(v) => T.bstDeleteFrames(nums(v.k, { maxLen: 14, min: 0, max: 999 }), nums(v.d, { maxLen: 6, min: 0, max: 999 }), true)} code="bst_delete" predict />;
}

const bstDelQ: QGen = (rng) => {
  const keys = rng.distinct(rng.int(7, 9), 1, 99);
  let r = T.bstFrom(keys);
  // prefer deleting a node with two children
  const two: number[] = [];
  const walk = (x: T.BST | null) => {
    if (!x) return;
    if (x.left && x.right) two.push(x.v);
    walk(x.left);
    walk(x.right);
  };
  walk(r);
  const d = two.length && rng.chance(0.7) ? rng.pick(two) : rng.pick(keys);
  const scene = T.bstStatic(T.bstClone(r));
  r = T.bstDelete(r, d);
  return seq(`Delete ${d} from this BST (two children → replace with the inorder successor). Write the resulting preorder.`, T.bstPre(r), `Preorder after deleting ${d}: ${T.bstPre(r).join(' ')}.`, { scene });
};
const succQ: QGen = (rng) => {
  const keys = rng.distinct(rng.int(7, 9), 1, 99);
  const r = T.bstFrom(keys);
  const ino = T.bstInorder(r);
  const i = rng.int(0, ino.length - 2);
  return num(`In the BST built from ${keys.join(', ')}, what is the inorder successor of ${ino[i]}?`, ino[i + 1], `Next key in sorted order: ${ino[i + 1]}.`);
};
const L26_BANK = [
  mcq('Deleting a node with two children (successor convention) replaces it with…', 'the smallest key in its right subtree', ['the largest key in its right subtree', 'its left child', 'the root'], 'Inorder successor.'),
  mcq('The inorder successor of a node with two children has…', 'no left child', ['no right child', 'two children', 'exactly one child always'], 'It is the leftmost node of the right subtree.'),
  mcq('Deleting a leaf from a BST requires…', 'setting the parent\'s pointer to NULL', ['rebalancing', 'finding the successor', 'rebuilding the tree'], 'Case 1.'),
  mcq('Time to delete a key from a BST of height h?', 'O(h)', ['O(1)', 'O(n log n)', 'O(n²)'], 'Find it, maybe find its successor — both along downward paths.'),
  mcq('Which library containers are balanced BSTs?', 'C++ std::set and std::map', ['std::vector', 'std::unordered_map', 'std::queue'], 'Typically red-black trees.'),
  tf('Tree sort (BST insert + inorder) is O(n log n) in the worst case.', false, 'Sorted input makes a chain: O(n²).'),
];

const L26: Level = {
  id: 'L26',
  n: 26,
  world: 6,
  title: 'BST: Deletion & Applications',
  blurb: 'The three deletion cases, inorder successor vs predecessor conventions, and where BSTs are used.',
  syllabus: ['DS U3 · BST deletion', 'DS U3 · Applications of binary search trees'],
  snippets: ['bst_delete'],
  Lesson: L26Lesson,
  Practice: L26Practice,
  quiz: [bstDelQ, bstDelQ, bstDelQ, succQ, bank(L26_BANK), bank(L26_BANK), bank(L26_BANK)],
  cards: [{ q: 'BST delete with two children?', a: 'Copy the inorder successor (leftmost of right subtree) into the node, then delete the successor from the right subtree.' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Deletion from a binary search tree.', 'Cormen et al., Introduction to Algorithms 3e — §12.3.'],
};

/* =====================================================================
   Level 27 — Complete, extended and general trees
   ===================================================================== */

interface GT {
  id: string;
  v: string;
  kids: GT[];
}
let gid = 0;
function parseGeneral(s: string): GT {
  let i = 0;
  const t = s.replace(/\s+/g, ' ').trim();
  const skip = () => {
    while (t[i] === ' ') i++;
  };
  const node = (): GT => {
    skip();
    const m = /^[A-Za-z0-9]+/.exec(t.slice(i));
    if (!m) throw new Error(`Expected a name at position ${i + 1}. Format: A(B(E F) C D(G))`);
    i += m[0].length;
    const n: GT = { id: `g${gid++}`, v: m[0], kids: [] };
    skip();
    if (t[i] === '(') {
      i++;
      skip();
      while (t[i] !== ')') {
        if (i >= t.length) throw new Error('Missing ")".');
        n.kids.push(node());
        skip();
      }
      i++;
    }
    return n;
  };
  const r = node();
  skip();
  if (i < t.length) throw new Error('Extra characters after the tree.');
  return r;
}
function lcrsFrames(g: GT): Frame[] {
  const all: GT[] = [];
  const walk = (x: GT) => {
    all.push(x);
    x.kids.forEach(walk);
  };
  walk(g);
  if (all.length > 14) throw new Error('At most 14 nodes.');
  // general tree layout
  const nodes: SNode[] = [];
  const edgesG: SEdge[] = [];
  let leafX = 0;
  const place = (x: GT, d: number): number => {
    let cx: number;
    if (!x.kids.length) cx = 40 + leafX++ * 52;
    else {
      const xs = x.kids.map((c) => place(c, d + 1));
      cx = (xs[0] + xs[xs.length - 1]) / 2;
      x.kids.forEach((c) => edgesG.push({ from: x.id, to: c.id }));
    }
    nodes.push({ id: x.id, x: cx, y: 40 + d * 62, w: 38, label: x.v });
    return cx;
  };
  place(g, 0);
  const wG = 60 + leafX * 52;
  // LCRS binary tree layout (inorder-x)
  const bin: Record<string, { l?: string; r?: string }> = {};
  for (const x of all) {
    bin[x.id] = {};
    if (x.kids.length) bin[x.id].l = x.kids[0].id;
  }
  for (const x of all) x.kids.forEach((c, i) => i + 1 < x.kids.length && (bin[c.id].r = x.kids[i + 1].id));
  const pos: Record<string, [number, number]> = {};
  let k = 0;
  const lay = (id: string | undefined, d: number) => {
    if (!id) return;
    lay(bin[id].l, d + 1);
    pos[id] = [wG + 40 + k++ * 46, 40 + d * 56];
    lay(bin[id].r, d + 1);
  };
  lay(g.id, 0);
  const byId = new Map(all.map((x) => [x.id, x]));
  const binNodes = (hi?: string): SNode[] => all.map((x) => ({ id: `B${x.id}`, x: pos[x.id][0], y: pos[x.id][1], w: 34, label: x.v, tone: x.id === hi ? 'active' : 'base' }));
  const F: Frame[] = [];
  const binEdges: SEdge[] = [];
  const sc = (hi?: string): Scene => ({ w: Math.max(...Object.values(pos).map((p) => p[0])) + 60, h: Math.max(...Object.values(pos).map((p) => p[1]), ...nodes.map((n) => n.y)) + 50, nodes: [...nodes.map((n) => ({ ...n, tone: n.id === hi ? ('active' as const) : ('base' as const) })), ...binNodes(hi)], edges: [...edgesG, ...binEdges] });
  F.push({ scene: sc(), say: 'Left: the general tree. Right: its binary-tree representation (left-child, right-sibling). Each node keeps its FIRST child as left link and its NEXT SIBLING as right link.' });
  for (const x of all) {
    const b = bin[x.id];
    if (b.l) binEdges.push({ from: `B${x.id}`, to: `B${b.l}`, tone: 'accent' });
    if (b.r) binEdges.push({ from: `B${x.id}`, to: `B${b.r}`, tone: 'path' });
    if (b.l || b.r) F.push({ scene: sc(x.id), say: `${x.v}: left = ${b.l ? `first child ${byId.get(b.l)!.v}` : 'NULL'}, right = ${b.r ? `next sibling ${byId.get(b.r)!.v}` : 'NULL'}.`, sfx: 'tick' });
  }
  F.push({ scene: sc(), say: 'Done: the root never has a right link (it has no siblings). Preorder of the general tree = preorder of the binary tree; postorder of the general tree = inorder of the binary tree.', sfx: 'found' });
  return F;
}

function L27Lesson() {
  return (
    <>
      <Sec title="Complete binary trees">
        <p>
          A binary tree with n nodes and depth k is <b>complete</b> iff its nodes correspond to the nodes numbered 1 to n in the full binary tree of depth k
          (Horowitz–Sahni): every level is full except possibly the last, which is filled from the left. Consequences:
        </p>
        <ul>
          <li>Height (levels) of a complete binary tree with n nodes = ⌈log₂(n + 1)⌉ (= ⌊log₂ n⌋ + 1).</li>
          <li>It has ⌈n/2⌉ leaves; nodes ⌊n/2⌋ + 1 … n (1-based) are the leaves.</li>
          <li>The array representation wastes no slots — which is why heaps (Level 29) are complete trees.</li>
        </ul>
        <Callout kind="errata" title="Your heap deck says 'height of complete binary tree is always log n'">
          <p>Only up to rounding and convention: with root at level 1 it is ⌊log₂ n⌋ + 1 levels, i.e. ⌊log₂ n⌋ edges. "Θ(log n)" is the safe statement.</p>
        </Callout>
      </Sec>
      <Sec title="Extended binary trees (2-trees)">
        <p>
          Replace every empty subtree by a special <b>external node</b> (drawn as a square). The original nodes become <b>internal</b>. A tree with n internal
          nodes always has <b>n + 1</b> external nodes, and every internal node now has exactly two children.
        </p>
        <F>E = I + 2n</F>
        <p>
          I = internal path length (sum of the depths of the internal nodes, root depth 0); E = external path length (sum of the depths of the external nodes).
          In a BST, internal nodes are successful-search endpoints and external nodes are unsuccessful ones, so E and I measure average search cost. Weighted
          external path length is exactly what Huffman coding minimises (Level 49).
        </p>
      </Sec>
      <Sec title="General trees as binary trees">
        <p>
          Any ordered tree can be stored as a binary tree with the <b>left-child, right-sibling</b> representation: the left pointer goes to the first child and
          the right pointer to the next sibling. A forest becomes one binary tree by linking the roots as siblings.
        </p>
      </Sec>
      <AlgoViz
        title="General tree → binary tree"
        note="Format: A(B(E F) C D(G H I)) — names are letters or digits; children in parentheses."
        fields={[{ name: 'g', label: 'general tree', initial: 'A(B(E F) C D(G H I))', width: 320 }]}
        build={(v) => lcrsFrames(parseGeneral(v.g))}
      />
    </>
  );
}

const extQ: QGen = (rng) => {
  const t = distinctTree(rng, rng.int(4, 8));
  const { I, E, n } = T.pathLengths(t);
  const k = rng.int(0, 2);
  const scene = T.tnScene(t);
  if (k === 0) return num('For this tree, compute the internal path length I (root at depth 0).', I, `Sum of node depths = ${I}.`, { scene });
  if (k === 1) return num(`This tree has internal path length I = ${I}. Using E = I + 2n, what is the external path length E?`, E, `E = ${I} + 2·${n} = ${E}.`, { scene });
  return num('How many external nodes does the extended version of this tree have?', n + 1, `n + 1 = ${n + 1}.`, { scene });
};
const completeQ: QGen = (rng) => {
  const n = rng.int(5, 200);
  return rng.chance(0.5)
    ? num(`A complete binary tree has ${n} nodes. How many levels does it have (root at level 1)?`, Math.floor(Math.log2(n)) + 1, `⌈log₂(n+1)⌉ = ${Math.floor(Math.log2(n)) + 1}.`)
    : num(`How many leaves does a complete binary tree with ${n} nodes have?`, Math.ceil(n / 2), `Nodes ⌊n/2⌋ + 1 … n are leaves: ${Math.ceil(n / 2)}.`);
};
const lcrsQ: QGen = (rng) => {
  // random general tree with letters
  const letters = 'ABCDEFGHIJKL'.split('');
  let li = 0;
  const mk = (d: number): GT => {
    const n: GT = { id: `q${li}`, v: letters[li++], kids: [] };
    if (d < 2) for (let c = rng.int(d === 0 ? 2 : 0, 3); c > 0 && li < letters.length; c--) n.kids.push(mk(d + 1));
    return n;
  };
  const g = mk(0);
  const all: GT[] = [];
  const parent = new Map<string, GT>();
  const walk = (x: GT) => {
    all.push(x);
    x.kids.forEach((c) => {
      parent.set(c.id, x);
      walk(c);
    });
  };
  walk(g);
  const x = rng.pick(all.slice(1));
  const sib = parent.get(x.id)!.kids;
  const next = sib[sib.indexOf(x) + 1];
  const askRight = rng.chance(0.5);
  const ans = askRight ? next?.v ?? 'NULL' : x.kids[0]?.v ?? 'NULL';
  const str = (n: GT): string => n.v + (n.kids.length ? `(${n.kids.map(str).join(' ')})` : '');
  const opts = [...new Set([ans, 'NULL', ...all.map((a) => a.v)])].filter((o) => o !== x.v);
  return mcq(`General tree ${str(g)}. In its left-child right-sibling binary representation, what is the ${askRight ? 'RIGHT' : 'LEFT'} child of ${x.v}?`, ans, rng.shuffle(opts.filter((o) => o !== ans)).slice(0, 3), askRight ? 'Right link = next sibling.' : 'Left link = first child.');
};
const L27_BANK = [
  mcq('In an extended binary tree with n internal nodes, the number of external nodes is…', 'n + 1', ['n', '2n', 'n − 1'], 'One per null link.'),
  mcq('E = I + 2n relates…', 'external and internal path lengths', ['edges and nodes', 'height and size', 'leaves and degree-2 nodes'], 'Holds for every binary tree.'),
  mcq('In the left-child right-sibling representation, the right pointer of a node points to…', 'its next sibling', ['its last child', 'its parent', 'its first child'], 'Left = first child.'),
  mcq('Postorder of a general tree corresponds to which traversal of its binary representation?', 'Inorder', ['Preorder', 'Postorder', 'Level order'], 'Preorder ↔ preorder, postorder ↔ inorder.'),
  mcq('Why are heaps stored as complete binary trees?', 'The array representation then wastes no space and gives O(1) parent/child indexing', ['Complete trees are always sorted', 'They have no leaves', 'They are binary search trees'], 'Nodes occupy indices 1…n exactly.'),
  tf('Every full binary tree (H–S sense) is complete.', true, 'All levels are full.'),
  tf('Every complete binary tree is full (H–S sense).', false, 'The last level may be partially filled.'),
];

const L27: Level = {
  id: 'L27',
  n: 27,
  world: 6,
  title: 'Complete, Extended & General Trees',
  blurb: 'Complete binary trees and their height, extended binary trees with E = I + 2n, and storing any general tree or forest as a binary tree.',
  syllabus: ['DS U3 · Complete binary trees, extended binary trees', 'DS U3 · General trees'],
  snippets: [],
  Lesson: L27Lesson,
  quiz: [extQ, extQ, extQ, completeQ, completeQ, lcrsQ, lcrsQ, bank(L27_BANK), bank(L27_BANK)],
  cards: [
    { q: 'Extended binary tree facts?', a: 'n internal ⇒ n + 1 external; E = I + 2n.' },
    { q: 'Left-child right-sibling?', a: 'left = first child, right = next sibling; general postorder = binary inorder.' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — (complete trees), Representation of trees (left child-right sibling), Forests.', 'Knuth, TAOCP Vol. 1 §2.3.4.5 Path length (E = I + 2n).'],
};

export default [L23, L24, L25, L26, L27];
