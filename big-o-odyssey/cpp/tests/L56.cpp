#include "harness.h"
#include "../tsp_dp.cpp"
int main() {
    string cmd;
    while (cin >> cmd) {  // tsp n matrix
        int n;
        cin >> n;
        vector<vector<int>> d(n, vector<int>(n));
        for (auto& r : d) for (int& x : r) cin >> x;
        cout << tsp(d) << "\n";
    }
}
