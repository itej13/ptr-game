// @title Dijkstra's shortest paths
// @desc Single source, non-negative weights. adj[u] holds (v, w) pairs. A min-priority queue of (distance, vertex) gives the closest unfinished vertex; stale queue entries are skipped. O((V + E) log V).
vector<int> dijkstra(int src, const vector<vector<pair<int, int>>>& adj) {
    vector<int> dist(adj.size(), INT_MAX);
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    dist[src] = 0; //@d-init
    pq.push({0, src});
    while (!pq.empty()) { //@d-loop
        auto [d, u] = pq.top(); //@d-pop
        pq.pop();
        if (d > dist[u]) //@d-stale
            continue;
        for (auto [v, w] : adj[u]) //@d-scan
            if (dist[u] + w < dist[v]) { //@d-relax
                dist[v] = dist[u] + w; //@d-update
                pq.push({dist[v], v});
            }
    }
    return dist;
}
