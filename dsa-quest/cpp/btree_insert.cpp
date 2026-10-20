// @title B-tree insert (split on overflow)
// @desc Insert into the correct leaf; a node that reaches M keys splits around its median (index (M − 1) / 2), and the median moves up — possibly creating a new root. Duplicates are ignored.
BNode* insertRec(BNode* x, int k, int& up) {
    int i = 0;
    while (i < x->n && k > x->key[i]) //@i-scan
        i++;
    if (i < x->n && k == x->key[i])
        return nullptr;
    if (x->leaf) {
        for (int j = x->n; j > i; j--) //@i-leaf
            x->key[j] = x->key[j - 1];
        x->key[i] = k;
        x->n++;
    } else {
        int mid;
        BNode* r = insertRec(x->child[i], k, mid); //@i-down
        if (r == nullptr)
            return nullptr;
        for (int j = x->n; j > i; j--) { //@i-absorb
            x->key[j] = x->key[j - 1];
            x->child[j + 1] = x->child[j];
        }
        x->key[i] = mid;
        x->child[i + 1] = r;
        x->n++;
    }
    if (x->n < M) //@i-fits
        return nullptr;
    int m = (M - 1) / 2; //@i-split
    BNode* r = new BNode;
    r->leaf = x->leaf;
    r->n = x->n - m - 1;
    for (int j = 0; j < r->n; j++)
        r->key[j] = x->key[m + 1 + j];
    for (int j = 0; j <= r->n; j++)
        r->child[j] = x->child[m + 1 + j];
    up = x->key[m]; //@i-up
    x->n = m;
    return r;
}

BNode* insert(BNode* root, int k) {
    int up;
    BNode* r = insertRec(root, k, up);
    if (r == nullptr)
        return root;
    BNode* s = new BNode; //@i-newroot
    s->leaf = false;
    s->n = 1;
    s->key[0] = up;
    s->child[0] = root;
    s->child[1] = r;
    return s;
}
