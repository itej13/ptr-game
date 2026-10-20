import type { Level, QGen } from '../core/types';
import { Sec, Callout, Table, Code } from '../core/lesson';
import { AlgoViz, nums } from '../core/vizkit';
import { mcq, num, seq, tf, bank } from '../core/qhelp';
import * as Li from '../engines/lists';
import type { Rng } from '../core/rng';

/* ---------- op-script parsing ---------- */
function parseSll(s: string): Li.SllOp[] {
  return script(s).map(([name, a, b]) => {
    if (name === 'insertbegin' || name === 'begin') return { k: 'b', x: need(a, name) };
    if (name === 'insertend' || name === 'end') return { k: 'e', x: need(a, name) };
    if (name === 'insertat' || name === 'at') return { k: 'a', pos: need(a, name), x: need(b, name) };
    if (name === 'delete' || name === 'deletevalue') return { k: 'd', x: need(a, name) };
    if (name === 'search') return { k: 's', x: need(a, name) };
    throw new Error(`Unknown operation "${name}". Use insertBegin x, insertEnd x, insertAt pos x, delete x, search x.`);
  });
}
function parseCll(s: string): Li.CllOp[] {
  return script(s).map(([name, a]) => {
    if (name === 'insertfront' || name === 'front') return { k: 'f', x: need(a, name) };
    if (name === 'insertend' || name === 'end') return { k: 'e', x: need(a, name) };
    if (name === 'deletefront' || name === 'delete') return { k: 'd' };
    throw new Error(`Unknown operation "${name}". Use insertFront x, insertEnd x, deleteFront.`);
  });
}
function parseDll(s: string): Li.DllOp[] {
  return script(s).map(([name, a, b]) => {
    if (name === 'insertbegin' || name === 'begin') return { k: 'b', x: need(a, name) };
    if (name === 'insertend' || name === 'end') return { k: 'e', x: need(a, name) };
    if (name === 'insertafter' || name === 'after') return { k: 'a', pos: need(a, name), x: need(b, name) };
    if (name === 'delete' || name === 'deleteat') return { k: 'd', pos: need(a, name) };
    throw new Error(`Unknown operation "${name}". Use insertBegin x, insertEnd x, insertAfter pos x, delete pos.`);
  });
}
function script(s: string): [string, string | undefined, string | undefined][] {
  const parts = s.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) throw new Error('Enter some operations.');
  if (parts.length > 8) throw new Error('At most 8 operations per run.');
  return parts.map((p) => {
    const [name, a, b] = p.split(/[\s()]+/).filter(Boolean);
    return [name.toLowerCase(), a, b];
  });
}
function need(v: string | undefined, name: string): number {
  const x = Number(v);
  if (v === undefined || !Number.isInteger(x) || Math.abs(x) > 99) throw new Error(`"${name}" needs a whole number (|x| ≤ 99).`);
  return x;
}

const sllText = (o: Li.SllOp) => (o.k === 'b' ? `insertBegin(${o.x})` : o.k === 'e' ? `insertEnd(${o.x})` : o.k === 'a' ? `insertAt(${o.pos}, ${o.x})` : o.k === 'd' ? `deleteValue(${o.x})` : `search(${o.x})`);

/* =====================================================================
   Level 14 — Singly linked list
   ===================================================================== */

function L14Lesson() {
  return (
    <>
      <Sec title="Why linked lists?">
        <p>
          Arrays give O(1) access but cost O(n) to insert or delete in the middle, and their size is fixed. A <b>linked list</b> stores each element in a
          separately allocated <b>node</b> that also holds a pointer to the next node. Nodes can be anywhere in memory; the pointers impose the order.
        </p>
        <Table
          head={['', 'Array', 'Singly linked list']}
          rows={[
            ['Access k-th element', 'O(1)', 'O(k) — follow k links'],
            ['Insert/delete at front', 'O(n) (shift)', 'O(1)'],
            ['Insert/delete after a known node', 'O(n)', 'O(1)'],
            ['Insert at end', 'O(1) if space', 'O(n), or O(1) with a tail pointer'],
            ['Size', 'fixed capacity', 'grows and shrinks at run time'],
            ['Extra memory', 'none', 'one pointer per node'],
            ['Binary search', 'yes', 'no (no random access)'],
          ]}
        />
      </Sec>
      <Sec title="Representation and insertion">
        <p>
          A node is a <code>struct</code> holding <code>data</code> and <code>next</code>. <code>head</code> points to the first node; the last node's{' '}
          <code>next</code> is <code>nullptr</code> (NULL). An empty list is <code>head == nullptr</code>.
        </p>
        <Code id="sll_insert" />
        <Callout kind="pitfall">
          <p>
            When inserting after p, set the new node's next <b>before</b> changing <code>p-&gt;next</code> (<code>new Node{'{'}x, p-&gt;next{'}'}</code> does exactly that). Doing{' '}
            <code>p-&gt;next = t</code> first loses the only pointer to the rest of the list.
          </p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Singly linked list operations"
        note="Starting list, then up to 8 operations: insertBegin x, insertEnd x, insertAt pos x, delete x, search x."
        fields={[
          { name: 'init', label: 'starting list', initial: '10, 20, 30', width: 160, random: (r) => r.ints(r.int(2, 4), 1, 60).join(', ') },
          { name: 'ops', label: 'operations', initial: 'insertBegin 5, insertEnd 40, insertAt 2 15, delete 20, search 30', width: 420 },
        ]}
        build={(v) => Li.sllFrames(v.init.trim() ? nums(v.init, { minLen: 0, maxLen: 5, min: -99, max: 99 }) : [], parseSll(v.ops))}
        code="sll_insert"
      />
      <Sec title="Deletion, search and traversal">
        <Code id="sll_delete_search" />
        <p>
          Deletion needs the node <b>before</b> the one being removed, so we walk with two pointers (prev, cur). Deleting the first node is a special case
          because it changes head. Always <code>delete</code> the unlinked node — otherwise its memory leaks.
        </p>
      </Sec>
      <AlgoViz
        title="Delete and search (watch prev and cur)"
        fields={[
          { name: 'init', label: 'starting list', initial: '7, 3, 9, 4, 8', width: 160, random: (r) => r.ints(r.int(3, 5), 1, 9).join(', ') },
          { name: 'ops', label: 'operations', initial: 'delete 9, delete 7, search 8, delete 6', width: 360 },
        ]}
        build={(v) => Li.sllFrames(v.init.trim() ? nums(v.init, { minLen: 0, maxLen: 6, min: -99, max: 99 }) : [], parseSll(v.ops))}
        code="sll_delete_search"
      />
      <Callout kind="tip">
        <p>
          Many textbooks use a <b>header (dummy) node</b> before the first real node so insert/delete at the front need no special case. You'll see the same
          trick in polynomial addition (Level 17).
        </p>
      </Callout>
    </>
  );
}

function randSllOps(rng: Rng, n: number, startLen: number): Li.SllOp[] {
  let len = startLen;
  return Array.from({ length: n }, () => {
    const r = rng.int(0, 3);
    const x = rng.int(1, 9);
    if (r === 0) {
      len++;
      return { k: 'b', x };
    }
    if (r === 1) {
      len++;
      return { k: 'e', x };
    }
    if (r === 2) {
      const pos = rng.int(0, len);
      len++;
      return { k: 'a', pos, x };
    }
    return { k: 'd', x };
  });
}
const sllQ: QGen = (rng) => {
  const init = rng.ints(rng.int(2, 4), 1, 9);
  const ops = randSllOps(rng, rng.int(3, 5), init.length);
  const r = Li.runSLL([...init.map((x) => ({ k: 'e', x }) as Li.SllOp), ...ops]);
  return seq(`List: ${init.join(' → ')} → NULL. Apply ${ops.map(sllText).join(', ')}. Write the final list from head.`, r.list.length ? r.list : ['empty'], `Result: ${r.list.join(' → ') || 'empty'} (insertAt is 0-based; deleteValue removes the first match).`);
};
const searchQ: QGen = (rng) => {
  const L = rng.ints(rng.int(5, 8), 1, 9);
  const x = rng.chance(0.7) ? rng.pick(L) : 0;
  const i = L.indexOf(x);
  return num(`search(${x}) on ${L.join(' → ')} → NULL returns? (0-based position, −1 if absent)`, i, i >= 0 ? `First ${x} is at position ${i}.` : 'Not present: −1.');
};
const L14_BANK = [
  mcq('To insert node t after node p, the correct order is…', 't->next = p->next; then p->next = t;', ['p->next = t; then t->next = p->next;', 't->next = p; then p->next = t;', 'p = t; then t->next = p;'], 'Reversing the order makes t point to itself and loses the rest of the list.'),
  mcq('Time to access the k-th element of a singly linked list?', 'O(k)', ['O(1)', 'O(log k)', 'O(n²)'], 'Follow k next pointers from head.'),
  mcq('Inserting at the end of a singly linked list with only a head pointer costs…', 'O(n)', ['O(1)', 'O(log n)', 'O(n²)'], 'Walk to the last node first; a tail pointer makes it O(1).'),
  mcq('Why does deletion keep a prev pointer?', 'To relink the node before the deleted one (prev->next = cur->next)', ['To free memory faster', 'To keep the list sorted', 'Because head must move every time'], 'A singly linked node cannot reach its predecessor.'),
  mcq('Forgetting `delete cur` after unlinking a node causes…', 'a memory leak', ['a dangling head', 'an infinite loop', 'a compile error'], 'The node is unreachable but still allocated.'),
  mcq('An empty singly linked list is represented by…', 'head == nullptr', ['head->next == nullptr', 'head->data == 0', 'a node with next = head'], 'No nodes at all.'),
  mcq('Which search can be used on a linked list?', 'Linear search only', ['Binary search', 'Interpolation search', 'Both binary and linear'], 'No O(1) access to the middle.'),
  tf('A linked list can grow while the program runs without copying existing elements.', true, 'New nodes are allocated individually.'),
  tf('Linked lists use less memory than arrays for the same number of ints.', false, 'Each node also stores a pointer.'),
];

const L14: Level = {
  id: 'L14',
  n: 14,
  world: 4,
  title: 'Singly Linked Lists',
  blurb: 'Nodes and pointers, inserting at the front/end/position, deleting with prev & cur, searching, and how linked lists trade access for flexibility.',
  syllabus: ['DS U2 · Singly linked lists, representation', 'DS U2 · Traversing, insertion, deletion, searching'],
  snippets: ['sll_insert', 'sll_delete_search'],
  Lesson: L14Lesson,
  quiz: [sllQ, sllQ, sllQ, searchQ, bank(L14_BANK), bank(L14_BANK), bank(L14_BANK), bank(L14_BANK)],
  cards: [
    { q: 'insertBegin in two lines?', a: 'Node* t = new Node{x, head}; head = t;' },
    { q: 'deleteValue relink step?', a: 'if (prev == nullptr) head = cur->next; else prev->next = cur->next; delete cur;' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Lists: singly linked lists, representing chains in C.', 'Tanenbaum, Langsam & Augenstein, Data Structures Using C — Linked lists.'],
};

/* =====================================================================
   Level 15 — Circular linked list
   ===================================================================== */

function L15Lesson() {
  return (
    <>
      <Sec title="Close the loop">
        <p>
          In a <b>circular</b> linked list the last node points back to the first instead of NULL. There is no natural end, so traversals stop when they come
          back to where they started — use a <code>do … while</code> so the first node is visited.
        </p>
        <p>
          Keep a pointer to the <b>last</b> node rather than the first: then the first node is <code>last-&gt;next</code>, so you can insert at the front{' '}
          <i>and</i> at the end in O(1) — insertEnd is just insertFront followed by advancing last.
        </p>
        <Code id="circular_list" />
      </Sec>
      <AlgoViz
        title="Circular list with a last pointer"
        note="Operations: insertFront x, insertEnd x, deleteFront."
        fields={[
          { name: 'init', label: 'starting list', initial: '1, 2, 3', width: 160, random: (r) => r.ints(r.int(2, 4), 1, 60).join(', ') },
          { name: 'ops', label: 'operations', initial: 'insertFront 0, insertEnd 4, deleteFront, deleteFront', width: 400 },
        ]}
        build={(v) => Li.cllFrames(v.init.trim() ? nums(v.init, { minLen: 0, maxLen: 5, min: -99, max: 99 }) : [], parseCll(v.ops))}
        code="circular_list"
      />
      <Sec title="Concepts and applications">
        <ul>
          <li>Any node can be the starting point; every node is reachable from every other.</li>
          <li>
            Round-robin CPU scheduling: the scheduler walks the circle of ready processes forever; multiplayer turn order works the same way.
          </li>
          <li>Circular buffers and repeating playlists.</li>
          <li>
            The <b>Josephus problem</b>: n people in a circle, every k-th is eliminated — simulate by deleting every k-th node of a circular list.
          </li>
          <li>Doubly linked circular lists (with a header node) are used in Horowitz–Sahni for general lists and memory management.</li>
        </ul>
        <Callout kind="pitfall">
          <p>
            A traversal written as <code>while (p != nullptr)</code> never ends on a circular list. Also handle the one-node case in deletion: if first == last
            the list becomes empty.
          </p>
        </Callout>
      </Sec>
    </>
  );
}

function josephus(n: number, k: number): number {
  const people = Array.from({ length: n }, (_, i) => i + 1);
  let i = 0;
  while (people.length > 1) {
    i = (i + k - 1) % people.length;
    people.splice(i, 1);
  }
  return people[0];
}
const cllQ: QGen = (rng) => {
  const init = rng.ints(rng.int(2, 4), 1, 9);
  const ops: Li.CllOp[] = Array.from({ length: rng.int(3, 5) }, () => (rng.chance(0.3) ? { k: 'd' } : { k: rng.pick(['f', 'e'] as const), x: rng.int(10, 30) }));
  const r = Li.runCLL([...init.map((x) => ({ k: 'e', x }) as Li.CllOp), ...ops]);
  const txt = ops.map((o) => (o.k === 'd' ? 'deleteFront()' : `${o.k === 'f' ? 'insertFront' : 'insertEnd'}(${o.x})`)).join(', ');
  return rng.chance(0.5)
    ? seq(`Circular list (starting at last->next): ${init.join(' → ')} ↺. Apply ${txt}. List the nodes starting from last->next.`, r.list.length ? r.list : ['empty'], `Result: ${r.list.join(' → ') || 'empty'}.`)
    : num(`Circular list ${init.join(' → ')} ↺, then ${txt}. Which value does last point to? (−1 if empty)`, r.last ?? -1, `last → ${r.last ?? 'NULL'}.`);
};
const josQ: QGen = (rng) => {
  const n = rng.int(5, 10);
  const k = rng.int(2, 3);
  const s = josephus(n, k);
  return num(`Josephus: people 1…${n} stand in a circle; counting starts at person 1 and every ${k === 2 ? '2nd' : '3rd'} person is removed. Who survives?`, s, `Simulating deletions on a circular list leaves person ${s}.`);
};
const L15_BANK = [
  mcq('Why keep a pointer to the LAST node of a circular list?', 'last->next gives the first node, so both front and end insertion are O(1)', ['It saves memory', 'It makes search O(log n)', 'Because the first node has no address'], 'From last you reach both ends.'),
  mcq('Correct loop to print a non-empty circular list starting at first?', 'do { print p; p = p->next; } while (p != first);', ['while (p != nullptr) { … }', 'while (p->next != nullptr) { … }', 'for (; p; p = p->next)'], 'There is no NULL to stop at.'),
  mcq('In a one-node circular list, the node\'s next points to…', 'itself', ['NULL', 'head', 'the previous node'], 'last->next == last.'),
  mcq('Which application is a natural fit for a circular list?', 'Round-robin scheduling', ['Binary search', 'Expression evaluation', 'Sorting'], 'Processes take turns forever.'),
  mcq('insertEnd on a last-pointer circular list can be done by…', 'insertFront(x) then last = last->next', ['walking from head to the end', 'insertFront(x) then last = nullptr', 'swapping first and last'], 'The new first node becomes the last.'),
  tf('A circular list has no NULL pointer when non-empty.', true, 'The last node points back to the first.'),
];

const L15: Level = {
  id: 'L15',
  n: 15,
  world: 4,
  title: 'Circular Linked Lists',
  blurb: 'Close the loop: why a last pointer makes both ends O(1), stopping traversals, one-node edge cases, round robin and Josephus.',
  syllabus: ['DS U2 · Concepts of circular linked list'],
  snippets: ['circular_list'],
  Lesson: L15Lesson,
  quiz: [cllQ, cllQ, cllQ, josQ, bank(L15_BANK), bank(L15_BANK), bank(L15_BANK)],
  cards: [{ q: 'Circular list: how is the first node reached from last, and how does insertEnd work?', a: 'first = last->next. insertEnd = insertFront(x); last = last->next;' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Circular lists (pointer to the last node).', 'Tanenbaum, Langsam & Augenstein, Data Structures Using C — Circular lists, Josephus problem.'],
};

/* =====================================================================
   Level 16 — Doubly linked list
   ===================================================================== */

function L16Lesson() {
  return (
    <>
      <Sec title="Two links per node">
        <p>
          Each node of a <b>doubly linked list</b> has <code>prev</code> and <code>next</code>. You can walk both ways, and — the real win — insert or delete
          next to a node you already hold in O(1), because you never have to search for the predecessor.
        </p>
        <Code id="doubly_list" />
        <Table
          head={['Operation', 'Pointer writes']}
          rows={[
            ['insertAfter(p, x) in the middle', '4: t->prev, t->next, p->next->prev, p->next'],
            ['deleteNode(p) in the middle', '2: p->prev->next, p->next->prev'],
            ['Delete the first node', 'head = p->next, and the new first node\'s prev = NULL'],
          ]}
        />
        <Callout kind="pitfall">
          <p>Every update must handle NULL neighbours: deleting the first node changes head; inserting after the last node has no <code>p-&gt;next-&gt;prev</code> to fix.</p>
        </Callout>
      </Sec>
      <AlgoViz
        title="Doubly linked list"
        note="Operations: insertBegin x, insertEnd x, insertAfter pos x (after the node at 0-based pos), delete pos."
        fields={[
          { name: 'init', label: 'starting list', initial: '10, 20, 30', width: 160, random: (r) => r.ints(r.int(2, 4), 1, 60).join(', ') },
          { name: 'ops', label: 'operations', initial: 'insertAfter 0 15, delete 2, insertBegin 5, insertEnd 40', width: 400 },
        ]}
        build={(v) => Li.dllFrames(v.init.trim() ? nums(v.init, { minLen: 0, maxLen: 5, min: -99, max: 99 }) : [], parseDll(v.ops))}
        code="doubly_list"
      />
      <Sec title="Trade-offs and applications">
        <ul>
          <li>Costs one extra pointer per node and more pointer updates per operation.</li>
          <li>Browser back/forward history, undo/redo stacks, music playlists (previous/next).</li>
          <li>LRU caches: a hash map to the node + a doubly linked list to move it to the front in O(1).</li>
          <li>Implementing a deque with O(1) operations at both ends.</li>
          <li>A doubly linked <b>circular</b> list with a header node removes all NULL special cases (Horowitz–Sahni §4.8).</li>
        </ul>
      </Sec>
    </>
  );
}

const dllQ: QGen = (rng) => {
  const init = rng.ints(rng.int(3, 4), 1, 9);
  const ops: Li.DllOp[] = Array.from({ length: rng.int(3, 4) }, () => {
    const r = rng.int(0, 3);
    return r === 0 ? { k: 'b', x: rng.int(10, 30) } : r === 1 ? { k: 'e', x: rng.int(10, 30) } : r === 2 ? { k: 'a', pos: rng.int(0, 2), x: rng.int(10, 30) } : { k: 'd', pos: rng.int(0, 2) };
  });
  const L = Li.runDLL([...init.map((x) => ({ k: 'e', x }) as Li.DllOp), ...ops]);
  const txt = ops.map((o) => (o.k === 'b' ? `insertBegin(${o.x})` : o.k === 'e' ? `insertEnd(${o.x})` : o.k === 'a' ? `insertAfter(node #${o.pos}, ${o.x})` : `deleteNode(node #${o.pos})`)).join(', ');
  return seq(`Doubly linked list ${init.join(' ⇄ ')}. Apply ${txt} (node #k = 0-based position at that moment). Write the list walking backwards from the last node.`, L.length ? [...L].reverse() : ['empty'], `Forward: ${L.join(' ⇄ ')}; backward: ${[...L].reverse().join(', ')}.`);
};
const L16_BANK = [
  mcq('How many pointer assignments does inserting a new node between two existing nodes of a doubly linked list take?', '4', ['2', '3', '1'], 't->prev, t->next, next->prev, prev->next.'),
  mcq('Deleting a known middle node p from a doubly linked list costs…', 'O(1)', ['O(n)', 'O(log n)', 'O(n²)'], 'p->prev->next = p->next; p->next->prev = p->prev.'),
  mcq('Main advantage of doubly over singly linked lists?', 'Traversal both ways and O(1) deletion given only the node', ['Less memory', 'Random access', 'Automatic sorting'], 'No need to find the predecessor.'),
  mcq('When deleting the first node of a doubly linked list you must update…', 'head, and the new first node\'s prev to NULL', ['only head', 'only the last node', 'nothing'], 'Both links that pointed at the old head.'),
  mcq('Which structure is commonly built with a hash map plus a doubly linked list?', 'LRU cache', ['Binary heap', 'Stack', 'Trie'], 'Move-to-front in O(1).'),
  tf('A doubly linked list node needs more memory than a singly linked node.', true, 'One extra pointer.'),
];

const L16: Level = {
  id: 'L16',
  n: 16,
  world: 4,
  title: 'Doubly Linked Lists',
  blurb: 'prev and next links, O(1) insert/delete next to a node, the NULL edge cases, and where two-way lists earn their extra pointer.',
  syllabus: ['DS U2 · Doubly linked list and applications'],
  snippets: ['doubly_list'],
  Lesson: L16Lesson,
  quiz: [dllQ, dllQ, dllQ, bank(L16_BANK), bank(L16_BANK), bank(L16_BANK), bank(L16_BANK)],
  cards: [{ q: 'deleteNode(p) in a doubly linked list?', a: 'if (p->prev) p->prev->next = p->next; else head = p->next; if (p->next) p->next->prev = p->prev; delete p;' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Doubly linked lists (dinsert, ddelete).', 'Cormen et al., Introduction to Algorithms 3e — §10.2 Linked lists.'],
};

/* =====================================================================
   Level 17 — Linked stacks & queues, polynomial addition
   ===================================================================== */

function parseSQ(s: string, kind: 'stack' | 'queue'): ({ k: 'add'; x: number } | { k: 'rem' })[] {
  return script(s).map(([name, a]) => {
    if (['push', 'enq', 'enqueue'].includes(name)) return { k: 'add', x: need(a, name) };
    if (['pop', 'deq', 'dequeue'].includes(name)) return { k: 'rem' };
    throw new Error(`Use ${kind === 'stack' ? 'push x, pop' : 'enq x, deq'}.`);
  });
}
function parsePoly(s: string): Li.Poly {
  const t = s.replace(/\s+/g, '').replace(/−/g, '-');
  if (!t) return [];
  const terms = t.match(/[+-]?[^+-]+/g) ?? [];
  const m = new Map<number, number>();
  for (const term of terms) {
    const mm = /^([+-]?)(\d*)(x(\^(\d+))?)?$/.exec(term);
    if (!mm || (!mm[2] && !mm[3])) throw new Error(`Can't read term "${term}". Write like 3x^4 - 2x + 5.`);
    const c = (mm[1] === '-' ? -1 : 1) * (mm[2] ? +mm[2] : 1);
    const e = mm[3] ? (mm[5] ? +mm[5] : 1) : 0;
    if (e > 20 || Math.abs(c) > 99) throw new Error('Keep exponents ≤ 20 and coefficients ≤ 99.');
    m.set(e, (m.get(e) ?? 0) + c);
  }
  return [...m.entries()].filter(([, c]) => c !== 0).sort((a, b) => b[0] - a[0]).map(([e, c]) => [c, e]);
}

function L17Lesson() {
  return (
    <>
      <Sec title="Stacks and queues without a capacity">
        <p>
          A linked stack pushes and pops at the head — the head <i>is</i> the top. A linked queue keeps two pointers: dequeue at <code>front</code>, enqueue
          at <code>rear</code>. Every operation is O(1) and there is no overflow until memory runs out.
        </p>
        <Code id="linked_stack_queue" />
        <Callout kind="pitfall">
          <p>
            When the last node is dequeued, front becomes NULL — set rear to NULL too, or the next enqueue would link onto freed memory.
          </p>
        </Callout>
      </Sec>
      <AlgoViz title="Linked stack" fields={[{ name: 'ops', label: 'operations', initial: 'push 1, push 2, push 3, pop, push 4, pop', width: 360 }]} build={(v) => Li.linkedSQFrames('stack', parseSQ(v.ops, 'stack'))} code="linked_stack_queue" />
      <AlgoViz title="Linked queue" fields={[{ name: 'ops', label: 'operations', initial: 'enq 1, enq 2, deq, enq 3, deq, deq', width: 360 }]} build={(v) => Li.linkedSQFrames('queue', parseSQ(v.ops, 'queue'))} code="linked_stack_queue" />
      <Sec title="Application: polynomials">
        <p>
          Horowitz–Sahni's classic linked-list application: store a polynomial as a list of (coefficient, exponent) terms in <b>decreasing exponent</b> order.
          Only non-zero terms take space, so x¹⁰⁰⁰ + 1 needs two nodes, not a 1001-entry array.
        </p>
        <p>
          Adding A + B is a merge: compare exponents at the two current terms; copy the larger; on equal exponents add the coefficients and keep the term only
          if the sum isn't zero. A dummy header node avoids a special case for the first output term. Time O(m + n).
        </p>
        <Code id="poly_add" />
      </Sec>
      <AlgoViz
        title="Polynomial addition"
        fields={[
          { name: 'a', label: 'A(x)', initial: '3x^14 + 2x^8 + 1', width: 200 },
          { name: 'b', label: 'B(x)', initial: '8x^14 - 3x^10 + 10x^6', width: 200 },
        ]}
        build={(v) => Li.polyFrames(parsePoly(v.a), parsePoly(v.b))}
        code="poly_add"
      />
      <Sec title="Other linked-list applications">
        <ul>
          <li>Sparse matrices (linked rows/columns of non-zero entries).</li>
          <li>Free-storage lists in memory allocators; adjacency lists of graphs (Level 38); chaining in hash tables (Level 33).</li>
        </ul>
      </Sec>
    </>
  );
}

const sqQ: QGen = (rng) => {
  const kind = rng.pick(['stack', 'queue'] as const);
  const ops = Array.from({ length: rng.int(6, 9) }, () => (rng.chance(0.6) ? { k: 'add' as const, x: rng.int(1, 30) } : { k: 'rem' as const }));
  const ref: number[] = [];
  const outs: number[] = [];
  for (const o of ops) {
    if (o.k === 'add') kind === 'stack' ? ref.unshift(o.x) : ref.push(o.x);
    else outs.push(ref.length ? ref.shift()! : -1);
  }
  const txt = ops.map((o) => (o.k === 'add' ? `${kind === 'stack' ? 'push' : 'enqueue'}(${o.x})` : kind === 'stack' ? 'pop()' : 'dequeue()')).join(', ');
  return seq(`Linked ${kind}, initially empty: ${txt}. List the values returned by ${kind === 'stack' ? 'pop' : 'dequeue'} in order (−1 when empty).`, outs.length ? outs : ['none'], `Returned: ${outs.join(', ')}.`);
};
const polyQ: QGen = (rng) => {
  const poly = (): Li.Poly => rng.distinct(rng.int(2, 4), 0, 6).sort((x, y) => y - x).map((e) => [rng.pick([-4, -3, -2, 1, 2, 3, 5]), e]);
  const a = poly();
  const b = poly();
  if (rng.chance(0.5) && a.length && b.length) b[0] = [-a[0][0], a[0][1]]; // force a cancelling term sometimes
  b.sort((x, y) => y[1] - x[1]);
  const bb: Li.Poly = [...new Map(b.map((t) => [t[1], t])).values()];
  const s = Li.addPoly(a, bb);
  const wrong1 = s.map(([c, e], i) => (i === 0 ? [c + 1, e] : [c, e]) as [number, number]);
  const wrong2 = s.slice(1);
  const minus = Li.addPoly(a, bb.map(([c, e]) => [-c, e] as [number, number])); // A − B: a sign slip
  return mcq(
    `A(x) = ${Li.polyStr(a)},  B(x) = ${Li.polyStr(bb)}. What does addPoly(A, B) return?`,
    Li.polyStr(s),
    [Li.polyStr(wrong1), Li.polyStr(wrong2), Li.polyStr(minus), Li.polyStr(a), Li.polyStr(bb)].filter((w) => w !== Li.polyStr(s)).slice(0, 3),
    `Merge by decreasing exponent, add equal exponents, drop zero coefficients: ${Li.polyStr(s)}.`,
  );
};
const L17_BANK = [
  mcq('In a linked stack, push and pop happen at…', 'the head of the list', ['the tail', 'the middle', 'both ends'], 'Head = top, so both are O(1).'),
  mcq('A linked queue keeps which pointers to make both operations O(1)?', 'front and rear', ['only front', 'only rear', 'head and middle'], 'Dequeue at front, enqueue at rear.'),
  mcq('After dequeuing the only node of a linked queue you must also…', 'set rear = NULL', ['set front = rear', 'free rear twice', 'nothing'], 'Otherwise rear dangles.'),
  mcq('Why store polynomials as linked lists of terms?', 'Only non-zero terms use memory, however large the degree', ['Faster coefficient access', 'Polynomials must be sorted', 'Arrays cannot hold negative numbers'], 'x^1000 + 1 is two nodes.'),
  mcq('Time to add polynomials with m and n terms (lists in decreasing exponent order)?', 'O(m + n)', ['O(mn)', 'O(m log n)', 'O(max(m, n)²)'], 'One merge pass.'),
  tf('A linked stack can overflow only when memory runs out.', true, 'No fixed capacity.'),
];

const L17: Level = {
  id: 'L17',
  n: 17,
  world: 4,
  title: 'Linked Stacks, Queues & Polynomials',
  blurb: 'The same stack and queue ADTs on linked nodes (no capacity), and the classic application: adding polynomials as merged term lists.',
  syllabus: ['DS U2 · Stacks and queues as linked lists', 'DS U2 · Applications of linked lists'],
  snippets: ['linked_stack_queue', 'poly_add'],
  Lesson: L17Lesson,
  quiz: [sqQ, sqQ, sqQ, polyQ, polyQ, bank(L17_BANK), bank(L17_BANK), bank(L17_BANK)],
  cards: [
    { q: 'Linked queue enqueue?', a: 't = new QNode{x, nullptr}; if (rear == nullptr) front = rear = t; else { rear->next = t; rear = t; }' },
    { q: 'Polynomial addition rule on equal exponents?', a: 'Add coefficients; keep the term only if the sum ≠ 0; advance both lists.' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C, 2e — Linked stacks and queues, Polynomials (padd).', 'Tremblay & Sorenson, An Introduction to Data Structures with Applications — linked storage applications.'],
};

export default [L14, L15, L16, L17];
