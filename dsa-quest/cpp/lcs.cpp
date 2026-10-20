// @title Longest common subsequence
// @desc c[i][j] = LCS length of X[0..i) and Y[0..j). Trace back from c[m][n]: a match goes diagonally; otherwise move up when c[i−1][j] ≥ c[i][j−1] (CLRS's tie rule), else left. Θ(mn). Lab Experiment 13.
int lcs(const string& X, const string& Y, string& seq) {
    int m = X.size(), n = Y.size();
    vector<vector<int>> c(m + 1, vector<int>(n + 1, 0));
    for (int i = 1; i <= m; i++) //@rows
        for (int j = 1; j <= n; j++)
            if (X[i - 1] == Y[j - 1]) //@match
                c[i][j] = c[i - 1][j - 1] + 1; //@diag
            else
                c[i][j] = max(c[i - 1][j], c[i][j - 1]); //@max
    seq = "";
    for (int i = m, j = n; i > 0 && j > 0;) { //@trace
        if (X[i - 1] == Y[j - 1]) {
            seq = X[i - 1] + seq; //@take
            i--;
            j--;
        } else if (c[i - 1][j] >= c[i][j - 1])
            i--;
        else
            j--;
    }
    return c[m][n];
}
