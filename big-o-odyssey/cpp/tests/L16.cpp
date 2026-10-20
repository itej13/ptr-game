#include "harness.h"
#include "../doubly_list.cpp"

static DNode* at(int pos) {
    DNode* p = head;
    while (p && pos-- > 0) p = p->next;
    return p;
}

int main() {
    string cmd;
    while (cin >> cmd) {  // ops k op... op = b:x | e:x | a:pos:x (insertAfter node #pos) | d:pos   -> forward | backward
        int k;
        cin >> k;
        while (head) deleteNode(head);
        for (int i = 0; i < k; i++) {
            string op;
            cin >> op;
            char c = op[0];
            string rest = op.substr(2);
            if (c == 'b') insertBegin(stoi(rest));
            else if (c == 'e') insertEnd(stoi(rest));
            else if (c == 'a') {
                size_t p = rest.find(':');
                DNode* n = at(stoi(rest.substr(0, p)));
                if (n) insertAfter(n, stoi(rest.substr(p + 1)));
            } else if (c == 'd') {
                DNode* n = at(stoi(rest));
                if (n) deleteNode(n);
            }
        }
        string fwd, bwd;
        DNode* tail = nullptr;
        for (DNode* p = head; p; p = p->next) { fwd += to_string(p->data) + " "; tail = p; }
        for (DNode* p = tail; p; p = p->prev) bwd += to_string(p->data) + " ";
        cout << fwd << "| " << bwd << "\n";
    }
}
