// @title Iterative inorder & level order
// @desc Inorder with an explicit stack (Horowitz–Sahni iterInorder); level order with a queue. Both use plain arrays (up to 100 nodes).
void iterInorder(TNode* t) {
    TNode* st[100];
    int top = -1;
    while (true) {
        for (; t != nullptr; t = t->left) //@it-push
            st[++top] = t;
        if (top == -1) //@it-empty
            break;
        t = st[top--]; //@it-pop
        cout << t->data << " "; //@it-visit
        t = t->right; //@it-right
    }
}

void levelOrder(TNode* t) {
    if (t == nullptr)
        return;
    TNode* q[100];
    int front = 0, rear = 0;
    q[rear++] = t; //@lv-start
    while (front < rear) { //@lv-loop
        TNode* p = q[front++]; //@lv-deq
        cout << p->data << " "; //@lv-visit
        if (p->left != nullptr) //@lv-left
            q[rear++] = p->left;
        if (p->right != nullptr) //@lv-right
            q[rear++] = p->right;
    }
}
