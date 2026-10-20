#include "harness.h"
#include "../floyd_warshall.cpp"
int main() {
    string cmd;
    while (cin >> cmd) {  // fw n matrix (use X for no edge)
        int n;
        cin >> n;
        vector<vector<int>> d(n, vector<int>(n));
        for (auto& r : d) for (int& x : r) { string t; cin >> t; x = t == "X" ? INF : stoi(t); }
        floydWarshall(d);
        for (auto& r : d) { for (int x : r) cout << (x >= INF ? string("X") : to_string(x)) << ","; cout << " "; }
        cout << "\n";
    }
}
