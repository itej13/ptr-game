// @title Prim's MST (adjacency matrix)
// @desc g[u][v] = weight, 0 = no edge; connected undirected graph. Grow the tree from vertex 0: repeatedly add the cheapest vertex not yet in the tree, then lower its neighbours' keys. O(V²).
int prim(const vector<vector<int>>& g, vector<int>& par) {
    int n = g.size();
    vector<int> key(n, INT_MAX);
    vector<bool> inMST(n, false);
    par.assign(n, -1);
    key[0] = 0; //@p-start
    int total = 0;
    for (int it = 0; it < n; it++) {
        int u = -1;
        for (int v = 0; v < n; v++) //@p-pick
            if (!inMST[v] && (u == -1 || key[v] < key[u]))
                u = v;
        inMST[u] = true; //@p-add
        total += key[u];
        for (int v = 0; v < n; v++) //@p-relax
            if (g[u][v] && !inMST[v] && g[u][v] < key[v]) {
                key[v] = g[u][v]; //@p-update
                par[v] = u;
            }
    }
    return total;
}
