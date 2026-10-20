// @title BST search & insert
// @desc Binary search tree: every key in the left subtree < node < every key in the right subtree. Duplicates are ignored. Uses TNode.
TNode* search(TNode* root, int key) {
    while (root != nullptr && root->data != key) //@s-loop
        root = (key < root->data) ? root->left : root->right; //@s-step
    return root; //@s-ret
}

TNode* insert(TNode* root, int key) {
    if (root == nullptr) //@i-null
        return new TNode{key, nullptr, nullptr}; //@i-new
    if (key < root->data) //@i-lt
        root->left = insert(root->left, key); //@i-left
    else if (key > root->data) //@i-gt
        root->right = insert(root->right, key); //@i-right
    return root; //@i-ret
}
