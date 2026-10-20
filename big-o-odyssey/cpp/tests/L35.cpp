#include "harness.h"
#include "../radix_sort.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // radix n a...  -> array after each pass (via countingSortByDigit) | final via radixSort
        int n;
        cin >> n;
        vector<int> a = readInts(cin, n), b = a;
        string passes;
        if (n) {
            int mx = *max_element(a.begin(), a.end());
            for (int exp = 1; mx / exp > 0; exp *= 10) {
                countingSortByDigit(a.data(), n, exp);
                for (int x : a) passes += to_string(x) + " ";
                passes += "/ ";
            }
        }
        radixSort(b.data(), n);
        cout << passes << "| ";
        printInts(b);
        cout << "\n";
    }
}
