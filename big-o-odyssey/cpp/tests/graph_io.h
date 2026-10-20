// Read "n m" then m edges "u v" (or "u v w") into sorted adjacency lists.
inline vector<vector<int>> readAdj(int n, int m, bool directed) {
    vector<vector<int>> adj(n);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        if (!directed) adj[v].push_back(u);
    }
    for (auto& l : adj) sort(l.begin(), l.end());
    return adj;
}
