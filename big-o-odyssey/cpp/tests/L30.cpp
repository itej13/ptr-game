#include "harness.h"
#include "../avl_rotations.cpp"
#include "../avl_insert.cpp"
#include "../avl_delete.cpp"

static void pre(AVLNode* t, string& out) {
    if (!t) { out += "# "; return; }
    out += to_string(t->key) + ":" + to_string(t->height) + " ";
    pre(t->left, out);
    pre(t->right, out);
}

int main() {
    string cmd;
    while (cin >> cmd) {  // avl k ops...  op = i:x | d:x  -> preorder key:height
        int k;
        cin >> k;
        AVLNode* root = nullptr;
        for (int i = 0; i < k; i++) {
            string op;
            cin >> op;
            int x = stoi(op.substr(2));
            root = op[0] == 'i' ? insert(root, x) : deleteKey(root, x);
        }
        string s;
        pre(root, s);
        cout << s << "\n";
    }
}
