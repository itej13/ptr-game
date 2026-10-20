#include "harness.h"
#include "../graph_traversal.cpp"
#include "graph_io.h"

int main() {
    string cmd;
    while (cin >> cmd) {  // trav n m s edges...
        int n, m, s;
        cin >> n >> m >> s;
        auto adj = readAdj(n, m, false);
        vector<bool> vis(n, false);
        vector<int> order;
        dfs(s, adj, vis, order);
        string out;
        for (int x : order) out += to_string(x) + " ";
        out += "| ";
        for (int x : bfs(s, adj)) out += to_string(x) + " ";
        out += "| " + to_string(countComponents(adj));
        cout << out << "\n";
    }
}
