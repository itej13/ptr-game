// @title N-Queens (backtracking)
// @desc x[k] = column of the queen in row k (0-based). place() checks the earlier rows for a shared column or diagonal. Rows are filled one at a time; a dead end returns and the next column is tried. Lab Experiment 15.
bool place(const vector<int>& x, int k, int c) {
    for (int i = 0; i < k; i++) //@check
        if (x[i] == c || abs(x[i] - c) == abs(i - k)) //@attack
            return false;
    return true;
}

void nQueens(int k, int n, vector<int>& x, vector<vector<int>>& solutions) {
    for (int c = 0; c < n; c++) //@try
        if (place(x, k, c)) { //@safe
            x[k] = c; //@put
            if (k == n - 1) //@full
                solutions.push_back(x);
            else
                nQueens(k + 1, n, x, solutions); //@next
        }
}
