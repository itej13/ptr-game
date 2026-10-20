#include "harness.h"
#include "../sll_insert.cpp"
#include "../sll_delete_search.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // ops k op...  op = b:x | e:x | a:pos:x | d:x | s:x   -> outputs | list
        int k;
        cin >> k;
        while (head) { Node* t = head; head = head->next; delete t; }
        string out;
        stringstream buf;
        streambuf* old = cout.rdbuf(buf.rdbuf());
        for (int i = 0; i < k; i++) {
            string op;
            cin >> op;
            char c = op[0];
            string rest = op.substr(2);
            if (c == 'b') insertBegin(stoi(rest));
            else if (c == 'e') insertEnd(stoi(rest));
            else if (c == 'a') { size_t p = rest.find(':'); insertAt(stoi(rest.substr(0, p)), stoi(rest.substr(p + 1))); }
            else if (c == 'd') out += deleteValue(stoi(rest)) ? "T " : "F ";
            else if (c == 's') out += to_string(search(stoi(rest))) + " ";
        }
        string msgs = buf.str();
        buf.str("");
        display();
        string list = buf.str();
        cout.rdbuf(old);
        int bad = 0;
        for (size_t p = 0; (p = msgs.find("Invalid", p)) != string::npos; p++) bad++;
        list.pop_back();  // trailing newline
        cout << out << "| i" << bad << " | " << list << "\n";
    }
}
