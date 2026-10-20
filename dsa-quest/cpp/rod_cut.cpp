// @title Rod cutting (bottom-up DP)
// @desc price[i] = price of a piece of length i (price[0] = 0). r[j] = best revenue for a rod of length j, s[j] = length of its first piece (smallest on ties). Θ(n²).
int rodCut(const vector<int>& price, int n, vector<int>& s) {
    vector<int> r(n + 1, 0); //@init
    s.assign(n + 1, 0);
    for (int j = 1; j <= n; j++) { //@len
        int best = INT_MIN;
        for (int i = 1; i <= j; i++) //@first
            if (price[i] + r[j - i] > best) { //@cmp
                best = price[i] + r[j - i];
                s[j] = i;
            }
        r[j] = best; //@store
    }
    return r[n];
}
