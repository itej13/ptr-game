#include "harness.h"
#include "../priority_queue_array.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // ops k op... op = ins:x | del
        int k;
        cin >> k;
        n = 0;
        string out;
        stringstream buf;
        streambuf* old = cout.rdbuf(buf.rdbuf());
        for (int i = 0; i < k; i++) {
            string op;
            cin >> op;
            if (op.rfind("ins:", 0) == 0) insert(stoi(op.substr(4)));
            else out += to_string(deleteMax()) + " ";
        }
        cout.rdbuf(old);
        int msgs = 0;
        for (char ch : buf.str()) msgs += ch == '\n';
        cout << out << "m" << msgs << " |";
        for (int i = 0; i < n; i++) cout << " " << pq[i];
        cout << "\n";
    }
}
