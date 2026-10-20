// @title AVL delete (bonus)
// @desc BST delete (successor for two children), then rebalance every ancestor. The rotation is chosen by the child's balance factor, not by the deleted key.
AVLNode* deleteKey(AVLNode* root, int key) {
    if (root == nullptr)
        return root;
    if (key < root->key)
        root->left = deleteKey(root->left, key);
    else if (key > root->key)
        root->right = deleteKey(root->right, key);
    else {
        if (root->left == nullptr || root->right == nullptr) {
            AVLNode* t = root->left ? root->left : root->right;
            delete root;
            return t;
        }
        AVLNode* s = root->right;
        while (s->left != nullptr)
            s = s->left;
        root->key = s->key;
        root->right = deleteKey(root->right, s->key);
    }
    update(root);
    int bf = balance(root);
    if (bf > 1 && balance(root->left) >= 0)
        return rotateRight(root);
    if (bf > 1) {
        root->left = rotateLeft(root->left);
        return rotateRight(root);
    }
    if (bf < -1 && balance(root->right) <= 0)
        return rotateLeft(root);
    if (bf < -1) {
        root->right = rotateRight(root->right);
        return rotateLeft(root);
    }
    return root;
}
