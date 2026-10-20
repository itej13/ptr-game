// @title Sum of subsets (backtracking)
// @desc Sahni's SumOfSub: w sorted ascending, target m. s = sum chosen so far from w[0..k−1], r = sum of w[k..n−1]. Try including w[k] (left child), then excluding it (right child), but only when the bounding conditions say a solution is still possible. Call with k = 0, s = 0, r = Σw.
void sumOfSubsets(const vector<int>& w, int m, int k, int s, int r, vector<int>& x, vector<vector<int>>& out) {
    int n = w.size();
    if (k == n)
        return;
    x[k] = 1; //@incl
    if (s + w[k] == m) { //@found
        vector<int> sol(x.begin(), x.begin() + k + 1);
        sol.resize(n, 0);
        out.push_back(sol);
    } else if (k + 1 < n && s + w[k] + w[k + 1] <= m) //@left
        sumOfSubsets(w, m, k + 1, s + w[k], r - w[k], x, out);
    x[k] = 0; //@excl
    if (k + 1 < n && s + r - w[k] >= m && s + w[k + 1] <= m) //@right
        sumOfSubsets(w, m, k + 1, s, r - w[k], x, out);
}
