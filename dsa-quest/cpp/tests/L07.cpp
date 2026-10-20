#include "harness.h"
#include "../bubble_sort.cpp"
#include "../selection_sort.cpp"
#include "../insertion_sort.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // <cmd> n a0..a(n-1)  ->  sorted | swap log
        int n;
        cin >> n;
        vector<int> a = readInts(cin, n);
        g_swaps.clear();
        g_base = a.data();
        if (cmd == "bubble") bubbleSort(a.data(), n);
        else if (cmd == "selection") selectionSort(a.data(), n);
        else if (cmd == "insertion") insertionSort(a.data(), n);
        g_base = nullptr;
        printInts(a);
        cout << " | ";
        printSwaps();
        cout << "\n";
    }
}
