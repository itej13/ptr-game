// @title Bellman–Ford with negative-cycle detection
// @desc Works with negative edge weights. Relax every edge n − 1 times; if any edge can still be relaxed, a negative cycle is reachable from the source (return false). Lab Experiment 10.
struct Edge {
    int u, v, w;
};

bool bellmanFord(int n, const vector<Edge>& edges, int src, vector<int>& dist) {
    dist.assign(n, INT_MAX);
    dist[src] = 0; //@bf-init
    for (int i = 1; i <= n - 1; i++) //@bf-round
        for (const Edge& e : edges) //@bf-edge
            if (dist[e.u] != INT_MAX && dist[e.u] + e.w < dist[e.v]) //@bf-relax
                dist[e.v] = dist[e.u] + e.w; //@bf-update
    for (const Edge& e : edges) //@bf-check
        if (dist[e.u] != INT_MAX && dist[e.u] + e.w < dist[e.v])
            return false; //@bf-neg
    return true;
}
