#include "harness.h"
#include "../topo_sort.cpp"
#include "graph_io.h"

int main() {
    string cmd;
    while (cin >> cmd) {  // topo n m edges... directed
        int n, m;
        cin >> n >> m;
        auto adj = readAdj(n, m, true);
        for (int x : topoSort(adj)) cout << x << " ";
        cout << "\n";
    }
}
