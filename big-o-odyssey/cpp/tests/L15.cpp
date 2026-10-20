#include "harness.h"
#include "../circular_list.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // ops k op... op = f:x | e:x | d   -> display, plus a check that last->next is the first node
        int k;
        cin >> k;
        while (last) deleteFront();
        for (int i = 0; i < k; i++) {
            string op;
            cin >> op;
            if (op[0] == 'f') insertFront(stoi(op.substr(2)));
            else if (op[0] == 'e') insertEnd(stoi(op.substr(2)));
            else deleteFront();
        }
        stringstream buf;
        streambuf* old = cout.rdbuf(buf.rdbuf());
        display();
        cout.rdbuf(old);
        string s = buf.str();
        if (!s.empty()) s.pop_back();
        cout << s << "| last=" << (last ? to_string(last->data) : string("null")) << "\n";
    }
}
