#include "harness.h"
#include "../tree_props.cpp"
#include "../threaded_tree.cpp"
#include "tree_io.h"

// Build an inorder-threaded copy of an ordinary binary tree, Horowitz–Sahni style, with a head node.
static ThNode* copyTree(TNode* t, vector<ThNode*>& order) {
    if (!t) return nullptr;
    ThNode* n = new ThNode{false, nullptr, t->data, nullptr, false};
    n->left = copyTree(t->left, order);
    order.push_back(n);
    n->right = copyTree(t->right, order);
    return n;
}

int main() {
    string cmd;
    while (cin >> cmd) {  // thr <tree>
        TNode* t = parseTree(cin);
        ThNode* head = new ThNode{false, nullptr, -1, nullptr, false};
        vector<ThNode*> order;
        ThNode* root = copyTree(t, order);
        head->right = head;
        if (!root) { head->left = head; head->leftThread = true; }
        else head->left = root;
        for (size_t i = 0; i < order.size(); i++) {
            ThNode* n = order[i];
            if (!n->left) { n->leftThread = true; n->left = i ? order[i - 1] : head; }
            if (!n->right) { n->rightThread = true; n->right = i + 1 < order.size() ? order[i + 1] : head; }
        }
        stringstream buf;
        streambuf* old = cout.rdbuf(buf.rdbuf());
        tinorder(head);
        cout.rdbuf(old);
        string succ;
        for (ThNode* n : order) { ThNode* s = insucc(n); succ += (s == head ? string("H") : to_string(s->data)) + " "; }
        cout << buf.str() << "| " << succ << "\n";
    }
}
