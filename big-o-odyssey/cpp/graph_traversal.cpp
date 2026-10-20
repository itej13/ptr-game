// @title DFS, BFS & connected components
// @desc Vertices 0..n−1, adjacency lists (sorted ascending, so the visiting order is the textbook one). Lab Experiment 4 counts components with DFS.
void dfs(int u, const vector<vector<int>>& adj, vector<bool>& visited, vector<int>& order) {
    visited[u] = true; //@dfs-mark
    order.push_back(u); //@dfs-visit
    for (int v : adj[u]) //@dfs-loop
        if (!visited[v]) //@dfs-check
            dfs(v, adj, visited, order); //@dfs-rec
}

vector<int> bfs(int s, const vector<vector<int>>& adj) {
    vector<bool> visited(adj.size(), false);
    vector<int> order;
    queue<int> q;
    visited[s] = true; //@bfs-start
    q.push(s);
    while (!q.empty()) { //@bfs-loop
        int u = q.front(); //@bfs-deq
        q.pop();
        order.push_back(u);
        for (int v : adj[u]) //@bfs-scan
            if (!visited[v]) { //@bfs-check
                visited[v] = true; //@bfs-mark
                q.push(v);
            }
    }
    return order;
}

int countComponents(const vector<vector<int>>& adj) {
    int n = adj.size(), count = 0;
    vector<bool> visited(n, false);
    vector<int> order;
    for (int s = 0; s < n; s++) //@cc-loop
        if (!visited[s]) { //@cc-new
            dfs(s, adj, visited, order);
            count++;
        }
    return count;
}
