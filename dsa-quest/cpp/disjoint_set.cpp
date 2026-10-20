// @title Disjoint set (union–find)
// @desc Each set is a tree stored in parent[]; the root names the set. findSet uses path compression; unite attaches the smaller tree under the larger root (union by size). unite returns false when both are already in one set — that edge would form a cycle.
int parent[100], sz[100];

void makeSet(int n) {
    for (int i = 0; i < n; i++) {
        parent[i] = i; //@make
        sz[i] = 1;
    }
}

int findSet(int x) {
    if (parent[x] != x) //@find-check
        parent[x] = findSet(parent[x]); //@find-compress
    return parent[x];
}

bool unite(int a, int b) {
    a = findSet(a); //@u-roots
    b = findSet(b);
    if (a == b) //@u-same
        return false;
    if (sz[a] < sz[b]) //@u-size
        swap(a, b);
    parent[b] = a; //@u-link
    sz[a] += sz[b];
    return true;
}
