#include "harness.h"
#include "../huffman.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // huff n (char freq)...
        int n;
        cin >> n;
        vector<char> cs(n);
        vector<int> fs(n);
        for (int i = 0; i < n; i++) cin >> cs[i] >> fs[i];
        for (auto& [c, code] : huffman(cs, fs)) cout << c << "=" << code << " ";
        cout << "\n";
    }
}
