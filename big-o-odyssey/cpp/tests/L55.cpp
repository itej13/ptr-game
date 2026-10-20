#include "harness.h"
#include "../knapsack01.cpp"
int main() {
    string cmd;
    while (cin >> cmd) {  // knap W n (w v)...
        int W, n;
        cin >> W >> n;
        vector<int> wt(n), val(n);
        for (int i = 0; i < n; i++) cin >> wt[i] >> val[i];
        vector<int> ch;
        cout << knapsack01(W, wt, val, ch) << " |";
        for (int i : ch) cout << " " << i;
        cout << "\n";
    }
}
