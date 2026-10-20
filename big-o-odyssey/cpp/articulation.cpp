// @title Cut vertices & bridges (Tarjan)
// @desc DFS numbering disc[u] and low[u] = smallest disc reachable from u's subtree using at most one back edge. Non-root u is a cut vertex if some child v has low[v] ≥ disc[u]; the root is one if it has ≥ 2 DFS children; edge u–v is a bridge if low[v] > disc[u]. Simple undirected graph; call for every vertex with disc == 0.
void apDfs(int u, int parent, const vector<vector<int>>& adj, vector<int>& disc, vector<int>& low,
           vector<bool>& isCut, vector<pair<int, int>>& bridges, int& timer) {
    disc[u] = low[u] = ++timer; //@ap-num
    int children = 0;
    for (int v : adj[u]) {
        if (disc[v] == 0) { //@ap-tree
            children++;
            apDfs(v, u, adj, disc, low, isCut, bridges, timer);
            low[u] = min(low[u], low[v]); //@ap-low
            if (parent != -1 && low[v] >= disc[u]) //@ap-cut
                isCut[u] = true;
            if (low[v] > disc[u]) //@ap-bridge
                bridges.push_back({u, v});
        } else if (v != parent) { //@ap-back
            low[u] = min(low[u], disc[v]);
        }
    }
    if (parent == -1 && children > 1) //@ap-root
        isCut[u] = true;
}
