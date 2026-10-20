// @title Edit distance (Levenshtein)
// @desc Fewest single-character insertions, deletions and substitutions turning a into b. d[i][j] = distance between a[0..i) and b[0..j). Θ(mn).
int editDistance(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<vector<int>> d(m + 1, vector<int>(n + 1));
    for (int i = 0; i <= m; i++) //@col0
        d[i][0] = i;
    for (int j = 0; j <= n; j++) //@row0
        d[0][j] = j;
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (a[i - 1] == b[j - 1]) //@same
                d[i][j] = d[i - 1][j - 1];
            else
                d[i][j] = 1 + min({d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]}); //@ops
    return d[m][n];
}
