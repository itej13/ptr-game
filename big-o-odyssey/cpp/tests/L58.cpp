#include "harness.h"
#include "../sum_of_subsets.cpp"
#include "../knapsack_backtrack.cpp"
int main() {
    string cmd;
    while (cin >> cmd) {
        if (cmd == "sos") {  // sos m n w... (sorted ascending)
            int m, n;
            cin >> m >> n;
            vector<int> w = readInts(cin, n), x(n, 0);
            int r = 0;
            for (int v : w) r += v;
            vector<vector<int>> out;
            sumOfSubsets(w, m, 0, 0, r, x, out);
            for (auto& s : out) { for (int b : s) cout << b; cout << " "; }
            cout << "|\n";
        } else {  // bk W n (w v)...   (harness sorts by ratio)
            int W, n;
            cin >> W >> n;
            vector<pair<int, int>> it(n);
            for (auto& p : it) cin >> p.first >> p.second;
            stable_sort(it.begin(), it.end(), [](const pair<int, int>& a, const pair<int, int>& b) { return a.second * b.first > b.second * a.first; });
            vector<int> wt(n), val(n);
            for (int i = 0; i < n; i++) { wt[i] = it[i].first; val[i] = it[i].second; }
            int best = 0;
            bknap(0, 0, 0, W, wt, val, best);
            cout << best << "\n";
        }
    }
}
