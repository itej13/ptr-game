import type { Frame, Level, QGen, SNode, SEdge } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, int, type Field } from '../core/vizkit';
import { mcq, num, seq, tf, bank } from '../core/qhelp';
import { grid } from '../core/layouts';
import * as G from '../engines/graphs';
import type { Rng } from '../core/rng';

export const gFields = (n: number, edges: string, o: { directed?: boolean; weighted?: boolean; source?: number; connected?: boolean; dag?: boolean; wmin?: number } = {}): Field[] => [
  { name: 'n', label: 'vertices', initial: String(n), width: 80 },
  {
    name: 'e',
    label: `edges (${o.directed ? 'u>v' : 'u-v'}${o.weighted ? ':w' : ''})`,
    initial: edges,
    width: 380,
    random: (r: Rng) => G.graphText(G.randomGraph(r, n, r.int(n, n + 4), { directed: o.directed, connected: o.connected ?? true, dag: o.dag, wmin: o.wmin ?? 1, wmax: 9 }), o.weighted),
  },
  ...(o.source !== undefined ? [{ name: 's', label: 'source', initial: String(o.source), width: 70 }] : []),
];
export const readG = (v: Record<string, string>, directed: boolean, maxN = 10) => G.parseGraph(v.e, int(v.n, 'vertices', 1, maxN), directed, maxN);

/* =====================================================================
   Level 38 — Graph terminology & representations
   ===================================================================== */

function reprFrames(g: G.Graph): Frame[] {
  const base = G.graphStatic(g, false);
  const M = G.adjMatrix(g);
  const adj = G.adjList(g);
  const n = g.n;
  const mat = grid(M, { x: 500, y: 50, cw: 32, rowHead: [...Array(n).keys()], colHead: [...Array(n).keys()], key: 'M', tone: (i, j) => (M[i][j] ? 'done' : 'ghost') });
  const lists = (): { nodes: SNode[]; edges: SEdge[] } => {
    const nodes: SNode[] = [];
    const edges: SEdge[] = [];
    adj.forEach((l, u) => {
      const y = 50 + u * 36;
      nodes.push({ id: `L${u}`, x: 500, y, w: 32, h: 28, shape: 'rect', label: u, tone: 'accent' });
      l.forEach((v, k) => {
        nodes.push({ id: `L${u}-${k}`, x: 560 + k * 44, y, w: 36, h: 26, shape: 'rect', label: v, fontSize: 12 });
        edges.push({ from: k ? `L${u}-${k - 1}` : `L${u}`, to: `L${u}-${k}`, directed: true });
      });
    });
    return { nodes, edges };
  };
  const ls = lists();
  const deg = adj.map((l) => l.length);
  const e = g.edges.length;
  return [
    { scene: base, say: `${g.directed ? 'Directed' : 'Undirected'} graph with n = ${n} vertices and e = ${e} edges.` },
    { scene: { ...base, w: mat.w + 20, h: Math.max(base.h, mat.h), nodes: [...base.nodes, ...mat.nodes] }, say: `Adjacency matrix: A[i][j] = 1 iff there is an edge ${g.directed ? 'i → j' : 'i–j'}. ${g.directed ? 'Row sums = out-degrees, column sums = in-degrees.' : 'Symmetric; row sums = degrees.'} Space Θ(n²) regardless of e.`, sfx: 'tick' },
    { scene: { ...base, w: 600 + Math.max(...adj.map((l) => l.length), 1) * 44, h: Math.max(base.h, 80 + n * 36), nodes: [...base.nodes, ...ls.nodes], edges: [...(base.edges ?? []), ...ls.edges] }, say: `Adjacency lists: vertex u's list holds its neighbours. Space Θ(n + e) — ${g.directed ? 'e list nodes' : '2e list nodes (each edge appears twice)'}.`, sfx: 'tick' },
    { scene: base, say: g.directed ? `Out-degrees: ${deg.join(', ')}. Σ out-degree = Σ in-degree = e = ${e}.` : `Degrees: ${deg.join(', ')}. Σ degree = 2e = ${2 * e} (handshaking lemma).`, sfx: 'found' },
  ];
}

function L38Lesson() {
  return (
    <>
      <Sec title="Graphs">
        <p>
          A graph G = (V, E) is a set of <b>vertices</b> V and a set of <b>edges</b> E. In an <b>undirected</b> graph an edge is an unordered pair (u, v); in a{' '}
          <b>directed</b> graph (digraph) it is an ordered pair ⟨u, v⟩ from tail u to head v. Horowitz–Sahni's graphs have no self-loops and no repeated edges;
          a graph that allows multiple edges between the same pair (and loops) is a <b>multigraph</b>.
        </p>
        <Table
          head={['Term', 'Meaning']}
          rows={[
            ['Adjacent / incident', 'u and v are adjacent if (u, v) ∈ E; the edge is incident on both'],
            ['Degree', 'number of incident edges; in a digraph: in-degree and out-degree'],
            ['Path, simple path, cycle', 'vertex sequence joined by edges; no repeated vertices; path that returns to its start'],
            ['Connected', 'a path between every pair (undirected); strongly connected for digraphs (paths both ways)'],
            ['Connected component', 'maximal connected subgraph'],
            ['Complete graph', 'every pair adjacent: n(n − 1)/2 edges undirected, n(n − 1) directed'],
            ['Subgraph, spanning subgraph', 'subset of vertices/edges; spanning = keeps all vertices'],
            ['Tree', 'connected acyclic graph: exactly n − 1 edges'],
            ['Weighted graph / network', 'edges carry weights (costs, lengths, times)'],
          ]}
        />
        <F>Handshaking lemma: Σ deg(v) = 2e (undirected);  Σ in-deg = Σ out-deg = e (directed)</F>
      </Sec>
      <Sec title="Representations">
        <Table
          head={['Representation', 'Space', 'Edge (u, v)?', 'All neighbours of u', 'Notes']}
          rows={[
            ['Adjacency matrix', 'Θ(n²)', 'O(1)', 'O(n)', 'dense graphs; symmetric if undirected'],
            ['Adjacency lists', 'Θ(n + e)', 'O(deg u)', 'O(deg u)', 'sparse graphs — the usual choice'],
            ['Adjacency multilists (H–S)', 'Θ(n + e)', 'O(deg u)', 'O(deg u)', 'one node per undirected edge, shared by both endpoints\' lists, with a mark bit'],
            ['Incidence matrix', 'Θ(n·e)', 'O(e)', 'O(e)', 'rows = vertices, columns = edges'],
            ['Inverse adjacency lists', 'Θ(n + e)', '—', 'in-neighbours', 'for in-degrees of digraphs'],
          ]}
        />
      </Sec>
      <AlgoViz
        title="Matrix vs lists for your graph"
        fields={gFields(5, '0-1, 0-2, 1-2, 1-3, 3-4')}
        build={(v) => reprFrames(readG(v, false, 8))}
      />
      <AlgoViz
        title="Same for a digraph"
        fields={gFields(4, '0>1, 1>2, 2>0, 2>3', { directed: true })}
        build={(v) => reprFrames(readG(v, true, 8))}
      />
    </>
  );
}

const degQ: QGen = (rng) => {
  const directed = rng.chance(0.4);
  const n = rng.int(4, 7);
  const g = G.randomGraph(rng, n, rng.int(n, n + 4), { directed });
  const scene = G.graphStatic(g, false);
  const v = rng.int(0, n - 1);
  if (!directed) return num(`Degree of vertex ${v}?`, G.adjList(g)[v].length, `Edges incident on ${v}: ${G.adjList(g)[v].length}.`, { scene });
  const inn = g.edges.filter((e) => e.v === v).length;
  return rng.chance(0.5) ? num(`In-degree of vertex ${v}?`, inn, `Edges entering ${v}: ${inn}.`, { scene }) : num(`Out-degree of vertex ${v}?`, G.adjList(g)[v].length, `Edges leaving ${v}: ${G.adjList(g)[v].length}.`, { scene });
};
const rowQ: QGen = (rng) => {
  const directed = rng.chance(0.5);
  const n = rng.int(4, 6);
  const g = G.randomGraph(rng, n, rng.int(n, n + 3), { directed });
  const i = rng.int(0, n - 1);
  return seq(`Write row ${i} of the adjacency matrix (columns 0…${n - 1}).`, G.adjMatrix(g)[i], `Row ${i}: ${G.adjMatrix(g)[i].join(' ')}.`, { scene: G.graphStatic(g, false) });
};
const countQ: QGen = (rng) => {
  const n = rng.int(4, 30);
  const k = rng.int(0, 3);
  if (k === 0) return num(`Edges in the complete undirected graph on ${n} vertices?`, (n * (n - 1)) / 2, 'n(n − 1)/2.');
  if (k === 1) return num(`Maximum edges in a simple digraph on ${n} vertices?`, n * (n - 1), 'n(n − 1).');
  if (k === 2) {
    const e = rng.int(n, 3 * n);
    return num(`An undirected graph has ${e} edges. Sum of all vertex degrees?`, 2 * e, 'Handshaking lemma: 2e.');
  }
  return num(`A tree on ${n} vertices has how many edges?`, n - 1, 'Connected and acyclic ⇒ n − 1.');
};
const L38_BANK = [
  mcq('Space of an adjacency matrix for n vertices and e edges?', 'Θ(n²)', ['Θ(n + e)', 'Θ(e)', 'Θ(n·e)'], 'Independent of e.'),
  mcq('Space of adjacency lists?', 'Θ(n + e)', ['Θ(n²)', 'Θ(e²)', 'Θ(n log n)'], 'One header per vertex plus list nodes.'),
  mcq('Checking whether edge (u, v) exists is O(1) with…', 'an adjacency matrix', ['adjacency lists', 'an incidence matrix', 'adjacency multilists'], 'Direct indexing.'),
  mcq('A multigraph allows…', 'several edges between the same pair (and possibly self-loops)', ['only directed edges', 'only weighted edges', 'no cycles'], 'H–S\'s "graphs" exclude these.'),
  mcq('The adjacency matrix of an undirected graph is…', 'symmetric', ['upper triangular', 'the identity', 'always sparse'], 'A[i][j] = A[j][i].'),
  mcq('A digraph is strongly connected if…', 'there is a directed path from every vertex to every other vertex', ['its underlying undirected graph is connected', 'it has no cycles', 'every vertex has out-degree 1'], 'Paths in both directions.'),
  mcq('In H–S adjacency multilists, each undirected edge is stored…', 'once, in a node shared by both endpoints\' lists', ['twice', 'only in the smaller vertex\'s list', 'in a matrix'], 'With a mark bit to avoid processing twice.'),
  tf('A connected undirected graph with n vertices and n − 1 edges is a tree.', true, 'Connected + n − 1 edges ⇒ acyclic.'),
];

const L38: Level = {
  id: 'L38',
  n: 38,
  world: 9,
  title: 'Graphs & Representations',
  blurb: 'Vertices, edges, digraphs, multigraphs, degrees and connectivity, and the adjacency matrix / lists / multilists trade-offs.',
  syllabus: ['DS U5 · Terminology and representations', 'DS U5 · Graphs & multigraphs, directed graphs'],
  snippets: [],
  Lesson: L38Lesson,
  quiz: [degQ, degQ, rowQ, rowQ, countQ, countQ, bank(L38_BANK), bank(L38_BANK)],
  cards: [
    { q: 'Handshaking lemma?', a: 'Σ deg = 2e (undirected); Σ in = Σ out = e (directed).' },
    { q: 'Matrix vs lists space?', a: 'Θ(n²) vs Θ(n + e).' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C — chapter "Graphs": the graph ADT, definitions, representations (matrix, lists, multilists).', 'Cormen et al., Introduction to Algorithms 3e — §22.1 Representations of graphs.'],
};

/* =====================================================================
   Level 39 — DFS, BFS, connected components
   ===================================================================== */

function L39Lesson() {
  return (
    <>
      <Sec title="Depth-first search">
        <p>
          Visit the start vertex, then recursively visit each unvisited neighbour — go as deep as possible before backing up. The recursion stack (or an explicit
          stack) remembers where to return. With adjacency lists DFS is O(n + e); with a matrix O(n²).
        </p>
      </Sec>
      <Sec title="Breadth-first search">
        <p>
          Visit the start, then all its neighbours, then their unvisited neighbours… level by level, using a <b>queue</b>. Mark a vertex when it is{' '}
          <i>enqueued</i> so it is never enqueued twice. BFS finds shortest paths (fewest edges) in unweighted graphs. Also O(n + e) with lists.
        </p>
        <Code id="graph_traversal" />
        <Callout kind="convention">
          <p>
            Traversal orders depend on the order of each adjacency list. The game (like most exam answers) assumes neighbours are taken in <b>increasing</b> vertex
            order. If your question lists edges in a particular order and builds lists by inserting at the front (as Horowitz–Sahni's adjacency lists do), the
            order can differ — follow the stated representation.
          </p>
        </Callout>
      </Sec>
      <AlgoViz title="Depth-first search" fields={gFields(7, '0-1, 0-2, 1-3, 1-4, 2-5, 2-6, 4-5', { source: 0 })} build={(v) => G.traversalFrames(readG(v, false), int(v.s, 'source', 0, 9), 'dfs')} code="graph_traversal" />
      <AlgoViz title="Breadth-first search" fields={gFields(7, '0-1, 0-2, 1-3, 1-4, 2-5, 2-6, 4-5', { source: 0 })} build={(v) => G.traversalFrames(readG(v, false), int(v.s, 'source', 0, 9), 'bfs')} code="graph_traversal" />
      <Sec title="Spanning trees and connected components">
        <p>
          The edges used to reach new vertices form a <b>DFS spanning tree</b> or <b>BFS spanning tree</b> (green). If one traversal doesn't reach every vertex,
          start a new traversal from an unvisited vertex: each traversal discovers one <b>connected component</b> (Lab Experiment 4). Total time still O(n + e).
        </p>
      </Sec>
    </>
  );
}

function L39Practice() {
  return (
    <>
      <AlgoViz title="Predict the DFS order" fields={gFields(7, '0-1, 0-3, 1-2, 1-4, 3-4, 4-5, 5-6, 2-6', { source: 0 })} build={(v) => G.traversalFrames(readG(v, false), int(v.s, 'source', 0, 9), 'dfs', true)} code="graph_traversal" predict />
      <AlgoViz title="Predict the BFS order" fields={gFields(7, '0-1, 0-3, 1-2, 1-4, 3-4, 4-5, 5-6, 2-6', { source: 0 })} build={(v) => G.traversalFrames(readG(v, false), int(v.s, 'source', 0, 9), 'bfs', true)} code="graph_traversal" predict />
    </>
  );
}

const travQ: QGen = (rng) => {
  const n = rng.int(5, 7);
  const g = G.randomGraph(rng, n, rng.int(n, n + 3), { connected: true });
  const s = rng.int(0, n - 1);
  const kind = rng.pick(['DFS', 'BFS'] as const);
  const order = kind === 'DFS' ? G.dfsOrder(G.adjList(g), s) : G.bfsOrder(G.adjList(g), s);
  return seq(`${kind} from vertex ${s} (neighbours in increasing order). Write the visiting order.`, order, `${kind}: ${order.join(' ')}.`, { scene: G.graphStatic(g, false) });
};
const compQ: QGen = (rng) => {
  const n = rng.int(6, 9);
  const g = G.randomGraph(rng, n, rng.int(2, n - 1));
  const c = G.components(G.adjList(g)).length;
  return num('How many connected components does this graph have?', c, `Repeated DFS finds ${c} component(s).`, { scene: G.graphStatic(g, false) });
};
const L39_BANK = [
  mcq('BFS uses which data structure?', 'Queue', ['Stack', 'Priority queue', 'Hash table'], 'FIFO gives level-by-level order.'),
  mcq('DFS time with adjacency lists?', 'O(n + e)', ['O(n²)', 'O(e log n)', 'O(n·e)'], 'Each vertex and edge handled a constant number of times.'),
  mcq('DFS time with an adjacency matrix?', 'O(n²)', ['O(n + e)', 'O(e)', 'O(n log n)'], 'Scanning a row costs n.'),
  mcq('Which traversal finds shortest paths (fewest edges) in an unweighted graph?', 'BFS', ['DFS', 'Inorder', 'Topological sort'], 'Vertices are reached in order of distance.'),
  mcq('In BFS, a vertex should be marked visited when it is…', 'enqueued', ['dequeued', 'printed twice', 'never'], 'Prevents duplicates in the queue.'),
  mcq('Running DFS from every unvisited vertex in turn counts…', 'connected components', ['edges', 'cycles', 'bridges'], 'One traversal per component.'),
  tf('The DFS and BFS spanning trees of a connected graph always coincide.', false, 'They usually differ.'),
];

const L39: Level = {
  id: 'L39',
  n: 39,
  world: 9,
  title: 'DFS, BFS & Components',
  blurb: 'Depth-first and breadth-first search with exact visiting orders, spanning trees, and counting connected components (Lab Experiment 4).',
  syllabus: ['DS U5 · Traversal of graphs', 'DAA U2 · Connected components'],
  snippets: ['graph_traversal'],
  Lesson: L39Lesson,
  Practice: L39Practice,
  quiz: [travQ, travQ, travQ, travQ, compQ, compQ, bank(L39_BANK), bank(L39_BANK)],
  cards: [{ q: 'DFS vs BFS structure and cost?', a: 'DFS: recursion/stack; BFS: queue (mark on enqueue). Both O(n + e) with lists.' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C — chapter "Graphs": elementary graph operations (dfs, bfs, connected components, spanning trees).', 'Cormen et al., Introduction to Algorithms 3e — §22.2 BFS, §22.3 DFS.', 'DAA Lab Manual — Experiment 4.'],
};

/* =====================================================================
   Level 40 — Cut vertices and bridges
   ===================================================================== */

function L40Lesson() {
  return (
    <>
      <Sec title="Single points of failure">
        <p>
          In a connected undirected graph, a <b>cut vertex</b> (articulation point) is a vertex whose deletion (with its edges) disconnects the graph; a{' '}
          <b>bridge</b> is an edge whose deletion disconnects it. A connected graph with no cut vertex is <b>biconnected</b>. Think of routers or roads whose
          failure splits a network.
        </p>
      </Sec>
      <Sec title="Tarjan's DFS method (Lab Experiment 5)">
        <p>Run one DFS. Number vertices in discovery order disc[u], and compute</p>
        <F>low[u] = min( disc[u], disc[w] for back edges u–w, low[c] for DFS children c )</F>
        <ul>
          <li>The <b>root</b> is a cut vertex iff it has ≥ 2 DFS children.</li>
          <li>
            A non-root u is a cut vertex iff some child v has <b>low[v] ≥ disc[u]</b> — v's subtree can't reach above u without u.
          </li>
          <li>
            Tree edge u–v is a bridge iff <b>low[v] &gt; disc[u]</b> — v's subtree can't even reach u by another route.
          </li>
        </ul>
        <Code id="articulation" />
        <p>One DFS: O(n + e). Brute force (delete each vertex and re-check connectivity) is O(n(n + e)).</p>
        <Callout kind="convention">
          <p>Horowitz–Sahni's dfn/low use the same idea (dfn = disc). Some books start numbering at 0; the comparisons are unchanged.</p>
        </Callout>
      </Sec>
      <AlgoViz title="Find cut vertices and bridges" fields={gFields(7, '0-1, 1-2, 2-0, 1-3, 3-4, 4-5, 5-3, 4-6')} build={(v) => G.articulationFrames(readG(v, false))} code="articulation" />
    </>
  );
}

const apQ: QGen = (rng) => {
  const n = rng.int(5, 8);
  const g = G.randomGraph(rng, n, rng.int(n - 1, n + 2), { connected: true });
  const t = G.tarjan(g);
  return rng.chance(0.55)
    ? seq('List all cut vertices (articulation points) in increasing order (write none if there are none).', t.cut.length ? t.cut : ['none'], `Cut vertices: ${t.cut.join(', ') || 'none'}.`, { scene: G.graphStatic(g, false) })
    : num('How many bridges does this graph have?', t.bridges.length, `Bridges: ${t.bridges.map(([a, b]) => `${a}–${b}`).join(', ') || 'none'}.`, { scene: G.graphStatic(g, false) });
};
const lowQ: QGen = (rng) => {
  const n = rng.int(5, 7);
  const g = G.randomGraph(rng, n, rng.int(n, n + 2), { connected: true });
  const t = G.tarjan(g);
  const v = rng.int(0, n - 1);
  return num(`DFS from vertex 0 (neighbours in increasing order), disc numbered from 1. What is low[${v}]?`, t.low[v], `disc = [${t.disc.join(', ')}], low = [${t.low.join(', ')}].`, { scene: G.graphStatic(g, false) });
};
const L40_BANK = [
  mcq('A non-root vertex u is a cut vertex iff it has a DFS child v with…', 'low[v] ≥ disc[u]', ['low[v] < disc[u]', 'disc[v] > disc[u]', 'low[u] = 1'], 'v\'s subtree cannot bypass u.'),
  mcq('The DFS root is a cut vertex iff…', 'it has at least two DFS children', ['it has degree ≥ 2', 'low[root] = 1', 'it lies on a cycle'], 'Its subtrees only connect through it.'),
  mcq('Tree edge u–v is a bridge iff…', 'low[v] > disc[u]', ['low[v] ≥ disc[u]', 'low[u] > disc[v]', 'disc[v] = disc[u] + 1'], 'Strict inequality.'),
  mcq('A connected graph with no cut vertices is…', 'biconnected', ['a tree', 'complete', 'bipartite'], 'Removing any one vertex leaves it connected.'),
  mcq('Time of Tarjan\'s algorithm with adjacency lists?', 'O(n + e)', ['O(n²)', 'O(n·e)', 'O(e log n)'], 'One DFS.'),
  mcq('In a tree with at least 3 vertices, the cut vertices are…', 'all non-leaf vertices', ['only the root', 'the leaves', 'none'], 'Removing an internal vertex separates its subtrees.'),
  tf('Every edge of a tree is a bridge.', true, 'Trees have no cycles.'),
];

const L40: Level = {
  id: 'L40',
  n: 40,
  world: 9,
  title: 'Cut Vertices & Bridges',
  blurb: 'Articulation points and bridges via one DFS: discovery numbers, low values, the root rule, and why the ≥ vs > matters (Lab Experiment 5).',
  syllabus: ['DAA U2 · Cut vertex, bridge', 'DS U5 · Graph traversal applications'],
  snippets: ['articulation'],
  Lesson: L40Lesson,
  quiz: [apQ, apQ, apQ, lowQ, lowQ, bank(L40_BANK), bank(L40_BANK), bank(L40_BANK)],
  cards: [{ q: 'Cut vertex / bridge tests?', a: 'Non-root u: child v with low[v] ≥ disc[u]. Root: ≥ 2 children. Bridge u–v: low[v] > disc[u].' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C — chapter "Graphs": biconnected components (dfn, low, articulation points).', 'Tarjan, "Depth-first search and linear graph algorithms", SIAM J. Computing 1(2), 1972.', 'DAA Lab Manual — Experiment 5.'],
};

/* =====================================================================
   Level 41 — Disjoint sets
   ===================================================================== */

function parseDsu(s: string, n: number): G.DsuOp[] {
  const parts = s.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 14) throw new Error('At most 14 operations.');
  return parts.map((p) => {
    const m = /^(union|unite|u)\s*\(?\s*(\d+)\s*[\s,]\s*(\d+)\s*\)?$/i.exec(p) ?? /^(union|unite|u)\s+(\d+)\s+(\d+)$/i.exec(p);
    if (m) {
      const a = +m[2];
      const b = +m[3];
      if (a >= n || b >= n) throw new Error(`Elements are 0..${n - 1}.`);
      return { k: 'u', a, b };
    }
    const f = /^(find|f)\s*\(?\s*(\d+)\s*\)?$/i.exec(p);
    if (f) {
      if (+f[2] >= n) throw new Error(`Elements are 0..${n - 1}.`);
      return { k: 'f', x: +f[2] };
    }
    throw new Error(`Can't read "${p}" — use union a b or find x.`);
  });
}

function L41Lesson() {
  return (
    <>
      <Sec title="Disjoint-set (union–find)">
        <p>
          Keep a collection of non-overlapping sets supporting <b>find(x)</b> (which set is x in?) and <b>union(a, b)</b> (merge their sets). Your deck's use:
          deciding whether an edge joins two different components — exactly what Kruskal's algorithm and cycle detection need.
        </p>
        <p>
          Represent each set as a tree in a <code>parent[]</code> array; the root names the set (parent[root] = root). Two heuristics keep trees flat:
        </p>
        <ul>
          <li>
            <b>Union by size</b> (or by rank): attach the smaller tree under the root of the larger — "the root of the larger tree becomes the root" (your deck).
            Tree height stays ≤ log₂ n.
          </li>
          <li>
            <b>Path compression</b>: during find, point every node on the path directly at the root.
          </li>
        </ul>
        <p>With both, m operations take O(m · α(n)) — α is the inverse Ackermann function, below 5 for any practical n.</p>
        <Code id="disjoint_set" />
      </Sec>
      <AlgoViz
        title="Union and find"
        fields={[
          { name: 'n', label: 'elements', initial: '8', width: 80 },
          { name: 'ops', label: 'operations', initial: 'union 0 1, union 2 3, union 4 5, union 6 7, union 1 3, union 5 7, union 3 7, find 6', width: 440 },
        ]}
        build={(v) => {
          const n = int(v.n, 'elements', 2, 10);
          return G.dsuFrames(n, parseDsu(v.ops, n));
        }}
        code="disjoint_set"
      />
      <Callout kind="daa">
        <p>
          Cycle detection in an undirected graph: for each edge (u, v), if find(u) == find(v) the edge closes a cycle; otherwise union them. That is your deck's
          worked example.
        </p>
      </Callout>
    </>
  );
}

const dsuQ: QGen = (rng) => {
  const n = rng.int(6, 8);
  const d = new G.DSU(n);
  const ops: string[] = [];
  for (let k = rng.int(4, 6); k > 0; k--) {
    const a = rng.int(0, n - 1);
    const b = rng.int(0, n - 1);
    d.unite(a, b);
    ops.push(`union(${a}, ${b})`);
  }
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const x = rng.int(0, n - 1);
    const dd = new G.DSU(n);
    ops.forEach((o) => {
      const [a, b] = o.match(/\d+/g)!.map(Number);
      dd.unite(a, b);
    });
    return num(`Elements 0…${n - 1}, union by size (on a tie, the second root goes under the first) with path compression: ${ops.join(', ')}. find(${x}) = ?`, dd.find(x), `Root of ${x}'s set: ${dd.find(x)}.`);
  }
  if (kind === 1) {
    const sets = new Set([...Array(n).keys()].map((x) => d.find(x))).size;
    return num(`Elements 0…${n - 1}: ${ops.join(', ')}. How many disjoint sets remain?`, sets, `${sets} set(s).`);
  }
  return seq(`Elements 0…${n - 1}, union by size (tie: second root under the first), path compression only inside find: ${ops.join(', ')}. Write the parent array.`, d.parent, `parent = [${d.parent.join(', ')}].`);
};
const cycleQ: QGen = (rng) => {
  const n = rng.int(5, 7);
  const g = G.randomGraph(rng, n, rng.int(n - 1, n + 2));
  const d = new G.DSU(n);
  let first: G.Edge | null = null;
  for (const e of g.edges)
    if (!d.unite(e.u, e.v)) {
      first = e;
      break;
    }
  const ans = first ? `${first.u}-${first.v}` : 'none';
  return mcq(`Process the edges in this order with union–find: ${g.edges.map((e) => `${e.u}-${e.v}`).join(', ')}. Which edge is the first to close a cycle?`, ans, [...new Set(['none', ...g.edges.map((e) => `${e.u}-${e.v}`)])].filter((x) => x !== ans).slice(0, 3), first ? `When ${ans} arrives, both ends already have the same root.` : 'Every edge joined two different sets — no cycle.');
};
const L41_BANK = [
  mcq('With union by size alone, the height of any tree is at most…', 'log₂ n', ['n', '√n', '1'], 'A node\'s depth grows only when its tree at least doubles.'),
  mcq('Path compression happens during…', 'find', ['union only', 'makeSet', 'never in practice'], 'Every node on the find path is re-pointed to the root.'),
  mcq('Amortised cost per operation with both heuristics?', 'O(α(n)), effectively constant', ['O(log n)', 'O(n)', 'O(1) worst case'], 'α = inverse Ackermann.'),
  mcq('In Kruskal\'s algorithm union–find is used to…', 'reject edges whose endpoints are already connected', ['sort the edges', 'find the minimum key', 'compute distances'], 'Prevents cycles.'),
  mcq('Initially, makeSet(n) sets…', 'parent[i] = i for every i', ['parent[i] = 0', 'parent[i] = −1 for all but one', 'parent[i] = i + 1'], 'Each element is its own root.'),
  tf('find(x) == find(y) means x and y are in the same set.', true, 'Same root.'),
];

const L41: Level = {
  id: 'L41',
  n: 41,
  world: 9,
  title: 'Disjoint Sets (Union–Find)',
  blurb: 'Sets as trees in a parent array, union by size, path compression, near-constant time, and cycle detection as in your deck.',
  syllabus: ['DAA U3 · (supports) Kruskal\'s algorithm — deck 16 Disjoint set'],
  snippets: ['disjoint_set'],
  Lesson: L41Lesson,
  quiz: [dsuQ, dsuQ, dsuQ, cycleQ, cycleQ, bank(L41_BANK), bank(L41_BANK)],
  cards: [{ q: 'findSet with path compression?', a: 'if (parent[x] != x) parent[x] = findSet(parent[x]); return parent[x];' }],
  refs: ['Your DAA deck "16. disjoint set".', 'Cormen et al., Introduction to Algorithms 3e — Ch. 21 Data structures for disjoint sets.', 'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C — chapter "Trees": set representation (weighted union, collapsing find).'],
};

/* =====================================================================
   Level 42 — Minimum spanning trees
   ===================================================================== */

function L42Lesson() {
  return (
    <>
      <Sec title="Spanning trees and the MST">
        <p>
          A <b>spanning tree</b> of a connected graph is a subgraph that is a tree containing every vertex (n − 1 edges). Among all spanning trees of a weighted
          graph, a <b>minimum spanning tree</b> has the least total weight. Both algorithms below are greedy and rely on the <b>cut property</b>: the lightest
          edge crossing any cut belongs to some MST. Your deck: the graph must be weighted, connected and undirected.
        </p>
      </Sec>
      <Sec title="Kruskal: grow a forest">
        <p>Sort edges by weight; take each edge unless it would form a cycle (union–find check); stop at n − 1 edges.</p>
        <Code id="kruskal" />
        <p>
          Time: O(E log E) for the sort (= O(E log V) since E ≤ V²), plus near-linear union–find. Lab Experiment 8.
        </p>
        <Callout kind="convention" title="About the deck's Kruskal time">
          <p>
            The deck's "E + (V − 1) log E" is the heap variant: build a min-heap of edges in O(E), then extract until V − 1 edges are accepted. If few edges are
            rejected that is about V log E; but rejected edges cost extractions too, so the worst case is E log E — the same as sorting first. Quote O(E log E)
            (= O(E log V)) as Kruskal's running time.
          </p>
        </Callout>
      </Sec>
      <AlgoViz title="Kruskal's algorithm" fields={gFields(6, '0-1:4, 0-2:4, 1-2:2, 2-3:3, 2-5:2, 2-4:4, 3-4:3, 4-5:3', { weighted: true })} build={(v) => G.kruskalFrames(readG(v, false))} code="kruskal" />
      <Sec title="Prim: grow one tree">
        <p>
          Start from a vertex; repeatedly add the cheapest edge leaving the tree. Keep key[v] = cheapest edge from the tree to v and π[v] = the tree endpoint. The
          array version is O(V²) (best for dense graphs); with a binary-heap priority queue, as in your deck, O(E log V).
        </p>
        <Code id="prim" />
      </Sec>
      <AlgoViz title="Prim's algorithm" fields={gFields(6, '0-1:4, 0-2:4, 1-2:2, 2-3:3, 2-5:2, 2-4:4, 3-4:3, 4-5:3', { weighted: true })} build={(v) => G.primFrames(readG(v, false))} code="prim" />
      <Table
        head={['', 'Kruskal', 'Prim']}
        rows={[
          ['Grows', 'a forest of components', 'a single tree'],
          ['Data structure', 'sorted edges + union–find', 'key array or min-heap'],
          ['Time', 'O(E log E)', 'O(V²) array · O(E log V) heap'],
          ['Better for', 'sparse graphs', 'dense graphs (array version)'],
        ]}
      />
    </>
  );
}

function L42Practice() {
  return (
    <>
      <AlgoViz title="Take or reject? (Kruskal)" fields={gFields(6, '0-1:7, 0-3:5, 1-2:8, 1-3:9, 1-4:7, 2-4:5, 3-4:15, 3-5:6, 4-5:8', { weighted: true })} build={(v) => G.kruskalFrames(readG(v, false), true)} code="kruskal" predict />
      <AlgoViz title="Which vertex joins next? (Prim)" fields={gFields(6, '0-1:7, 0-3:5, 1-2:8, 1-3:9, 1-4:7, 2-4:5, 3-4:15, 3-5:6, 4-5:8', { weighted: true })} build={(v) => G.primFrames(readG(v, false), true)} code="prim" predict />
    </>
  );
}

const mstQ: QGen = (rng) => {
  const n = rng.int(5, 6);
  const g = G.randomGraph(rng, n, rng.int(n + 1, n + 4), { connected: true, wmin: 1, wmax: 12 });
  const k = rng.int(0, 2);
  const scene = G.graphStatic(g);
  const r = G.kruskal(g);
  if (k === 0) return num('Total weight of a minimum spanning tree of this graph?', r.total, `MST edges: ${r.mst.map((e) => `${e.u}–${e.v}(${e.w})`).join(', ')}; total ${r.total}.`, { scene });
  if (k === 1) return seq(`Edges: ${G.graphText(g, true)}. Run Kruskal (stable sort: equal weights keep this order). Write the weights of the accepted edges in acceptance order.`, r.mst.map((e) => e.w), `Accepted: ${r.mst.map((e) => `${e.u}–${e.v}(${e.w})`).join(', ')}.`, { scene });
  const p = G.prim(g);
  return seq("Prim's algorithm from vertex 0 (ties → smaller vertex). Write the order in which vertices join the tree.", p.order, `Order: ${p.order.join(' ')}.`, { scene });
};
const L42_BANK = [
  mcq('A spanning tree of a connected graph with n vertices has…', 'n − 1 edges', ['n edges', 'n(n − 1)/2 edges', 'at most n/2 edges'], 'A tree on n vertices.'),
  mcq('Kruskal\'s algorithm processes edges…', 'in increasing order of weight', ['in BFS order', 'from a starting vertex outward', 'in decreasing order of weight'], 'Global greedy.'),
  mcq('Prim\'s algorithm with an adjacency matrix and key array runs in…', 'O(V²)', ['O(E log V)', 'O(E log E)', 'O(V³)'], 'n rounds of an O(n) scan.'),
  mcq('Kruskal\'s running time is dominated by…', 'sorting the edges: O(E log E)', ['union–find: O(V²)', 'DFS: O(V + E)', 'nothing — it is linear'], 'Union–find is nearly linear.'),
  mcq('If all edge weights are distinct, the MST is…', 'unique', ['not unique', 'always a path', 'a star'], 'Standard theorem.'),
  mcq('Which property justifies greedy MST algorithms?', 'The cut property: the lightest edge crossing a cut is in some MST', ['Optimal substructure only', 'The triangle inequality', 'Bellman\'s principle'], 'Both algorithms add a lightest crossing edge.'),
  mcq('Difference between Prim and Dijkstra (your deck)?', 'Prim\'s key is the edge weight to the tree; Dijkstra\'s is the total distance from the source', ['None', 'Prim needs negative weights', 'Dijkstra finds an MST'], 'Same skeleton, different key.'),
  tf('Kruskal\'s algorithm can produce a minimum spanning forest on a disconnected graph.', true, 'It just never reaches n − 1 edges.'),
];

const L42: Level = {
  id: 'L42',
  n: 42,
  world: 9,
  title: 'Minimum Spanning Trees',
  blurb: 'Spanning trees, the cut property, Kruskal with union–find and Prim with keys — exact edge and vertex orders, and their running times.',
  syllabus: ['DS U5 · Spanning trees', 'DAA U3 · Minimum cost spanning tree: Kruskal, Prim'],
  snippets: ['kruskal', 'prim'],
  Lesson: L42Lesson,
  Practice: L42Practice,
  quiz: [mstQ, mstQ, mstQ, mstQ, bank(L42_BANK), bank(L42_BANK), bank(L42_BANK)],
  cards: [
    { q: 'Kruskal in one line?', a: 'Sort edges; take each edge whose ends are in different sets (union–find); stop at n − 1.' },
    { q: 'Prim in one line?', a: 'Repeatedly add the non-tree vertex with the smallest key; update neighbours\' keys.' },
  ],
  refs: ['Your DAA deck "17. greedy" (spanning tree, Kruskal, Prim, time analysis).', 'Cormen et al., Introduction to Algorithms 3e — Ch. 23 Minimum spanning trees.', 'DAA Lab Manual — Experiment 8.'],
};

export default [L38, L39, L40, L41, L42];
