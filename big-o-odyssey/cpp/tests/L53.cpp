#include "harness.h"
#include "../lcs.cpp"
#include "../edit_distance.cpp"
int main() {
    string cmd, a, b;
    while (cin >> cmd >> a >> b) {  // lcs X Y | edit a b   (use . for an empty string)
        if (a == ".") a = "";
        if (b == ".") b = "";
        if (cmd == "lcs") {
            string s;
            int l = lcs(a, b, s);
            cout << l << " " << (s.empty() ? "." : s) << "\n";
        } else cout << editDistance(a, b) << "\n";
    }
}
