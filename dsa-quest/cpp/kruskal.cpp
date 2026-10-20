// @title Kruskal's MST
// @desc Sort edges by weight (stable, so ties keep input order), then add each edge that joins two different components. Uses makeSet/unite from the disjoint-set snippet. Returns the MST weight.
struct Edge {
    int u, v, w;
};

int kruskal(int n, vector<Edge> edges, vector<Edge>& mst) {
    stable_sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) { return a.w < b.w; }); //@k-sort
    makeSet(n); //@k-make
    int total = 0;
    for (const Edge& e : edges) //@k-loop
        if (unite(e.u, e.v)) { //@k-unite
            mst.push_back(e); //@k-take
            total += e.w;
        }
    return total;
}
