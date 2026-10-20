// @title Threaded binary tree (inorder)
// @desc Horowitz–Sahni: a NULL left/right link is replaced by a thread to the inorder predecessor/successor, flagged by leftThread/rightThread. A head node's left points to the root; the first and last nodes' threads point to head.
struct ThNode {
    bool leftThread;
    ThNode* left;
    int data;
    ThNode* right;
    bool rightThread;
};

ThNode* insucc(ThNode* t) {
    ThNode* temp = t->right; //@succ-right
    if (!t->rightThread) //@succ-real
        while (!temp->leftThread) //@succ-down
            temp = temp->left;
    return temp; //@succ-ret
}

void tinorder(ThNode* head) {
    ThNode* t = head;
    for (;;) {
        t = insucc(t); //@tin-next
        if (t == head) //@tin-stop
            break;
        cout << t->data << " "; //@tin-visit
    }
}
