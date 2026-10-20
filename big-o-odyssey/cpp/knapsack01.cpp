// @title 0/1 knapsack (DP table)
// @desc K[i][w] = best value using the first i items with capacity w. Each item is either skipped or taken whole. Trace back to list the chosen items (last item first). Θ(nW) — pseudo-polynomial. Lab Experiment 14.
int knapsack01(int W, const vector<int>& wt, const vector<int>& val, vector<int>& chosen) {
    int n = wt.size();
    vector<vector<int>> K(n + 1, vector<int>(W + 1, 0));
    for (int i = 1; i <= n; i++) //@items
        for (int w = 0; w <= W; w++) {
            K[i][w] = K[i - 1][w]; //@skip
            if (wt[i - 1] <= w) //@fits
                K[i][w] = max(K[i][w], K[i - 1][w - wt[i - 1]] + val[i - 1]); //@take
        }
    chosen.clear();
    for (int i = n, w = W; i > 0; i--) //@trace
        if (K[i][w] != K[i - 1][w]) {
            chosen.push_back(i - 1);
            w -= wt[i - 1];
        }
    return K[n][W];
}
