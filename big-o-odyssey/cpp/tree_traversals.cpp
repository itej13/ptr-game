// @title Recursive traversals
// @desc Uses TNode from the tree-properties snippet. Inorder = L V R, preorder = V L R, postorder = L R V.
void inorder(TNode* t) {
    if (t != nullptr) { //@in-check
        inorder(t->left); //@in-left
        cout << t->data << " "; //@in-visit
        inorder(t->right); //@in-right
    }
}

void preorder(TNode* t) {
    if (t != nullptr) { //@pre-check
        cout << t->data << " "; //@pre-visit
        preorder(t->left); //@pre-left
        preorder(t->right); //@pre-right
    }
}

void postorder(TNode* t) {
    if (t != nullptr) { //@post-check
        postorder(t->left); //@post-left
        postorder(t->right); //@post-right
        cout << t->data << " "; //@post-visit
    }
}
