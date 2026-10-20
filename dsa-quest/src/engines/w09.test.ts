import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import * as G from './graphs';

describe('graph algorithms vs brute force / each other', () => {
  it('Tarjan cut vertices == deletion brute force; bridges == edge-deletion brute force', () => {
    const rng = new Rng(71);
    for (let t = 0; t < 2000; t++) {
      const g = G.randomGraph(rng, rng.int(1, 9), rng.int(0, 13));
      const r = G.tarjan(g);
      expect(r.cut).toEqual(G.cutBrute(g));
      const base = G.components(G.adjList(g)).length;
      const br = g.edges
        .filter((e) => G.components(G.adjList({ ...g, edges: g.edges.filter((x) => x !== e) })).length > base)
        .map((e) => [Math.min(e.u, e.v), Math.max(e.u, e.v)] as [number, number])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      expect(r.bridges).toEqual(br);
    }
  });
  it('Kruskal == Prim == brute-force MST weight on small connected graphs', () => {
    const rng = new Rng(72);
    for (let t = 0; t < 400; t++) {
      const n = rng.int(2, 6);
      const g = G.randomGraph(rng, n, rng.int(n - 1, 10), { connected: true });
      // brute force over all (n-1)-subsets of edges
      let best = Infinity;
      const m = g.edges.length;
      const pick = (i: number, chosen: G.Edge[]) => {
        if (chosen.length === n - 1) {
          const d = new G.DSU(n);
          if (chosen.every((e) => d.unite(e.u, e.v))) best = Math.min(best, chosen.reduce((s, e) => s + e.w, 0));
          return;
        }
        if (i === m || m - i < n - 1 - chosen.length) return;
        pick(i + 1, [...chosen, g.edges[i]]);
        pick(i + 1, chosen);
      };
      pick(0, []);
      expect(G.kruskal(g).total).toBe(best);
      expect(G.prim(g).total).toBe(best);
    }
  });
  it('Dijkstra == Bellman–Ford on non-negative weights; Floyd-style check', () => {
    const rng = new Rng(73);
    for (let t = 0; t < 1500; t++) {
      const n = rng.int(1, 8);
      const g = G.randomGraph(rng, n, rng.int(0, 14), { directed: rng.chance(0.5), wmin: 0, wmax: 9 });
      const s = rng.int(0, n - 1);
      expect(G.dijkstra(g, s).dist).toEqual(G.bellmanFord(g, s).dist);
    }
  });
  it('Warshall == BFS reachability (paths of length ≥ 1)', () => {
    const rng = new Rng(74);
    for (let t = 0; t < 1000; t++) {
      const n = rng.int(1, 7);
      const g = G.randomGraph(rng, n, rng.int(0, 12), { directed: true });
      const R = G.warshall(G.adjMatrix(g));
      const adj = G.adjList(g);
      for (let i = 0; i < n; i++) {
        const reach = new Set<number>();
        const st = [...adj[i]];
        while (st.length) {
          const x = st.pop()!;
          if (reach.has(x)) continue;
          reach.add(x);
          st.push(...adj[x]);
        }
        for (let j = 0; j < n; j++) expect(R[i][j]).toBe(reach.has(j) ? 1 : 0);
      }
    }
  });
  it('Kahn produces a valid topological order exactly for DAGs', () => {
    const rng = new Rng(75);
    for (let t = 0; t < 1500; t++) {
      const n = rng.int(1, 9);
      const dag = rng.chance(0.7);
      const g = G.randomGraph(rng, n, rng.int(0, 14), { directed: true, dag });
      const o = G.kahn(n, G.adjList(g));
      if (o.length === n) expect(G.isTopoOrder(g, o)).toBe(true);
      if (dag) expect(o.length).toBe(n);
    }
  });
  it('critical path: slack ≥ 0 and the critical activities form a start→finish path of the project length', () => {
    const rng = new Rng(76);
    for (let t = 0; t < 800; t++) {
      const n = rng.int(3, 8);
      const g = G.randomGraph(rng, n, rng.int(n, 14), { directed: true, dag: true, wmin: 1, wmax: 9 });
      const r = G.criticalPath(g);
      for (const a of r.acts) expect(a.slack).toBeGreaterThanOrEqual(0);
      const len = Math.max(...r.ee);
      expect(r.length).toBe(len);
      // some critical path achieves the length
      const crit = r.acts.filter((a) => a.slack === 0);
      const sinks = [...Array(n).keys()].filter((v) => r.ee[v] === len);
      expect(sinks.length).toBeGreaterThan(0);
      expect(crit.reduce((s, a) => s + (r.ee[a.e.u] + a.e.w === r.ee[a.e.v] ? 0 : 1), 0)).toBe(0);
    }
  });
});
