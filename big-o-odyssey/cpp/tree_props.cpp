// @title Binary tree: node, height, counts
// @desc Linked representation. height() follows Horowitz–Sahni (root at level 1): empty tree 0, single node 1. (CLRS counts edges: subtract 1.)
struct TNode {
    int data;
    TNode* left;
    TNode* right;
};

int height(TNode* t) {
    if (t == nullptr) //@h-base
        return 0;
    return 1 + max(height(t->left), height(t->right)); //@h-rec
}

int countNodes(TNode* t) {
    if (t == nullptr)
        return 0;
    return 1 + countNodes(t->left) + countNodes(t->right);
}

int countLeaves(TNode* t) {
    if (t == nullptr)
        return 0;
    if (t->left == nullptr && t->right == nullptr)
        return 1;
    return countLeaves(t->left) + countLeaves(t->right);
}
