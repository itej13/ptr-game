#include "harness.h"
#include "../infix_postfix.cpp"
#include "../infix_prefix.cpp"
#include "../eval_postfix.cpp"

int main() {
    string cmd, s;
    while (cin >> cmd >> s) {
        if (cmd == "post") cout << toPostfix(s) << "\n";
        else if (cmd == "pre") cout << toPrefix(s) << "\n";
        else if (cmd == "eval") cout << evalPostfix(s) << "\n";
    }
}
