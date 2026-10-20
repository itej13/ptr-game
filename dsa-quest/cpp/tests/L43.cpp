#include "harness.h"
#include "../dijkstra.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // dij n m s (u v w)...  directed
        int n, m, s;
        cin >> n >> m >> s;
        vector<vector<pair<int, int>>> adj(n);
        for (int i = 0; i < m; i++) {
            int u, v, w;
            cin >> u >> v >> w;
            adj[u].push_back({v, w});
        }
        for (int d : dijkstra(s, adj)) cout << (d == INT_MAX ? string("INF") : to_string(d)) << " ";
        cout << "\n";
    }
}
