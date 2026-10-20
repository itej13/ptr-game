// @title 0/1 knapsack by backtracking (with bounding)
// @desc Items sorted by value/weight, highest first. Explore include/exclude for item k; prune the exclude branch unless its fractional-greedy bound can still beat the best value found so far.
double bound(int k, int cv, int cw, int W, const vector<int>& wt, const vector<int>& val) {
    double b = cv; //@b-init
    int c = cw;
    for (int i = k; i < (int)wt.size(); i++) { //@b-loop
        if (c + wt[i] <= W) {
            c += wt[i];
            b += val[i];
        } else
            return b + (double)(W - c) * val[i] / wt[i]; //@b-frac
    }
    return b;
}

void bknap(int k, int cv, int cw, int W, const vector<int>& wt, const vector<int>& val, int& best) {
    if (k == (int)wt.size()) { //@leaf
        best = max(best, cv);
        return;
    }
    if (cw + wt[k] <= W) //@incl
        bknap(k + 1, cv + val[k], cw + wt[k], W, wt, val, best);
    if (bound(k + 1, cv, cw, W, wt, val) > best) //@excl
        bknap(k + 1, cv, cw, W, wt, val, best);
}
