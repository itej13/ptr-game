#include "harness.h"
#include "../btree_search.cpp"
#include "../btree_insert.cpp"

static void dump(BNode* x, string& out) {  // preorder: [k1 k2 ...] children...
    out += "[";
    for (int i = 0; i < x->n; i++) out += (i ? " " : "") + to_string(x->key[i]);
    out += "]";
    if (!x->leaf) {
        out += "(";
        for (int i = 0; i <= x->n; i++) dump(x->child[i], out);
        out += ")";
    }
}

int main() {
    string cmd;
    while (cin >> cmd) {  // bt k keys... q queries...  (order M = 5)
        int k, q;
        cin >> k;
        BNode* root = new BNode;
        for (int i = 0; i < k; i++) { int x; cin >> x; root = insert(root, x); }
        cin >> q;
        string hits;
        for (int i = 0; i < q; i++) { int x; cin >> x; hits += search(root, x) ? "Y" : "N"; }
        string s;
        dump(root, s);
        cout << s << " | " << hits << "\n";
    }
}
