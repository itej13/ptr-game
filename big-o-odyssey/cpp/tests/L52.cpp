#include "harness.h"
#include "../matrix_chain.cpp"
int main() {
    string cmd;
    while (cin >> cmd) {  // mcm k p0..p(k-1)
        int k;
        cin >> k;
        vector<int> p = readInts(cin, k);
        vector<vector<int>> s;
        int c = matrixChain(p, s);
        cout << c << " " << parens(s, 1, k - 1) << "\n";
    }
}
