#include "harness.h"
#include "../disjoint_set.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // dsu n k ops...  op = u:a:b | f:x
        int n, k;
        cin >> n >> k;
        makeSet(n);
        string out;
        for (int i = 0; i < k; i++) {
            string op;
            cin >> op;
            if (op[0] == 'u') {
                size_t p = op.find(':', 2);
                out += unite(stoi(op.substr(2, p - 2)), stoi(op.substr(p + 1))) ? "T " : "F ";
            } else out += to_string(findSet(stoi(op.substr(2)))) + " ";
        }
        out += "|";
        for (int i = 0; i < n; i++) out += " " + to_string(parent[i]);
        cout << out << "\n";
    }
}
