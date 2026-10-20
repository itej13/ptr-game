#include "harness.h"
#include "../quick_sort.cpp"
#include "../quick_sort_lomuto.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // part|sort|lpart|lsort n a...  -> result | swap log
        int n;
        cin >> n;
        vector<int> a = readInts(cin, n);
        g_swaps.clear();
        g_base = a.data();
        int r = -1;
        if (cmd == "part") r = partition(a.data(), 0, n - 1);
        else if (cmd == "sort") quickSort(a.data(), 0, n - 1);
        else if (cmd == "lpart") r = partitionLomuto(a.data(), 0, n - 1);
        else if (cmd == "lsort") quickSortLomuto(a.data(), 0, n - 1);
        g_base = nullptr;
        cout << r << " ";
        printInts(a);
        cout << " | ";
        printSwaps();
        cout << "\n";
    }
}
