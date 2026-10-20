#include "harness.h"
#include "../string_ops.cpp"
#include "../pattern_match.cpp"
#include "../kmp_search.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {
        if (cmd == "len") {  // len word
            string s;
            cin >> s;
            cout << length(s.c_str()) << "\n";
        } else if (cmd == "concat") {  // concat a b
            string a, b;
            cin >> a >> b;
            vector<char> buf(a.size() + b.size() + 1);
            memcpy(buf.data(), a.c_str(), a.size() + 1);
            concat(buf.data(), b.c_str());
            cout << buf.data() << "\n";
        } else if (cmd == "substr") {  // substr word pos len
            string s;
            int pos, len;
            cin >> s >> pos >> len;
            vector<char> out(len + 1);
            substring(s.c_str(), pos, len, out.data());
            cout << out.data() << "\n";
        } else if (cmd == "match" || cmd == "kmp") {  // match text pat
            string t, p;
            cin >> t >> p;
            cout << (cmd == "match" ? patternMatch(t.c_str(), p.c_str()) : kmpSearch(t.c_str(), p.c_str())) << "\n";
        }
    }
}
