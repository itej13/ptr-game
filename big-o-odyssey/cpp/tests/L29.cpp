#include "harness.h"
#include "../heap_sort.cpp"
#include "../heap_pq.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {
        if (cmd == "sort" || cmd == "build") {  // n a...  -> array | swap log
            int n;
            cin >> n;
            vector<int> a = readInts(cin, n);
            g_swaps.clear();
            g_base = a.data();
            if (cmd == "sort") heapSort(a.data(), n);
            else for (int i = n / 2 - 1; i >= 0; i--) heapify(a.data(), n, i);
            g_base = nullptr;
            printInts(a);
            cout << " | ";
            printSwaps();
            cout << "\n";
        } else if (cmd == "pq") {  // k op...  op = i:x | d  -> deleted values | heap array
            int k;
            cin >> k;
            vector<int> a(64);
            int n = 0;
            string out;
            for (int i = 0; i < k; i++) {
                string op;
                cin >> op;
                if (op[0] == 'i') heapInsert(a.data(), n, stoi(op.substr(2)));
                else if (n > 0) out += to_string(heapDeleteMax(a.data(), n)) + " ";
            }
            cout << out << "| ";
            printInts(a, n);
            cout << "\n";
        }
    }
}
