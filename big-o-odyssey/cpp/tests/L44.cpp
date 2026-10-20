#include "harness.h"
#include "../bellman_ford.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // bf n m s (u v w)...  directed
        int n, m, s;
        cin >> n >> m >> s;
        vector<Edge> edges(m);
        for (auto& e : edges) cin >> e.u >> e.v >> e.w;
        vector<int> dist;
        if (!bellmanFord(n, edges, s, dist)) {
            cout << "NEG\n";
            continue;
        }
        for (int d : dist) cout << (d == INT_MAX ? string("INF") : to_string(d)) << " ";
        cout << "\n";
    }
}
