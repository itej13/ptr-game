// @title Matrix-chain multiplication
// @desc Ai has dimensions p[i−1] × p[i], i = 1..n. m[i][j] = fewest scalar multiplications for Ai…Aj; s[i][j] = best split k (smallest on ties). parens() prints the optimal order. Θ(n³). Lab Experiment 12.
int matrixChain(const vector<int>& p, vector<vector<int>>& s) {
    int n = p.size() - 1;
    vector<vector<int>> m(n + 1, vector<int>(n + 1, 0));
    s.assign(n + 1, vector<int>(n + 1, 0));
    for (int len = 2; len <= n; len++) //@len
        for (int i = 1; i + len - 1 <= n; i++) {
            int j = i + len - 1;
            m[i][j] = INT_MAX; //@cell
            for (int k = i; k < j; k++) { //@split
                int cost = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j]; //@cost
                if (cost < m[i][j]) {
                    m[i][j] = cost; //@best
                    s[i][j] = k;
                }
            }
        }
    return m[1][n];
}

string parens(const vector<vector<int>>& s, int i, int j) {
    if (i == j) //@p-leaf
        return "A" + to_string(i);
    return "(" + parens(s, i, s[i][j]) + parens(s, s[i][j] + 1, j) + ")"; //@p-split
}
