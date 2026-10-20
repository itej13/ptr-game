#include "harness.h"
#include "../factorial.cpp"
#include "../hanoi.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {
        int n;
        cin >> n;
        if (cmd == "fact") cout << factorial(n) << "\n";
        else if (cmd == "hanoi") {  // print moves on one line: n:from>to ...
            stringstream buf;
            streambuf* old = cout.rdbuf(buf.rdbuf());
            hanoi(n, 'A', 'C', 'B');
            cout.rdbuf(old);
            string line, w1, w2, d, from, w3, to;
            string out;
            while (getline(buf, line)) {
                stringstream ls(line);
                ls >> w1 >> w2 >> d >> w3 >> from >> w3 >> to;  // Move disk d from X to Y
                out += d + ":" + from + ">" + to + " ";
            }
            cout << out << "\n";
        }
    }
}
