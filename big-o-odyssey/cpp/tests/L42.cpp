#include "harness.h"
#include "../disjoint_set.cpp"
#include "../kruskal.cpp"
#include "../prim.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // kruskal|prim n m (u v w)...
        int n, m;
        cin >> n >> m;
        vector<Edge> edges(m);
        vector<vector<int>> g(n, vector<int>(n, 0));
        for (auto& e : edges) {
            cin >> e.u >> e.v >> e.w;
            g[e.u][e.v] = g[e.v][e.u] = e.w;
        }
        if (cmd == "kruskal") {
            vector<Edge> mst;
            int t = kruskal(n, edges, mst);
            cout << t << " |";
            for (auto& e : mst) cout << " " << e.u << "-" << e.v;
            cout << "\n";
        } else {
            vector<int> par;
            int t = prim(g, par);
            cout << t << " |";
            for (int x : par) cout << " " << x;
            cout << "\n";
        }
    }
}
