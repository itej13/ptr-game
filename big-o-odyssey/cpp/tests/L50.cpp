#include "harness.h"
#include "../rod_cut.cpp"
int main() {
    string cmd;
    while (cin >> cmd) {  // rod n p1..pn
        int n;
        cin >> n;
        vector<int> price(n + 1, 0);
        for (int i = 1; i <= n; i++) cin >> price[i];
        vector<int> s;
        int r = rodCut(price, n, s);
        cout << r << " |";
        for (int j = n; j > 0; j -= s[j]) cout << " " << s[j];
        cout << "\n";
    }
}
