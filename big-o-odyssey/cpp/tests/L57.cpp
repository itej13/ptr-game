#include "harness.h"
#include "../n_queens.cpp"
int main() {
    string cmd;
    while (cin >> cmd) {  // nq n -> count | first solution
        int n;
        cin >> n;
        vector<int> x(n);
        vector<vector<int>> sols;
        nQueens(0, n, x, sols);
        cout << sols.size() << " |";
        if (!sols.empty()) for (int c : sols[0]) cout << " " << c;
        cout << "\n";
    }
}
