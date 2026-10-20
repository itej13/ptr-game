#include "harness.h"
#include "../array_insert.cpp"
#include "../array_delete.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {
        if (cmd == "insert") {  // insert n cap pos x a0..a(n-1)
            int n, cap, pos, x;
            cin >> n >> cap >> pos >> x;
            vector<int> a(cap);  // exact capacity: ASan catches any write past it
            for (int i = 0; i < n; i++) cin >> a[i];
            int r = insertAt(a.data(), n, cap, pos, x);
            cout << r << " |";
            for (int i = 0; i < (r < 0 ? n : r); i++) cout << " " << a[i];
            cout << "\n";
        } else if (cmd == "delete") {  // delete n pos a...
            int n, pos;
            cin >> n >> pos;
            vector<int> a = readInts(cin, n);
            int r = deleteAt(a.data(), n, pos);
            cout << r << " |";
            for (int i = 0; i < (r < 0 ? n : r); i++) cout << " " << a[i];
            cout << "\n";
        }
    }
}
