#include "harness.h"
#include "../warshall.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // war n matrix(n*n)
        int n;
        cin >> n;
        vector<vector<int>> R(n, vector<int>(n));
        for (auto& r : R) for (int& x : r) cin >> x;
        warshall(R);
        for (auto& r : R) { for (int x : r) cout << x; cout << " "; }
        cout << "\n";
    }
}
