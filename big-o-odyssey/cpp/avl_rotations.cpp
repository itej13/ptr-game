// @title AVL node & rotations
// @desc height counts nodes (leaf = 1, empty = 0); balance factor = height(left) − height(right), must stay in {−1, 0, 1}.
struct AVLNode {
    int key;
    AVLNode* left;
    AVLNode* right;
    int height;
};

int height(AVLNode* n) { return n ? n->height : 0; }
int balance(AVLNode* n) { return n ? height(n->left) - height(n->right) : 0; }
void update(AVLNode* n) { n->height = 1 + max(height(n->left), height(n->right)); }

AVLNode* rotateRight(AVLNode* y) {
    AVLNode* x = y->left; //@rr-x
    y->left = x->right; //@rr-move
    x->right = y; //@rr-link
    update(y);
    update(x);
    return x; //@rr-ret
}

AVLNode* rotateLeft(AVLNode* x) {
    AVLNode* y = x->right; //@rl-y
    x->right = y->left; //@rl-move
    y->left = x; //@rl-link
    update(x);
    update(y);
    return y; //@rl-ret
}
