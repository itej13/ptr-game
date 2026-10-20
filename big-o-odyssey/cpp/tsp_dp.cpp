// @title Travelling salesman (Held–Karp DP)
// @desc dp[mask][u] = cheapest path that starts at city 0, visits exactly the cities in mask, and ends at u. Answer: min over u of dp[all][u] + d[u][0]. Θ(n²·2ⁿ) time, Θ(n·2ⁿ) space.
int tsp(const vector<vector<int>>& d) {
    int n = d.size(), FULL = 1 << n;
    const int BIG = 1000000000;
    vector<vector<int>> dp(FULL, vector<int>(n, BIG));
    dp[1][0] = 0; //@start
    for (int mask = 1; mask < FULL; mask++) //@mask
        for (int u = 0; u < n; u++) {
            if (!(mask & (1 << u)) || dp[mask][u] == BIG)
                continue;
            for (int v = 0; v < n; v++) //@next
                if (!(mask & (1 << v)) && dp[mask][u] + d[u][v] < dp[mask | (1 << v)][v])
                    dp[mask | (1 << v)][v] = dp[mask][u] + d[u][v]; //@extend
        }
    int best = BIG;
    for (int u = 1; u < n; u++) //@close
        best = min(best, dp[FULL - 1][u] + d[u][0]);
    return n == 1 ? 0 : best;
}
