#include "harness.h"
#include "../tree_props.cpp"
#include "../bst_search_insert.cpp"
#include "tree_io.h"

int main() {
    string cmd;
    while (cin >> cmd) {  // bst k keys... q queries...
        int k, q;
        cin >> k;
        TNode* root = nullptr;
        for (int i = 0; i < k; i++) { int x; cin >> x; root = insert(root, x); }
        cin >> q;
        string out;
        for (int i = 0; i < q; i++) { int x; cin >> x; out += search(root, x) ? "Y" : "N"; }
        string s;
        serialise(root, s);
        cout << s << "| " << out << "\n";
    }
}
