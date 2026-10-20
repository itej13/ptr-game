#include "harness.h"
#include "../stack_array.cpp"
#include "../balanced_parens.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {
        if (cmd == "ops") {  // ops k op... where op = push:x | pop | peek ; prints results space-separated
            int k;
            cin >> k;
            top = -1;
            string out;
            stringstream buf;
            streambuf* old = cout.rdbuf(buf.rdbuf());
            for (int i = 0; i < k; i++) {
                string op;
                cin >> op;
                if (op.rfind("push:", 0) == 0) push(stoi(op.substr(5)));
                else if (op == "pop") out += to_string(pop()) + " ";
                else if (op == "peek") out += to_string(peek()) + " ";
            }
            cout.rdbuf(old);
            int msgs = 0;
            for (char ch : buf.str()) msgs += ch == '\n';
            cout << out << "| " << top << " | m" << msgs << "\n";
        } else if (cmd == "bal") {
            string s;
            cin >> s;
            cout << (isBalanced(s) ? "yes" : "no") << "\n";
        }
    }
}
