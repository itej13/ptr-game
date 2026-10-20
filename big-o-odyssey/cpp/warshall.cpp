// @title Warshall's transitive closure
// @desc R starts as the 0/1 adjacency matrix. After step k, R[i][j] = 1 iff there is a path i → j whose intermediate vertices are all ≤ k. Result: the transitive closure A⁺. O(n³).
void warshall(vector<vector<int>>& R) {
    int n = R.size();
    for (int k = 0; k < n; k++) //@w-k
        for (int i = 0; i < n; i++) //@w-i
            for (int j = 0; j < n; j++) //@w-j
                R[i][j] = R[i][j] || (R[i][k] && R[k][j]); //@w-update
}
