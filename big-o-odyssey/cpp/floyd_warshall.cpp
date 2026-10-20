// @title Floyd–Warshall all-pairs shortest paths
// @desc d[i][j] starts as the edge weight (INF if no edge, 0 on the diagonal). After phase k, d[i][j] is the shortest i → j path using intermediates 0..k only. Θ(n³). Negative edges OK, no negative cycles.
const int INF = 1000000000;

void floydWarshall(vector<vector<int>>& d) {
    int n = d.size();
    for (int k = 0; k < n; k++) //@k
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (d[i][k] < INF && d[k][j] < INF && d[i][k] + d[k][j] < d[i][j]) //@cmp
                    d[i][j] = d[i][k] + d[k][j]; //@update
}
