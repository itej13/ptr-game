#include "harness.h"
#include "../linked_stack_queue.cpp"
#include "../poly_add.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {
        if (cmd == "stack" || cmd == "queue") {  // k op... op = p:x | o  (add / remove)
            int k;
            cin >> k;
            while (top) pop();
            while (front) dequeue();
            stringstream buf;
            streambuf* old = cout.rdbuf(buf.rdbuf());
            string out;
            for (int i = 0; i < k; i++) {
                string op;
                cin >> op;
                if (op[0] == 'p') {
                    if (cmd == "stack") push(stoi(op.substr(2)));
                    else enqueue(stoi(op.substr(2)));
                } else out += to_string(cmd == "stack" ? pop() : dequeue()) + " ";
            }
            cout.rdbuf(old);
            string rest;
            if (cmd == "stack") for (SNode* p = top; p; p = p->next) rest += to_string(p->data) + " ";
            else for (QNode* p = front; p; p = p->next) rest += to_string(p->data) + " ";
            cout << out << "| " << rest << "\n";
        } else if (cmd == "poly") {  // na c e c e ... nb c e ...
            Term* lists[2] = {nullptr, nullptr};
            for (Term*& L : lists) {
                int n;
                cin >> n;
                Term** tail = &L;
                for (int i = 0; i < n; i++) {
                    int c, e;
                    cin >> c >> e;
                    *tail = new Term{c, e, nullptr};
                    tail = &(*tail)->next;
                }
            }
            for (Term* p = addPoly(lists[0], lists[1]); p; p = p->next) cout << p->coef << "x" << p->exp << " ";
            cout << "\n";
        }
    }
}
