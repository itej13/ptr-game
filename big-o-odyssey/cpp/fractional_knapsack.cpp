// @title Fractional knapsack (greedy)
// @desc Items may be split. Take items in decreasing value/weight ratio; take a fraction of the first one that doesn't fit. Ratios are compared by cross-multiplication (no floating-point error). Lab Experiment 6.
struct Item {
    int value, weight;
};

double fractionalKnapsack(int W, vector<Item> items) {
    sort(items.begin(), items.end(), [](const Item& a, const Item& b) {
        return a.value * b.weight > b.value * a.weight; // a.value/a.weight > b.value/b.weight
    }); //@sort
    double total = 0;
    for (const Item& it : items) { //@loop
        if (W == 0) //@full
            break;
        if (it.weight <= W) { //@whole
            total += it.value;
            W -= it.weight;
        } else {
            total += (double)it.value * W / it.weight; //@part
            W = 0;
        }
    }
    return total;
}
