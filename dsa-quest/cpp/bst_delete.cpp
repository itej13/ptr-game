// @title BST delete
// @desc Three cases: leaf → remove; one child → splice the child up; two children → copy the inorder successor (leftmost node of the right subtree) and delete it from the right subtree.
TNode* deleteNode(TNode* root, int key) {
    if (root == nullptr) //@d-null
        return nullptr;
    if (key < root->data) //@d-lt
        root->left = deleteNode(root->left, key);
    else if (key > root->data) //@d-gt
        root->right = deleteNode(root->right, key);
    else {
        if (root->left == nullptr) { //@d-noleft
            TNode* r = root->right;
            delete root;
            return r;
        }
        if (root->right == nullptr) { //@d-noright
            TNode* l = root->left;
            delete root;
            return l;
        }
        TNode* s = root->right; //@d-succ
        while (s->left != nullptr)
            s = s->left;
        root->data = s->data; //@d-copy
        root->right = deleteNode(root->right, s->data); //@d-rec
    }
    return root;
}
