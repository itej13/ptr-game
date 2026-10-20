import type { Level, QGen } from '../core/types';
import { Sec, Callout, Table, F, Code } from '../core/lesson';
import { AlgoViz, int } from '../core/vizkit';
import { mcq, num, seq, tf, bank } from '../core/qhelp';
import * as G from '../engines/graphs';
import { gFields, readG } from './w09a';

/* =====================================================================
   Level 43 — Dijkstra
   ===================================================================== */

function L43Lesson() {
  return (
    <>
      <Sec title="Single-source shortest paths">
        <p>
          Given a weighted graph and a source s, find the shortest-path distance from s to every vertex. <b>Relaxation</b> is the basic step: for an edge u → v
          with weight w, if dist[u] + w &lt; dist[v], set dist[v] = dist[u] + w and π[v] = u.
        </p>
      </Sec>
      <Sec title="Dijkstra's algorithm (non-negative weights)">
        <p>
          Keep a set of finished vertices. Repeatedly finish the unfinished vertex with the smallest tentative dist and relax its outgoing edges. Because no weight
          is negative, no later path can be shorter than that vertex's current dist — it is final. Following π backwards gives the actual paths (a shortest-path
          tree).
        </p>
        <Code id="dijkstra" />
        <Table
          head={['Implementation', 'Time']}
          rows={[
            ['Array scan for the minimum (adjacency matrix)', 'O(V²)'],
            ['Binary-heap priority queue (as in the code / your deck)', 'O((V + E) log V)'],
          ]}
        />
        <Callout kind="pitfall">
          <p>
            A single negative edge can break Dijkstra: a vertex finalised early may later have a shorter route through the negative edge. Use Bellman–Ford (next
            level) for negative weights.
          </p>
        </Callout>
      </Sec>
      <AlgoViz title="Dijkstra" fields={gFields(6, '0>1:7, 0>2:9, 0>5:14, 1>2:10, 1>3:15, 2>3:11, 2>5:2, 5>4:9, 3>4:6', { directed: true, weighted: true, source: 0 })} build={(v) => G.dijkstraFrames(readG(v, true), int(v.s, 'source', 0, 9))} code="dijkstra" />
      <Callout kind="daa">
        <p>
          Dijkstra vs Prim (your deck): identical skeleton — pick the minimum key, then update neighbours — but Dijkstra's key is the whole distance from the source,
          Prim's is just the connecting edge weight. Lab Experiment 9.
        </p>
      </Callout>
    </>
  );
}

function L43Practice() {
  return <AlgoViz title="Predict which vertex is finalised next" fields={gFields(6, '0>1:4, 0>2:2, 2>1:1, 1>3:5, 2>3:8, 2>4:10, 3>4:2, 3>5:6, 4>5:2', { directed: true, weighted: true, source: 0 })} build={(v) => G.dijkstraFrames(readG(v, true), int(v.s, 'source', 0, 9), true)} code="dijkstra" predict />;
}

const dijQ: QGen = (rng) => {
  const n = rng.int(5, 6);
  const directed = rng.chance(0.6);
  const g = G.randomGraph(rng, n, rng.int(n + 1, n + 4), { directed, connected: true, wmin: 1, wmax: 12 });
  const s = 0;
  const r = G.dijkstra(g, s);
  const scene = G.graphStatic(g);
  const reach = [...Array(n).keys()].filter((v) => r.dist[v] < Infinity && v !== s);
  if (rng.chance(0.5) && reach.length) {
    const v = rng.pick(reach);
    return num(`Shortest distance from ${s} to ${v}?`, r.dist[v], `Distances: ${r.dist.map((d, i) => `${i}:${d === Infinity ? '∞' : d}`).join(' ')}.`, { scene });
  }
  return seq(`Dijkstra from ${s} (ties → smaller vertex). Write the order in which vertices are finalised (reachable ones only).`, r.order, `Order: ${r.order.join(' ')}.`, { scene });
};
const L43_BANK = [
  mcq('Dijkstra\'s algorithm requires…', 'non-negative edge weights', ['a DAG', 'unit weights', 'an undirected graph'], 'Negative edges break the "final when extracted" argument.'),
  mcq('Time of Dijkstra with a binary heap?', 'O((V + E) log V)', ['O(V²)', 'O(VE)', 'O(E)'], 'Each relaxation may push into the heap.'),
  mcq('Time of Dijkstra with an array and adjacency matrix?', 'O(V²)', ['O(E log V)', 'O(V³)', 'O(V + E)'], 'V minimum scans of length V.'),
  mcq('Relaxing edge u → v (weight w) means…', 'if dist[u] + w < dist[v] then dist[v] = dist[u] + w', ['dist[v] = dist[u] + w always', 'dist[u] = dist[v] − w', 'removing the edge'], 'The core update.'),
  mcq('The π (predecessor) array lets you…', 'recover the actual shortest paths', ['detect negative cycles', 'sort the vertices', 'compute the MST'], 'Follow π back to the source.'),
  tf('Dijkstra on an undirected graph treats every edge as two directed edges.', true, 'Each direction can be relaxed.'),
];

const L43: Level = {
  id: 'L43',
  n: 43,
  world: 9,
  title: "Dijkstra's Shortest Paths",
  blurb: 'Relaxation, finalising the closest vertex, why negative edges break it, array vs heap versions, and recovering paths with π (Lab Experiment 9).',
  syllabus: ['DS U5 · Shortest path', "DAA U3 · Dijkstra's algorithm"],
  snippets: ['dijkstra'],
  Lesson: L43Lesson,
  Practice: L43Practice,
  quiz: [dijQ, dijQ, dijQ, dijQ, bank(L43_BANK), bank(L43_BANK), bank(L43_BANK)],
  cards: [{ q: 'Dijkstra loop?', a: 'Pop (d, u) with smallest d; skip if stale; relax every edge u→v: if dist[u]+w < dist[v] update and push.' }],
  refs: ['Your DAA deck "17. greedy" (Dijkstra, edge relaxation, comparison with Prim).', 'Cormen et al., Introduction to Algorithms 3e — §24.3 Dijkstra\'s algorithm.', 'DAA Lab Manual — Experiment 9.'],
};

/* =====================================================================
   Level 44 — Bellman–Ford
   ===================================================================== */

function L44Lesson() {
  return (
    <>
      <Sec title="Negative weights allowed">
        <p>
          A shortest path has at most n − 1 edges (if it repeated a vertex it would contain a cycle; a non-negative cycle can be dropped). So relax <b>every</b>{' '}
          edge n − 1 times: after round i, every shortest path with ≤ i edges is correct. One more round detects trouble: if anything still improves, a{' '}
          <b>negative-weight cycle</b> is reachable and "shortest path" is undefined (you could loop forever).
        </p>
        <Code id="bellman_ford" />
        <p>Time O(V·E). It is really dynamic programming: d⁽ⁱ⁾[v] = min(d⁽ⁱ⁻¹⁾[v], min over u→v of d⁽ⁱ⁻¹⁾[u] + w). Lab Experiment 10.</p>
        <Callout kind="convention">
          <p>
            Within a round the code updates dist in place, so a change can propagate further in the same round — intermediate tables depend on edge order. The final
            distances do not. Exam tables that show d⁽¹⁾, d⁽²⁾, … usually use the "previous round only" (DP) version; both converge to the same answer.
          </p>
        </Callout>
      </Sec>
      <AlgoViz title="Bellman–Ford" fields={gFields(5, '0>1:6, 0>2:7, 1>2:8, 1>3:5, 1>4:-4, 2>3:-3, 2>4:9, 3>1:-2, 4>3:7, 4>0:2', { directed: true, weighted: true, source: 0, wmin: -3 })} build={(v) => G.bellmanFordFrames(readG(v, true), int(v.s, 'source', 0, 9))} code="bellman_ford" />
      <AlgoViz title="…and with a negative cycle" fields={gFields(4, '0>1:1, 1>2:-1, 2>3:-1, 3>1:-1', { directed: true, weighted: true, source: 0, wmin: -3 })} build={(v) => G.bellmanFordFrames(readG(v, true), int(v.s, 'source', 0, 9))} code="bellman_ford" />
    </>
  );
}

const bfQ: QGen = (rng) => {
  for (;;) {
    const n = rng.int(4, 6);
    const g = G.randomGraph(rng, n, rng.int(n, n + 3), { directed: true, connected: true, wmin: -3, wmax: 9 });
    const r = G.bellmanFord(g, 0);
    const scene = G.graphStatic(g);
    if (rng.chance(0.25)) return mcq('Does Bellman–Ford from vertex 0 report a negative-weight cycle?', r.negCycle ? 'Yes' : 'No', [r.negCycle ? 'No' : 'Yes'], r.negCycle ? 'An edge can still be relaxed after n − 1 rounds.' : 'After n − 1 rounds nothing can be relaxed.', { scene });
    if (r.negCycle) continue;
    const reach = [...Array(n).keys()].filter((v) => v && r.dist[v] < Infinity);
    if (!reach.length) continue;
    const v = rng.pick(reach);
    return num(`Shortest distance from 0 to ${v} (negative edges allowed)?`, r.dist[v], `Bellman–Ford distances: ${r.dist.map((d, i) => `${i}:${d === Infinity ? '∞' : d}`).join(' ')}.`, { scene });
  }
};
const L44_BANK = [
  mcq('How many rounds of relaxing all edges does Bellman–Ford perform?', 'V − 1', ['V', 'E', 'log V'], 'A shortest simple path has at most V − 1 edges.'),
  mcq('Time of Bellman–Ford?', 'O(V·E)', ['O(E log V)', 'O(V²)', 'O(V + E)'], 'V − 1 rounds × E edges.'),
  mcq('How does Bellman–Ford detect a negative cycle?', 'An edge can still be relaxed after V − 1 rounds', ['A distance becomes 0', 'The queue empties', 'Two vertices get the same distance'], 'The extra check.'),
  mcq('Why can\'t shortest paths be defined when a negative cycle is reachable?', 'Going round the cycle again always makes the path shorter', ['Edges become undirected', 'The graph is disconnected', 'Dijkstra is faster'], 'No minimum exists.'),
  mcq('Bellman–Ford is best described as…', 'dynamic programming over path length', ['greedy', 'divide and conquer', 'backtracking'], 'Even though your DAA syllabus lists it under greedy.'),
  tf('Bellman–Ford works for graphs with negative edges but no negative cycles.', true, 'That is its purpose.'),
];

const L44: Level = {
  id: 'L44',
  n: 44,
  world: 9,
  title: 'Bellman–Ford',
  blurb: 'Shortest paths with negative edges: V − 1 rounds of relaxation, the extra round that detects negative cycles, and its DP view (Lab Experiment 10).',
  syllabus: ['DS U5 · Shortest path', 'DAA U3 · Bellman–Ford'],
  snippets: ['bellman_ford'],
  Lesson: L44Lesson,
  quiz: [bfQ, bfQ, bfQ, bfQ, bank(L44_BANK), bank(L44_BANK), bank(L44_BANK)],
  cards: [{ q: 'Bellman–Ford in two lines?', a: 'Repeat V−1 times: relax every edge. Then if any edge still relaxes → negative cycle.' }],
  refs: ['Cormen et al., Introduction to Algorithms 3e — §24.1 The Bellman–Ford algorithm.', 'Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C — chapter "Graphs": shortest paths, general weights.', 'DAA Lab Manual — Experiment 10.'],
};

/* =====================================================================
   Level 45 — Warshall transitive closure
   ===================================================================== */

function L45Lesson() {
  return (
    <>
      <Sec title="Transitive closure">
        <p>
          For a digraph with adjacency matrix A, the <b>transitive closure</b> A⁺ has A⁺[i][j] = 1 iff there is a path of length ≥ 1 from i to j; the{' '}
          <b>reflexive transitive closure</b> A* also counts the empty path (A*[i][i] = 1 always). In relation terms: the smallest transitive relation containing
          the edge relation.
        </p>
      </Sec>
      <Sec title="Warshall's algorithm">
        <p>
          Let R⁽ᵏ⁾[i][j] = 1 iff there is a path from i to j whose intermediate vertices all lie in {'{'}0, …, k{'}'}. A path either avoids k or goes i ⇝ k ⇝ j:
        </p>
        <F>R⁽ᵏ⁾[i][j] = R⁽ᵏ⁻¹⁾[i][j] OR ( R⁽ᵏ⁻¹⁾[i][k] AND R⁽ᵏ⁻¹⁾[k][j] )</F>
        <Code id="warshall" />
        <p>
          Three nested loops with k outermost: Θ(n³) time, done in place. The same pattern with + and min instead of AND and OR is Floyd–Warshall's all-pairs shortest
          paths (Level 51).
        </p>
        <Callout kind="pitfall">
          <p>k must be the OUTER loop. Putting i or j outermost gives wrong closures on some graphs.</p>
        </Callout>
      </Sec>
      <AlgoViz title="Warshall step by step" fields={gFields(4, '0>1, 1>3, 3>0, 2>3', { directed: true })} build={(v) => G.warshallFrames(readG(v, true, 7))} code="warshall" />
    </>
  );
}

const warQ: QGen = (rng) => {
  const n = rng.int(4, 5);
  const g = G.randomGraph(rng, n, rng.int(n - 1, n + 2), { directed: true });
  const R = G.warshall(G.adjMatrix(g));
  const i = rng.int(0, n - 1);
  if (rng.chance(0.6)) return seq(`Row ${i} of the transitive closure A⁺ (columns 0…${n - 1})?`, R[i], `Vertices reachable from ${i} by ≥ 1 edge: ${R[i].map((x, j) => (x ? j : null)).filter((x) => x !== null).join(', ') || 'none'}.`, { scene: G.graphStatic(g, false) });
  const ones = R.flat().reduce((s, x) => s + x, 0);
  return num('How many 1s are in the transitive closure matrix A⁺?', ones, `A⁺ = ${R.map((r) => r.join('')).join(' / ')}.`, { scene: G.graphStatic(g, false) });
};
const L45_BANK = [
  mcq('Warshall\'s algorithm runs in…', 'Θ(n³)', ['Θ(n²)', 'Θ(n + e)', 'Θ(n² log n)'], 'Three nested loops.'),
  mcq('The update in Warshall\'s algorithm is…', 'R[i][j] = R[i][j] || (R[i][k] && R[k][j])', ['R[i][j] = R[i][k] && R[k][j]', 'R[i][j] = min(R[i][j], R[i][k] + R[k][j])', 'R[i][j] = R[j][i]'], 'OR with a path through k.'),
  mcq('Which loop must be outermost?', 'k', ['i', 'j', 'any'], 'Phases add one allowed intermediate vertex at a time.'),
  mcq('A* (reflexive transitive closure) differs from A⁺ by…', 'setting every diagonal entry to 1', ['removing self loops', 'transposing', 'nothing'], 'Paths of length 0.'),
  mcq('Running BFS/DFS from every vertex also gives the transitive closure in…', 'O(n(n + e))', ['O(n³) always', 'O(e)', 'O(n log n)'], 'Better for sparse graphs.'),
  tf('Warshall\'s algorithm needs only O(1) extra space beyond the matrix.', true, 'It updates in place.'),
];

const L45: Level = {
  id: 'L45',
  n: 45,
  world: 9,
  title: "Warshall's Transitive Closure",
  blurb: 'Reachability for every pair: A⁺ vs A*, the k-phase recurrence, the in-place Θ(n³) triple loop, and its link to Floyd–Warshall.',
  syllabus: ['DS U5 · Transitive closure'],
  snippets: ['warshall'],
  Lesson: L45Lesson,
  quiz: [warQ, warQ, warQ, warQ, bank(L45_BANK), bank(L45_BANK)],
  cards: [{ q: 'Warshall recurrence?', a: 'R(k)[i][j] = R(k−1)[i][j] OR (R(k−1)[i][k] AND R(k−1)[k][j]); k outermost.' }],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C — chapter "Graphs": transitive closure (A⁺ and A*).', 'Warshall, "A theorem on Boolean matrices", J. ACM 9(1), 1962.'],
};

/* =====================================================================
   Level 46 — Activity networks: AOV topological sort, AOE critical path
   ===================================================================== */

function L46Lesson() {
  return (
    <>
      <Sec title="AOV networks and topological order">
        <p>
          An <b>activity-on-vertex (AOV)</b> network is a digraph whose vertices are tasks and whose edge i → j means "i must finish before j starts" (course
          prerequisites). A <b>topological order</b> lists the vertices so that every edge goes forward. It exists iff the network is acyclic (a DAG); a cycle means
          the project is impossible.
        </p>
        <Code id="topo_sort" />
        <Callout kind="convention">
          <p>
            Horowitz–Sahni's topsort keeps zero-in-degree vertices on a <b>stack</b>; the code here uses a <b>queue</b> (Kahn). Both produce valid — but possibly
            different — orders. Exams accept any valid topological order unless they specify the method.
          </p>
        </Callout>
      </Sec>
      <AlgoViz title="Topological sort (Kahn)" fields={gFields(6, '5>2, 5>0, 4>0, 4>1, 2>3, 3>1', { directed: true, dag: true })} build={(v) => G.topoFrames(readG(v, true))} code="topo_sort" />
      <Sec title="AOE networks and critical paths">
        <p>
          In an <b>activity-on-edge (AOE)</b> network edges are activities with durations and vertices are events ("all activities into this vertex are done").
          Vertex 0 is the project start and the last vertex the finish.
        </p>
        <F>
          ee[j] = max over activities i→j of ( ee[i] + dur )     (forward, in topological order; ee[start] = 0)
          <br />
          le[i] = min over activities i→j of ( le[j] − dur )     (backward; le[finish] = ee[finish])
          <br />
          activity a = ⟨i, j⟩:  early(a) = ee[i],  late(a) = le[j] − dur,  slack = late − early
        </F>
        <p>
          Activities with zero slack are <b>critical</b>: delaying any of them delays the whole project. A longest path from start to finish consists only of critical
          activities — the <b>critical path</b>; its length is the minimum project duration. (This is the CPM of software project management.)
        </p>
      </Sec>
      <AlgoViz
        title="Earliest/latest times and the critical path"
        fields={gFields(7, '0>1:6, 0>2:4, 0>3:5, 1>4:1, 2>4:1, 3>5:2, 4>6:9, 5>6:4', { directed: true, weighted: true, dag: true })}
        build={(v) => {
          const g = readG(v, true);
          if (G.kahn(g.n, G.adjList(g)).length !== g.n) throw new Error('An AOE network must be acyclic.');
          return G.criticalFrames(g);
        }}
      />
    </>
  );
}

function L46Practice() {
  return <AlgoViz title="Predict the next vertex Kahn outputs" fields={gFields(7, '0>2, 1>2, 1>3, 2>4, 3>4, 4>5, 4>6, 3>6', { directed: true, dag: true })} build={(v) => G.topoFrames(readG(v, true), true)} code="topo_sort" predict />;
}

const topoQ: QGen = (rng) => {
  const n = rng.int(5, 6);
  const g = G.randomGraph(rng, n, rng.int(n, n + 2), { directed: true, dag: true });
  const valid = G.kahn(n, G.adjList(g));
  const perms: number[][] = [];
  for (let t = 0; t < 60 && perms.length < 3; t++) {
    const p = rng.shuffle([...Array(n).keys()]);
    if (!G.isTopoOrder(g, p) && !perms.some((q) => q.join() === p.join())) perms.push(p);
  }
  if (perms.length < 2) return seq("Kahn's algorithm with a FIFO queue (initial zero in-degree vertices enqueued in increasing order). Write the topological order.", valid, `Order: ${valid.join(' ')}.`, { scene: G.graphStatic(g, false) });
  return mcq('Which of these is a valid topological order?', valid.join(' '), perms.map((p) => p.join(' ')), `In ${valid.join(' ')} every edge points forward; each other option has an edge pointing backward.`, { scene: G.graphStatic(g, false) });
};
const cpQ: QGen = (rng) => {
  const n = rng.int(5, 7);
  const g = G.randomGraph(rng, n, rng.int(n, n + 3), { directed: true, dag: true, connected: true, wmin: 1, wmax: 9 });
  const r = G.criticalPath(g);
  const k = rng.int(0, 2);
  const scene = G.graphStatic(g);
  if (k === 0) return num('AOE network (edge labels = durations). Minimum project duration (length of the critical path)?', r.length, `ee = [${r.ee.join(', ')}]; max = ${r.length}.`, { scene });
  const v = rng.int(1, n - 1);
  if (k === 1) return num(`Earliest event time ee[${v}]?`, r.ee[v], `ee = [${r.ee.join(', ')}].`, { scene });
  const a = rng.pick(r.acts);
  return num(`Slack (late − early) of activity ${a.e.u}→${a.e.v}?`, a.slack, `early = ee[${a.e.u}] = ${a.early}; late = le[${a.e.v}] − ${a.e.w} = ${a.late}; slack ${a.slack}. ee = [${r.ee.join(', ')}], le = [${r.le.join(', ')}].`, { scene });
};
const L46_BANK = [
  mcq('A topological order exists iff the digraph is…', 'acyclic', ['strongly connected', 'complete', 'a tree'], 'A cycle has no first vertex.'),
  mcq('Kahn\'s algorithm repeatedly removes a vertex with…', 'in-degree 0', ['out-degree 0', 'the largest degree', 'the smallest label'], 'No remaining prerequisites.'),
  mcq('If Kahn\'s algorithm outputs fewer than n vertices, the graph…', 'contains a cycle', ['is disconnected', 'is a tree', 'has negative weights'], 'Cycle vertices never reach in-degree 0.'),
  mcq('In an AOE network, a critical activity is one with…', 'zero slack (early time = late time)', ['the largest duration', 'no successors', 'the smallest duration'], 'Delaying it delays the project.'),
  mcq('Earliest event times are computed…', 'forward in topological order, taking a max', ['backward, taking a min', 'by Dijkstra', 'in any order'], 'All incoming activities must finish.'),
  mcq('The critical path is the…', 'longest path from start to finish', ['shortest path', 'path with fewest edges', 'minimum spanning tree'], 'Its length is the minimum project time.'),
  mcq('Time of topological sorting with adjacency lists?', 'O(n + e)', ['O(n²)', 'O(e log n)', 'O(n³)'], 'Each vertex and edge once.'),
  tf('AOV networks put activities on vertices; AOE networks put activities on edges.', true, 'Hence the names.'),
];

const L46: Level = {
  id: 'L46',
  n: 46,
  world: 9,
  title: 'Activity Networks',
  blurb: "AOV networks and topological sort (Kahn's queue vs H–S's stack), AOE networks, earliest/latest times, slack and the critical path.",
  syllabus: ['DS U5 · Activity networks, topological sort and critical paths'],
  snippets: ['topo_sort'],
  Lesson: L46Lesson,
  Practice: L46Practice,
  quiz: [topoQ, topoQ, topoQ, cpQ, cpQ, cpQ, bank(L46_BANK), bank(L46_BANK)],
  cards: [
    { q: 'ee and le recurrences?', a: 'ee[j] = max(ee[i] + dur) forward; le[i] = min(le[j] − dur) backward; slack = le[j] − dur − ee[i].' },
    { q: 'When does a topological order exist?', a: 'Exactly when the digraph is acyclic.' },
  ],
  refs: ['Horowitz, Sahni & Anderson-Freed, Fundamentals of Data Structures in C — chapter "Graphs": activity networks (AOV topological sort, AOE critical paths, ee/le).', 'Kahn, "Topological sorting of large networks", CACM 5(11), 1962.'],
};

export default [L43, L44, L45, L46];
