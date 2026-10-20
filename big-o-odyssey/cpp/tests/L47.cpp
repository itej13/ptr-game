#include "harness.h"
#include "../fractional_knapsack.cpp"

int main() {
    string cmd;
    while (cin >> cmd) {  // fk W n (v w)...
        int W, n;
        cin >> W >> n;
        vector<Item> items(n);
        for (auto& it : items) cin >> it.value >> it.weight;
        cout << fixed << setprecision(4) << fractionalKnapsack(W, items) << "\n";
    }
}
