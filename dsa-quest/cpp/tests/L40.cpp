#include "harness.h"
#include "../articulation.cpp"
#include "graph_io.h"

int main() {
    string cmd;
    while (cin >> cmd) {  // ap n m edges...
        int n, m;
        cin >> n >> m;
        auto adj = readAdj(n, m, false);
        vector<int> disc(n, 0), low(n, 0);
        vector<bool> cut(n, false);
        vector<pair<int, int>> br;
        int timer = 0;
        for (int u = 0; u < n; u++)
            if (disc[u] == 0) apDfs(u, -1, adj, disc, low, cut, br, timer);
        for (auto& b : br) if (b.first > b.second) std::swap(b.first, b.second);
        sort(br.begin(), br.end());
        string out;
        for (int u = 0; u < n; u++) if (cut[u]) out += to_string(u) + " ";
        out += "|";
        for (auto& b : br) out += " " + to_string(b.first) + "-" + to_string(b.second);
        out += " | ";
        for (int u = 0; u < n; u++) out += to_string(disc[u]) + ":" + to_string(low[u]) + " ";
        cout << out << "\n";
    }
}
