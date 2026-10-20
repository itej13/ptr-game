// @title B-tree node & search
// @desc Order M (Knuth / Horowitz–Sahni): every node has at most M children and M − 1 keys; every non-root node has at least ⌈M/2⌉ children; all leaves on one level. key[] has one spare slot for a temporary overflow during insert.
const int M = 5;

struct BNode {
    int n = 0;
    int key[M];
    BNode* child[M + 1] = {};
    bool leaf = true;
};

BNode* search(BNode* x, int k) {
    int i = 0; //@s-init
    while (i < x->n && k > x->key[i]) //@s-scan
        i++;
    if (i < x->n && k == x->key[i]) //@s-hit
        return x;
    if (x->leaf) //@s-leaf
        return nullptr;
    return search(x->child[i], k); //@s-down
}
