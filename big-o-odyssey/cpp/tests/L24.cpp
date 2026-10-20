#include "harness.h"
#include "../tree_props.cpp"
#include "../tree_traversals.cpp"
#include "../tree_iterative.cpp"
#include "tree_io.h"

int main() {
    string cmd;
    while (cin >> cmd) {  // trav <tree>
        TNode* t = parseTree(cin);
        cout << captured(inorder, t) << "| " << captured(preorder, t) << "| " << captured(postorder, t) << "| " << captured(iterInorder, t) << "| " << captured(levelOrder, t) << "\n";
    }
}
