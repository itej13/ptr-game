#include "harness.h"
#include "../linear_search.cpp"
#include "../binary_search.cpp"
#include "../binary_search_rec.cpp"
#include "../interpolation_search.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // <cmd> n key a0..a(n-1)
        int n, key;
        cin >> n >> key;
        vector<int> a = readInts(cin, n);
        if (cmd == "linear") cout << linearSearch(a.data(), n, key) << "\n";
        else if (cmd == "binary") cout << binarySearch(a.data(), n, key) << "\n";
        else if (cmd == "binrec") cout << binarySearchRec(a.data(), 0, n - 1, key) << "\n";
        else if (cmd == "interp") cout << interpolationSearch(a.data(), n, key) << "\n";
    }
}
