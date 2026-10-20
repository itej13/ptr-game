// @title Topological sort (Kahn)
// @desc AOV network = DAG. Repeatedly output a vertex with in-degree 0 and delete its outgoing edges. If fewer than n vertices are output, the graph has a cycle.
vector<int> topoSort(const vector<vector<int>>& adj) {
    int n = adj.size();
    vector<int> indeg(n, 0), order;
    for (int u = 0; u < n; u++) //@t-indeg
        for (int v : adj[u])
            indeg[v]++;
    queue<int> q;
    for (int u = 0; u < n; u++) //@t-seed
        if (indeg[u] == 0)
            q.push(u);
    while (!q.empty()) { //@t-loop
        int u = q.front(); //@t-take
        q.pop();
        order.push_back(u);
        for (int v : adj[u]) //@t-edges
            if (--indeg[v] == 0) //@t-zero
                q.push(v);
    }
    return order;
}
