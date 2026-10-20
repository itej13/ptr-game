#include "harness.h"
#include "../hash_chaining.cpp"
#include "../hash_linear_probe.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {
        int k, q;
        cin >> k;
        vector<int> keys = readInts(cin, k);
        cin >> q;
        vector<int> qs = readInts(cin, q);
        if (cmd == "chain") {  // -> each bucket's chain | search hits
            for (int i = 0; i < B; i++) { while (bucket[i]) { HNode* t = bucket[i]; bucket[i] = t->next; delete t; } }
            for (int x : keys) chainInsert(x);
            string out;
            for (int i = 0; i < B; i++) {
                out += to_string(i) + ":";
                for (HNode* p = bucket[i]; p; p = p->next) out += to_string(p->key) + ",";
                out += " ";
            }
            out += "|";
            for (int x : qs) out += chainSearch(x) ? " Y" : " N";
            cout << out << "\n";
        } else {  // probe -> table | insert results | search results
            for (int i = 0; i < M; i++) ht[i] = EMPTY;
            string ins;
            for (int x : keys) ins += probeInsert(x) ? "T" : "F";
            string out;
            for (int i = 0; i < M; i++) out += to_string(ht[i]) + " ";
            out += "| " + ins + " |";
            for (int x : qs) out += " " + to_string(probeSearch(x));
            cout << out << "\n";
        }
    }
}
