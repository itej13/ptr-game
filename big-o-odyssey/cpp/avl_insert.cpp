// @title AVL insert
// @desc BST insert, then on the way back up fix the first unbalanced ancestor with one of four rotations: LL, RR, LR, RL.
AVLNode* insert(AVLNode* node, int key) {
    if (node == nullptr) //@ins-new
        return new AVLNode{key, nullptr, nullptr, 1};
    if (key < node->key)
        node->left = insert(node->left, key);
    else if (key > node->key)
        node->right = insert(node->right, key);
    else
        return node;
    update(node); //@ins-update
    int bf = balance(node); //@ins-bf
    if (bf > 1 && key < node->left->key) //@ins-LL
        return rotateRight(node);
    if (bf < -1 && key > node->right->key) //@ins-RR
        return rotateLeft(node);
    if (bf > 1 && key > node->left->key) { //@ins-LR
        node->left = rotateLeft(node->left);
        return rotateRight(node);
    }
    if (bf < -1 && key < node->right->key) { //@ins-RL
        node->right = rotateRight(node->right);
        return rotateLeft(node);
    }
    return node; //@ins-ok
}
