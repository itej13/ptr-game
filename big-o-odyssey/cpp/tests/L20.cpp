#include "harness.h"
#include "../merge_sort.cpp"
#include "../merge_sort_iter.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // merge n a...  | sort n a...
        int n;
        cin >> n;
        vector<int> a = readInts(cin, n);
        if (cmd == "sort") {
            if (n) mergeSort(a.data(), 0, n - 1);
        } else if (cmd == "isort") {
            mergeSortIterative(a.data(), n);
        } else {  // merge: first half and second half each sorted, split at m = (n-1)/2
            int m = (n - 1) / 2;
            merge(a.data(), 0, m, n - 1);
        }
        printInts(a);
        cout << "\n";
    }
}
