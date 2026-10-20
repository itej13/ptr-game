import type { Rng } from './core/rng';
import * as A from './engines/arrays';
import * as S from './engines/strings';

export interface Driver {
  bin: string;
  name: string;
  make: (rng: Rng) => { input: string; expect: string };
}

const sortedArr = (rng: Rng, n: number, lo = 0, hi = 99) => rng.ints(n, lo, hi).sort((a, b) => a - b);
const swapsStr = (s: [number, number][]) => s.map(([a, b]) => `${a}:${b}`).join(' ');
const word = (rng: Rng, len: number, alpha = 'ab') => Array.from({ length: len }, () => alpha[rng.int(0, alpha.length - 1)]).join('');

export const DRIVERS: Driver[] = [
  {
    bin: 'L05',
    name: 'insertAt',
    make: (rng) => {
      const cap = rng.int(1, 10);
      const n = rng.int(0, cap);
      const a = rng.ints(n, 0, 99);
      const pos = rng.int(-1, n + 1);
      const x = rng.int(0, 99);
      const r = A.insertAt(a, cap, pos, x);
      return { input: `insert ${n} ${cap} ${pos} ${x} ${a.join(' ')}`, expect: r ? `${n + 1} | ${r.join(' ')}` : `-1 | ${a.join(' ')}` };
    },
  },
  {
    bin: 'L05',
    name: 'deleteAt',
    make: (rng) => {
      const n = rng.int(0, 10);
      const a = rng.ints(n, 0, 99);
      const pos = rng.int(-1, n);
      const r = A.deleteAt(a, pos);
      return { input: `delete ${n} ${pos} ${a.join(' ')}`, expect: r ? `${n - 1} | ${r.join(' ')}` : `-1 | ${a.join(' ')}` };
    },
  },
  ...(['linear', 'binary', 'binrec', 'interp'] as const).map(
    (cmd): Driver => ({
      bin: 'L06',
      name: cmd,
      make: (rng) => {
        const n = rng.int(1, 30);
        const a = sortedArr(rng, n, 0, rng.pick([20, 100, 1000]));
        const key = rng.chance(0.6) ? rng.pick(a) : rng.int(-5, 1005);
        const r =
          cmd === 'linear' ? A.linearSearch(a, key).idx : cmd === 'interp' ? A.interpolationSearch(a, key).idx : A.binarySearch(a, key).idx;
        return { input: `${cmd} ${n} ${key} ${a.join(' ')}`, expect: String(r) };
      },
    }),
  ),
  ...(['bubble', 'selection', 'insertion'] as const).map(
    (cmd): Driver => ({
      bin: 'L07',
      name: `${cmd} sort (result + exact swap sequence)`,
      make: (rng) => {
        const n = rng.int(1, 14);
        const a = rng.chance(0.2) ? sortedArr(rng, n) : rng.ints(n, 0, rng.pick([5, 50]));
        const t = cmd === 'bubble' ? A.bubbleSort(a) : cmd === 'selection' ? A.selectionSort(a) : A.insertionSort(a);
        return { input: `${cmd} ${n} ${a.join(' ')}`, expect: `${t.sorted.join(' ')} | ${swapsStr(t.swaps)}` };
      },
    }),
  ),
  {
    bin: 'L08',
    name: 'length / concat / substring',
    make: (rng) => {
      const k = rng.int(0, 2);
      const a = word(rng, rng.int(1, 9), 'abcxyz');
      if (k === 0) return { input: `len ${a}`, expect: String(a.length) };
      const b = word(rng, rng.int(1, 9), 'pqr');
      if (k === 1) return { input: `concat ${a} ${b}`, expect: a + b };
      const pos = rng.int(0, a.length - 1);
      const len = rng.int(0, a.length - pos);
      return { input: `substr ${a} ${pos} ${len}`, expect: S.substring(a, pos, len) };
    },
  },
  ...(['match', 'kmp'] as const).map(
    (cmd): Driver => ({
      bin: 'L08',
      name: cmd,
      make: (rng) => {
        const t = word(rng, rng.int(1, 20));
        const p = rng.chance(0.5) ? t.slice(rng.int(0, t.length - 1)).slice(0, rng.int(1, 5)) : word(rng, rng.int(1, 4));
        const r = cmd === 'match' ? S.naiveMatch(t, p).idx : S.kmpSearch(t, p);
        return { input: `${cmd} ${t} ${p}`, expect: String(r) };
      },
    }),
  ),
];

/* ---------------- World 3 ---------------- */
import * as Q from './engines/stackq';
import * as E from './engines/expr';
import { randomTree, toInfix } from './engines/exprgen';
import { hanoiMoves } from './engines/recursion';

const opsFor = (rng: Rng, add: string, rem: string, peek = false) =>
  Array.from({ length: rng.int(1, 16) }, () => {
    const r = rng.next();
    return r < 0.55 ? `${add}:${rng.int(-50, 99)}` : peek && r < 0.7 ? 'peek' : rem;
  });
const toOps = (xs: string[]): Q.Op[] =>
  xs.map((s) => (s.includes(':') ? ({ op: s.split(':')[0], x: +s.split(':')[1] } as Q.Op) : ({ op: s } as Q.Op)));
const balanced = (s: string) => {
  const st: string[] = [];
  const pair: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  for (const c of s) {
    if ('([{'.includes(c)) st.push(c);
    else if (st.pop() !== pair[c]) return false;
  }
  return st.length === 0;
};

DRIVERS.push(
  {
    bin: 'L09',
    name: 'array stack push/pop/peek',
    make: (rng) => {
      const ops = opsFor(rng, 'push', 'pop', true);
      const r = Q.runStack(toOps(ops), 100);
      return { input: `ops ${ops.length} ${ops.join(' ')}`, expect: `${r.outputs.map((x) => x + ' ').join('')}| ${r.top} | m${r.messages}` };
    },
  },
  {
    bin: 'L09',
    name: 'balanced brackets',
    make: (rng) => {
      const s = Array.from({ length: rng.int(1, 12) }, () => rng.pick(['(', ')', '[', ']', '{', '}', '(', ')'])).join('');
      return { input: `bal ${s}`, expect: balanced(s) ? 'yes' : 'no' };
    },
  },
  {
    bin: 'L10',
    name: 'factorial',
    make: (rng) => {
      const n = rng.int(0, 20);
      let f = 1n;
      for (let i = 2n; i <= BigInt(n); i++) f *= i;
      return { input: `fact ${n}`, expect: f.toString() };
    },
  },
  {
    bin: 'L10',
    name: 'tower of hanoi move list',
    make: (rng) => {
      const n = rng.int(0, 8);
      return { input: `hanoi ${n}`, expect: hanoiMoves(n).map(([d, f, t]) => `${d}:${f}>${t} `).join('') };
    },
  },
  ...(['post', 'pre'] as const).map(
    (cmd): Driver => ({
      bin: 'L11',
      name: `infix → ${cmd}fix`,
      make: (rng) => {
        const s = toInfix(randomTree(rng, rng.int(1, 4), () => rng.pick([...'abcdefgh'])), rng);
        return { input: `${cmd} ${s}`, expect: cmd === 'post' ? E.toPostfix(s) : E.toPrefix(s) };
      },
    }),
  ),
  {
    bin: 'L11',
    name: 'evaluate postfix',
    make: (rng) => {
      for (;;) {
        const t = randomTree(rng, rng.int(1, 3), () => String(rng.int(0, 9)));
        const p = E.postorder({ ...t, v: t.v === '^' ? '+' : t.v, l: t.l, r: t.r }).replace(/\^/g, '*');
        const v = E.evalPostfix(p);
        if (v !== null && Math.abs(v) < 1e6) return { input: `eval ${p}`, expect: String(v) };
      }
    },
  },
  {
    bin: 'L12',
    name: 'circular queue (H–S convention, MAX = 8)',
    make: (rng) => {
      const ops = opsFor(rng, 'enq', 'deq');
      const r = Q.runCircular(toOps(ops), 8);
      return { input: `ops ${ops.length} ${ops.join(' ')}`, expect: `${r.outputs.map((x) => x + ' ').join('')}| f${r.full} e${r.empty} | ${r.front} ${r.rear}` };
    },
  },
  {
    bin: 'L13',
    name: 'unsorted-array priority queue',
    make: (rng) => {
      const ops = opsFor(rng, 'ins', 'del');
      const r = Q.runPQ(toOps(ops), 100);
      return { input: `ops ${ops.length} ${ops.join(' ')}`, expect: `${r.outputs.map((x) => x + ' ').join('')}m${r.messages} |${r.contents.map((x) => ' ' + x).join('')}` };
    },
  },
);

/* ---------------- World 4 ---------------- */
import * as Li from './engines/lists';

DRIVERS.push(
  {
    bin: 'L14',
    name: 'singly linked list insert/delete/search',
    make: (rng) => {
      const ops: Li.SllOp[] = [];
      const txt: string[] = [];
      let len = 0;
      for (let k = rng.int(1, 14); k > 0; k--) {
        const r = rng.int(0, 4);
        const x = rng.int(0, 9);
        if (r === 0) { ops.push({ k: 'b', x }); txt.push(`b:${x}`); len++; }
        else if (r === 1) { ops.push({ k: 'e', x }); txt.push(`e:${x}`); len++; }
        else if (r === 2) { const pos = rng.int(0, len + 1); ops.push({ k: 'a', pos, x }); txt.push(`a:${pos}:${x}`); if (pos <= len) len++; }
        else if (r === 3) { ops.push({ k: 'd', x }); txt.push(`d:${x}`); }
        else { ops.push({ k: 's', x }); txt.push(`s:${x}`); }
      }
      const r = Li.runSLL(ops);
      return { input: `ops ${txt.length} ${txt.join(' ')}`, expect: `${r.outputs.map((o) => o + ' ').join('')}| i${r.invalid} | ${r.list.map((v) => v + ' ').join('')}` };
    },
  },
  {
    bin: 'L15',
    name: 'circular list with last pointer',
    make: (rng) => {
      const ops: Li.CllOp[] = [];
      const txt: string[] = [];
      for (let k = rng.int(1, 14); k > 0; k--) {
        const r = rng.int(0, 2);
        const x = rng.int(0, 99);
        if (r === 0) { ops.push({ k: 'f', x }); txt.push(`f:${x}`); }
        else if (r === 1) { ops.push({ k: 'e', x }); txt.push(`e:${x}`); }
        else { ops.push({ k: 'd' }); txt.push('d'); }
      }
      const r = Li.runCLL(ops);
      return { input: `ops ${txt.length} ${txt.join(' ')}`, expect: `${r.list.map((v) => v + ' ').join('')}| last=${r.last ?? 'null'}` };
    },
  },
  {
    bin: 'L16',
    name: 'doubly linked list (forward and backward walks)',
    make: (rng) => {
      const ops: Li.DllOp[] = [];
      const txt: string[] = [];
      for (let k = rng.int(1, 14); k > 0; k--) {
        const r = rng.int(0, 3);
        const x = rng.int(0, 99);
        const pos = rng.int(0, 6);
        if (r === 0) { ops.push({ k: 'b', x }); txt.push(`b:${x}`); }
        else if (r === 1) { ops.push({ k: 'e', x }); txt.push(`e:${x}`); }
        else if (r === 2) { ops.push({ k: 'a', pos, x }); txt.push(`a:${pos}:${x}`); }
        else { ops.push({ k: 'd', pos }); txt.push(`d:${pos}`); }
      }
      const L = Li.runDLL(ops);
      return { input: `ops ${txt.length} ${txt.join(' ')}`, expect: `${L.map((v) => v + ' ').join('')}| ${[...L].reverse().map((v) => v + ' ').join('')}` };
    },
  },
  ...(['stack', 'queue'] as const).map(
    (kind): Driver => ({
      bin: 'L17',
      name: `linked ${kind}`,
      make: (rng) => {
        const txt: string[] = [];
        const ref: number[] = [];
        const outs: number[] = [];
        for (let k = rng.int(1, 14); k > 0; k--) {
          if (rng.chance(0.6)) {
            const x = rng.int(0, 99);
            txt.push(`p:${x}`);
            if (kind === 'stack') ref.unshift(x);
            else ref.push(x);
          } else {
            txt.push('o');
            outs.push(ref.length ? ref.shift()! : -1);
          }
        }
        return { input: `${kind} ${txt.length} ${txt.join(' ')}`, expect: `${outs.map((v) => v + ' ').join('')}| ${ref.map((v) => v + ' ').join('')}` };
      },
    }),
  ),
  {
    bin: 'L17',
    name: 'polynomial addition',
    make: (rng) => {
      const poly = (): Li.Poly => rng.distinct(rng.int(0, 5), 0, 7).sort((x, y) => y - x).map((e) => [rng.pick([-5, -3, -2, -1, 1, 2, 3, 4, 5]), e]);
      const a = poly();
      const b = rng.chance(0.4) ? a.map(([c, e]) => [rng.chance(0.5) ? -c : rng.int(1, 3), e] as [number, number]) : poly();
      const s = Li.addPoly(a, b);
      const enc = (p: Li.Poly) => `${p.length} ${p.map(([c, e]) => `${c} ${e}`).join(' ')}`;
      return { input: `poly ${enc(a)} ${enc(b)}`, expect: s.map(([c, e]) => `${c}x${e} `).join('') };
    },
  },
);

/* ---------------- World 5 ---------------- */
import * as D from './engines/dc';

DRIVERS.push(
  {
    bin: 'L20',
    name: 'merge sort',
    make: (rng) => {
      const a = rng.ints(rng.int(0, 20), -20, rng.pick([5, 99]));
      return { input: `sort ${a.length} ${a.join(' ')}`, expect: D.mergeSort(a).sorted.join(' ') };
    },
  },
  {
    bin: 'L20',
    name: 'iterative (bottom-up) merge sort',
    make: (rng) => {
      const a = rng.ints(rng.int(0, 20), -20, 99);
      return { input: `isort ${a.length} ${a.join(' ')}`, expect: D.mergeSortIterative(a).join(' ') };
    },
  },
  {
    bin: 'L20',
    name: 'merge of two sorted halves',
    make: (rng) => {
      const n = rng.int(1, 16);
      const m = Math.floor((n - 1) / 2);
      const a = [...rng.ints(m + 1, 0, 30).sort((x, y) => x - y), ...rng.ints(n - m - 1, 0, 30).sort((x, y) => x - y)];
      return { input: `merge ${n} ${a.join(' ')}`, expect: D.mergeOnly(a).join(' ') };
    },
  },
  ...(['part', 'sort', 'lpart', 'lsort'] as const).map(
    (cmd): Driver => ({
      bin: 'L21',
      name: `${cmd.startsWith('l') ? 'Lomuto ' : 'first-pivot '}${cmd.endsWith('part') ? 'partition' : 'quicksort'} (exact swap sequence)`,
      make: (rng) => {
        const a = rng.ints(rng.int(1, 14), 0, rng.pick([4, 50]));
        const b = a.slice();
        let r = -1;
        let swaps: [number, number][] = [];
        let out = b;
        if (cmd === 'part') r = D.partitionHoareFirst(b, 0, b.length - 1, swaps);
        else if (cmd === 'lpart') r = D.partitionLomuto(b, 0, b.length - 1, swaps);
        else if (cmd === 'sort') ({ sorted: out, swaps } = D.quickSort(a));
        else ({ sorted: out, swaps } = D.quickSortLomuto(a));
        return { input: `${cmd} ${a.length} ${a.join(' ')}`, expect: `${r} ${out.join(' ')} | ${swaps.map(([x, y]) => `${x}:${y}`).join(' ')}` };
      },
    }),
  ),
);

/* ---------------- World 6 ---------------- */
import * as T from './engines/trees';

const randTree = (rng: Rng) => T.randomTree(rng, rng.int(0, 12), 1, 60);
DRIVERS.push(
  {
    bin: 'L23',
    name: 'height / node count / leaf count',
    make: (rng) => {
      const t = randTree(rng);
      return { input: `props ${T.serialise(t)}`, expect: `${T.height(t)} ${T.countNodes(t)} ${T.countLeaves(t)}` };
    },
  },
  {
    bin: 'L24',
    name: 'in/pre/post, iterative inorder, level order',
    make: (rng) => {
      const t = randTree(rng);
      const s = (a: number[]) => a.map((x) => x + ' ').join('');
      return { input: `trav ${T.serialise(t)}`, expect: `${s(T.inorder(t))}| ${s(T.preorder(t))}| ${s(T.postorder(t))}| ${s(T.inorder(t))}| ${s(T.levelOrder(t))}` };
    },
  },
  {
    bin: 'L25',
    name: 'BST insert (shape) + search',
    make: (rng) => {
      const keys = rng.ints(rng.int(0, 15), 1, 40);
      const qs = rng.ints(rng.int(1, 6), 1, 40);
      const r = T.bstFrom(keys);
      return { input: `bst ${keys.length} ${keys.join(' ')} ${qs.length} ${qs.join(' ')}`, expect: `${T.bstSerialise(r)}| ${qs.map((q) => (T.bstPath(r, q).at(-1) === q ? 'Y' : 'N')).join('')}` };
    },
  },
  {
    bin: 'L26',
    name: 'BST delete (inorder successor)',
    make: (rng) => {
      const keys = rng.ints(rng.int(1, 15), 1, 40);
      const dels = rng.chance(0.7) ? rng.shuffle(keys).slice(0, rng.int(1, 6)) : rng.ints(rng.int(1, 4), 1, 40);
      let r = T.bstFrom(keys);
      for (const d of dels) r = T.bstDelete(r, d);
      return { input: `del ${keys.length} ${keys.join(' ')} ${dels.length} ${dels.join(' ')}`, expect: T.bstSerialise(r).trim() };
    },
  },
  {
    bin: 'L28',
    name: 'threaded tree: tinorder and insucc',
    make: (rng) => {
      const t = randTree(rng);
      const ino = T.inorder(t);
      return { input: `thr ${T.serialise(t)}`, expect: `${ino.map((x) => x + ' ').join('')}| ${ino.map((_, i) => (i + 1 < ino.length ? ino[i + 1] : 'H') + ' ').join('')}` };
    },
  },
  ...(['sort', 'build'] as const).map(
    (cmd): Driver => ({
      bin: 'L29',
      name: `heap ${cmd} (exact swap sequence)`,
      make: (rng) => {
        const a = rng.ints(rng.int(1, 14), 0, rng.pick([5, 60]));
        const log: [number, number][] = [];
        const out = cmd === 'sort' ? T.heapSort(a, log) : T.buildHeap(a, log);
        return { input: `${cmd} ${a.length} ${a.join(' ')}`, expect: `${out.join(' ')} | ${log.map(([x, y]) => `${x}:${y}`).join(' ')}` };
      },
    }),
  ),
  {
    bin: 'L29',
    name: 'heap priority queue insert / deleteMax',
    make: (rng) => {
      const h: number[] = [];
      const txt: string[] = [];
      let out = '';
      for (let k = rng.int(1, 16); k > 0; k--) {
        if (rng.chance(0.6)) {
          const x = rng.int(0, 50);
          T.heapInsert(h, x);
          txt.push(`i:${x}`);
        } else {
          txt.push('d');
          if (h.length) out += T.heapDeleteMax(h) + ' ';
        }
      }
      return { input: `pq ${txt.length} ${txt.join(' ')}`, expect: `${out}| ${h.join(' ')}` };
    },
  },
  {
    bin: 'L30',
    name: 'AVL insert/delete (shape + heights)',
    make: (rng) => {
      let r: T.AVL | null = null;
      const txt: string[] = [];
      const present: number[] = [];
      for (let k = rng.int(1, 18); k > 0; k--) {
        if (present.length && rng.chance(0.3)) {
          const x = rng.chance(0.8) ? rng.pick(present) : rng.int(1, 40);
          r = T.avlDelete(r, x);
          txt.push(`d:${x}`);
          const i = present.indexOf(x);
          if (i >= 0) present.splice(i, 1);
        } else {
          const x = rng.int(1, 40);
          r = T.avlInsert(r, x);
          txt.push(`i:${x}`);
          if (!present.includes(x)) present.push(x);
        }
      }
      return { input: `avl ${txt.length} ${txt.join(' ')}`, expect: T.avlPreH(r).trim() };
    },
  },
  {
    bin: 'L31',
    name: 'B-tree of order 5: insert (splits) + search',
    make: (rng) => {
      const keys = rng.ints(rng.int(1, 30), 1, 60);
      const qs = rng.ints(rng.int(1, 6), 1, 60);
      const r = T.btFrom(keys, 5);
      return { input: `bt ${keys.length} ${keys.join(' ')} ${qs.length} ${qs.join(' ')}`, expect: `${T.btDump(r)} | ${qs.map((q) => (T.btSearch(r, q) ? 'Y' : 'N')).join('')}` };
    },
  },
);

/* ---------------- World 7 ---------------- */
import * as H from './engines/hash';

DRIVERS.push(
  {
    bin: 'L33',
    name: 'separate chaining (front insertion) + search',
    make: (rng) => {
      const keys = rng.ints(rng.int(0, 15), 0, 99);
      const qs = rng.ints(rng.int(1, 5), 0, 99);
      const b = H.chain(keys, 10);
      return { input: `chain ${keys.length} ${keys.join(' ')} ${qs.length} ${qs.join(' ')}`, expect: `${b.map((c, i) => `${i}:${c.map((x) => x + ',').join('')} `).join('')}|${qs.map((q) => (keys.includes(q) ? ' Y' : ' N')).join('')}` };
    },
  },
  {
    bin: 'L33',
    name: 'linear probing insert + search (M = 11)',
    make: (rng) => {
      const keys = rng.ints(rng.int(0, 13), 0, 99);
      const qs = rng.ints(rng.int(1, 5), 0, 99);
      const r = H.openAddress(keys, 11, 'linear');
      return {
        input: `probe ${keys.length} ${keys.join(' ')} ${qs.length} ${qs.join(' ')}`,
        expect: `${r.table.map((x) => (x === null ? -1 : x) + ' ').join('')}| ${r.placed.map((p) => (p ? 'T' : 'F')).join('')} |${qs.map((q) => ' ' + H.probeSearch(r.table, q, 'linear').slot).join('')}`,
      };
    },
  },
);

/* ---------------- World 8 ---------------- */
import * as X from './engines/sortx';

DRIVERS.push({
  bin: 'L35',
  name: 'LSD radix sort: array after every pass',
  make: (rng) => {
    const a = rng.ints(rng.int(0, 14), 0, rng.pick([9, 99, 999, 9999]));
    const passes = X.radixPasses(a);
    return { input: `radix ${a.length} ${a.join(' ')}`, expect: `${passes.map((p) => p.map((x) => x + ' ').join('') + '/ ').join('')}| ${[...a].sort((x, y) => x - y).join(' ')}` };
  },
});

/* ---------------- World 9 ---------------- */
import * as G from './engines/graphs';

const enc = (g: G.Graph, w: boolean) => g.edges.map((e) => (w ? `${e.u} ${e.v} ${e.w}` : `${e.u} ${e.v}`)).join(' ');
DRIVERS.push(
  {
    bin: 'L39',
    name: 'DFS / BFS order and component count',
    make: (rng) => {
      const n = rng.int(1, 9);
      const g = G.randomGraph(rng, n, rng.int(0, 12));
      const s = rng.int(0, n - 1);
      const adj = G.adjList(g);
      return { input: `trav ${n} ${g.edges.length} ${s} ${enc(g, false)}`, expect: `${G.dfsOrder(adj, s).map((x) => x + ' ').join('')}| ${G.bfsOrder(adj, s).map((x) => x + ' ').join('')}| ${G.components(adj).length}` };
    },
  },
  {
    bin: 'L40',
    name: 'cut vertices, bridges, disc/low',
    make: (rng) => {
      const n = rng.int(1, 9);
      const g = G.randomGraph(rng, n, rng.int(0, 11));
      const t = G.tarjan(g);
      return { input: `ap ${n} ${g.edges.length} ${enc(g, false)}`, expect: `${t.cut.map((x) => x + ' ').join('')}|${t.bridges.map(([a, b]) => ` ${a}-${b}`).join('')} | ${t.disc.map((d, i) => `${d}:${t.low[i]} `).join('')}` };
    },
  },
  {
    bin: 'L41',
    name: 'union by size + path compression',
    make: (rng) => {
      const n = rng.int(2, 10);
      const d = new G.DSU(n);
      const ops: string[] = [];
      let out = '';
      for (let k = rng.int(1, 14); k > 0; k--) {
        if (rng.chance(0.65)) {
          const a = rng.int(0, n - 1);
          const b = rng.int(0, n - 1);
          ops.push(`u:${a}:${b}`);
          out += d.unite(a, b) ? 'T ' : 'F ';
        } else {
          const x = rng.int(0, n - 1);
          ops.push(`f:${x}`);
          out += d.find(x) + ' ';
        }
      }
      return { input: `dsu ${n} ${ops.length} ${ops.join(' ')}`, expect: `${out}|${d.parent.map((p) => ' ' + p).join('')}` };
    },
  },
  {
    bin: 'L42',
    name: 'Kruskal (edges in pick order)',
    make: (rng) => {
      const n = rng.int(2, 8);
      const g = G.randomGraph(rng, n, rng.int(n - 1, 14), { connected: rng.chance(0.8), wmin: 1, wmax: 9 });
      const r = G.kruskal(g);
      return { input: `kruskal ${n} ${g.edges.length} ${enc(g, true)}`, expect: `${r.total} |${r.mst.map((e) => ` ${e.u}-${e.v}`).join('')}` };
    },
  },
  {
    bin: 'L42',
    name: 'Prim (O(V²), parent array)',
    make: (rng) => {
      const n = rng.int(2, 8);
      const g = G.randomGraph(rng, n, rng.int(n - 1, 14), { connected: true, wmin: 1, wmax: 9 });
      const r = G.prim(g);
      return { input: `prim ${n} ${g.edges.length} ${enc(g, true)}`, expect: `${r.total} |${r.parent.map((p) => ' ' + p).join('')}` };
    },
  },
  {
    bin: 'L43',
    name: 'Dijkstra distances (directed)',
    make: (rng) => {
      const n = rng.int(1, 9);
      const g = G.randomGraph(rng, n, rng.int(0, 16), { directed: true, wmin: 0, wmax: 9 });
      const s = rng.int(0, n - 1);
      return { input: `dij ${n} ${g.edges.length} ${s} ${enc(g, true)}`, expect: G.dijkstra(g, s).dist.map((d) => (d === Infinity ? 'INF' : d) + ' ').join('') };
    },
  },
  {
    bin: 'L44',
    name: 'Bellman–Ford with negative edges / cycles',
    make: (rng) => {
      const n = rng.int(1, 8);
      const g = G.randomGraph(rng, n, rng.int(0, 14), { directed: true, wmin: -3, wmax: 9 });
      const s = rng.int(0, n - 1);
      const r = G.bellmanFord(g, s);
      return { input: `bf ${n} ${g.edges.length} ${s} ${enc(g, true)}`, expect: r.negCycle ? 'NEG' : r.dist.map((d) => (d === Infinity ? 'INF' : d) + ' ').join('') };
    },
  },
  {
    bin: 'L45',
    name: 'Warshall transitive closure',
    make: (rng) => {
      const n = rng.int(1, 7);
      const M = Array.from({ length: n }, () => Array.from({ length: n }, () => (rng.chance(0.25) ? 1 : 0)));
      return { input: `war ${n} ${M.flat().join(' ')}`, expect: G.warshall(M).map((r) => r.join('') + ' ').join('') };
    },
  },
  {
    bin: 'L46',
    name: "Kahn's topological order",
    make: (rng) => {
      const n = rng.int(1, 9);
      const g = G.randomGraph(rng, n, rng.int(0, 14), { directed: true, dag: rng.chance(0.85) });
      return { input: `topo ${n} ${g.edges.length} ${enc(g, false)}`, expect: G.kahn(n, G.adjList(g)).map((x) => x + ' ').join('') };
    },
  },
);

/* ---------------- World 10 ---------------- */
import * as Gr from './engines/greedy';

DRIVERS.push(
  {
    bin: 'L47',
    name: 'fractional knapsack',
    make: (rng) => {
      const items = Array.from({ length: rng.int(1, 8) }, () => ({ value: rng.int(1, 60), weight: rng.int(1, 30) }));
      const W = rng.int(0, 80);
      return { input: `fk ${W} ${items.length} ${items.map((i) => `${i.value} ${i.weight}`).join(' ')}`, expect: Gr.fractionalKnapsack(W, items).total.toFixed(4) };
    },
  },
  {
    bin: 'L48',
    name: 'activity selection (chosen indices)',
    make: (rng) => {
      const n = rng.int(1, 10);
      const s = rng.ints(n, 0, 15);
      const f = s.map((x) => x + rng.int(1, 6));
      return { input: `act ${n} ${s.map((x, i) => `${x} ${f[i]}`).join(' ')}`, expect: Gr.selectActivities(s, f).map((i) => i + ' ').join('') };
    },
  },
  {
    bin: 'L48',
    name: 'job sequencing (profit + slots)',
    make: (rng) => {
      const n = rng.int(1, 9);
      const d = rng.ints(n, 1, 5);
      const p = rng.ints(n, 1, 100);
      const r = Gr.jobSequencing(d, p);
      return { input: `job ${n} ${d.map((x, i) => `${x} ${p[i]}`).join(' ')}`, expect: `${r.total} |${r.slot.slice(1).map((j) => ' ' + j).join('')}` };
    },
  },
  {
    bin: 'L49',
    name: 'Huffman codes (tie-breaking by creation order)',
    make: (rng) => {
      const n = rng.int(1, 8);
      const cs = rng.shuffle([...'abcdefghij']).slice(0, n);
      const fs = rng.ints(n, 1, rng.pick([5, 50]));
      const codes = Gr.huffmanCodes(cs, fs);
      return { input: `huff ${n} ${cs.map((c, i) => `${c} ${fs[i]}`).join(' ')}`, expect: [...cs].sort().map((c) => `${c}=${codes[c]} `).join('') };
    },
  },
);

/* ---------------- World 11 ---------------- */
import * as DP from './engines/dp';

DRIVERS.push(
  {
    bin: 'L50',
    name: 'rod cutting (revenue + pieces)',
    make: (rng) => {
      const n = rng.int(1, 12);
      const price = [0, ...rng.ints(n, 1, 30)];
      const r = DP.rodCut(price, n);
      return { input: `rod ${n} ${price.slice(1).join(' ')}`, expect: `${r.r[n]} |${DP.rodPieces(r.s, n).map((x) => ' ' + x).join('')}` };
    },
  },
  {
    bin: 'L51',
    name: 'Floyd–Warshall (with negative edges, no negative cycles)',
    make: (rng) => {
      for (;;) {
        const n = rng.int(1, 6);
        const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? 0 : rng.chance(0.45) ? rng.int(-2, 12) : Infinity)));
        const D = DP.floydWarshall(M);
        if (D.some((r, i) => r[i] < 0)) continue; // negative cycle: skip
        return { input: `fw ${n} ${M.flat().map((x) => (x === Infinity ? 'X' : x)).join(' ')}`, expect: D.map((r) => r.map((x) => (x === Infinity ? 'X' : x) + ',').join('') + ' ').join('') };
      }
    },
  },
  {
    bin: 'L52',
    name: 'matrix-chain cost + parenthesisation',
    make: (rng) => {
      const k = rng.int(2, 8);
      const p = rng.ints(k, 1, 40);
      const r = DP.matrixChain(p);
      return { input: `mcm ${k} ${p.join(' ')}`, expect: `${r.cost} ${r.parens}` };
    },
  },
  ...(['lcs', 'edit'] as const).map(
    (cmd): Driver => ({
      bin: 'L53',
      name: cmd === 'lcs' ? 'LCS length + traced sequence' : 'edit distance',
      make: (rng) => {
        const w = () => Array.from({ length: rng.int(0, 9) }, () => 'ABCD'[rng.int(0, 3)]).join('');
        const a = w();
        const b = w();
        const ex = cmd === 'lcs' ? `${DP.lcs(a, b).len} ${DP.lcs(a, b).seq || '.'}` : String(DP.editDistance(a, b).dist);
        return { input: `${cmd} ${a || '.'} ${b || '.'}`, expect: ex };
      },
    }),
  ),
  {
    bin: 'L55',
    name: '0/1 knapsack (value + traced items)',
    make: (rng) => {
      const n = rng.int(1, 8);
      const wt = rng.ints(n, 1, 15);
      const val = rng.ints(n, 1, 40);
      const W = rng.int(0, 40);
      const r = DP.knapsack01(W, wt, val);
      return { input: `knap ${W} ${n} ${wt.map((w, i) => `${w} ${val[i]}`).join(' ')}`, expect: `${r.best} |${r.chosen.map((x) => ' ' + x).join('')}` };
    },
  },
  {
    bin: 'L56',
    name: 'TSP (Held–Karp)',
    make: (rng) => {
      const n = rng.int(1, 7);
      const d = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) d[i][j] = rng.int(1, 30);
      return { input: `tsp ${n} ${d.flat().join(' ')}`, expect: String(DP.tsp(d).cost) };
    },
  },
);

/* ---------------- World 12 ---------------- */
import * as BT from './engines/bt';

DRIVERS.push(
  {
    bin: 'L57',
    name: 'N-Queens: count + first solution',
    make: (rng) => {
      const n = rng.int(1, 9);
      const s = BT.nQueens(n);
      return { input: `nq ${n}`, expect: `${s.length} |${s.length ? s[0].map((c) => ' ' + c).join('') : ''}` };
    },
  },
  {
    bin: 'L58',
    name: 'sum of subsets (all solutions, in order)',
    make: (rng) => {
      const n = rng.int(1, 8);
      const w = rng.ints(n, 1, 20).sort((a, b) => a - b);
      const m = rng.int(1, 40);
      return { input: `sos ${m} ${n} ${w.join(' ')}`, expect: `${BT.sumOfSubsets(w, m).map((s) => s.join('') + ' ').join('')}|` };
    },
  },
  {
    bin: 'L58',
    name: 'knapsack by backtracking with bound',
    make: (rng) => {
      const n = rng.int(1, 8);
      const wt = rng.ints(n, 1, 15);
      const val = rng.ints(n, 1, 40);
      const W = rng.int(0, 40);
      const s = BT.sortByRatio(wt, val);
      return { input: `bk ${W} ${n} ${wt.map((w, i) => `${w} ${val[i]}`).join(' ')}`, expect: String(BT.bknap(W, s.wt, s.val).best) };
    },
  },
);
