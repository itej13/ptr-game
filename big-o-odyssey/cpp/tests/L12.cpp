#include "harness.h"
#include "../circular_queue.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // ops k op...  op = enq:x | deq ; prints dequeued values, printed messages, final front/rear
        int k;
        cin >> k;
        front = rear = 0;
        stringstream buf;
        streambuf* old = cout.rdbuf(buf.rdbuf());
        string out;
        for (int i = 0; i < k; i++) {
            string op;
            cin >> op;
            if (op.rfind("enq:", 0) == 0) enqueue(stoi(op.substr(4)));
            else out += to_string(dequeue()) + " ";
        }
        cout.rdbuf(old);
        string msgs = buf.str();
        int full = 0, empty = 0;
        for (size_t p = 0; (p = msgs.find("Queue full", p)) != string::npos; p++) full++;
        for (size_t p = 0; (p = msgs.find("Queue empty", p)) != string::npos; p++) empty++;
        cout << out << "| f" << full << " e" << empty << " | " << front << " " << rear << "\n";
    }
}
