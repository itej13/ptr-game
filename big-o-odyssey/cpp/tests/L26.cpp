#include "harness.h"
#include "../tree_props.cpp"
#include "../bst_search_insert.cpp"
#include "../bst_delete.cpp"
#include "tree_io.h"

int main() {
    string cmd;
    while (cin >> cmd) {  // del k keys... d deletes...
        int k, d;
        cin >> k;
        TNode* root = nullptr;
        for (int i = 0; i < k; i++) { int x; cin >> x; root = insert(root, x); }
        cin >> d;
        for (int i = 0; i < d; i++) { int x; cin >> x; root = deleteNode(root, x); }
        string s;
        serialise(root, s);
        cout << s << "\n";
    }
}
