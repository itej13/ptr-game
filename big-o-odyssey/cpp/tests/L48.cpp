#include "harness.h"
#include "../activity_selection.cpp"
#include "../job_sequencing.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {
        int n;
        cin >> n;
        vector<int> a(n), b(n);
        for (int i = 0; i < n; i++) cin >> a[i] >> b[i];
        if (cmd == "act") {  // (s f)...
            for (int i : selectActivities(a, b)) cout << i << " ";
            cout << "\n";
        } else {  // job: (deadline profit)...
            vector<int> slot;
            int t = jobSequencing(a, b, slot);
            cout << t << " |";
            for (size_t i = 1; i < slot.size(); i++) cout << " " << slot[i];
            cout << "\n";
        }
    }
}
