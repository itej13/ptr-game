#include "harness.h"
#include "../tree_props.cpp"
#include "tree_io.h"

int main() {
    string cmd;
    while (cin >> cmd) {  // props <tree>
        TNode* t = parseTree(cin);
        cout << height(t) << " " << countNodes(t) << " " << countLeaves(t) << "\n";
    }
}
