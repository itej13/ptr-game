// @title Job sequencing with deadlines (greedy)
// @desc Unit-time jobs, one machine. Consider jobs in decreasing profit (stable); put each in the LATEST free time slot ≤ its deadline, or skip it. slot[t] = job run in time unit t (1-based). n ≥ 1.
int jobSequencing(const vector<int>& deadline, const vector<int>& profit, vector<int>& slot) {
    int n = deadline.size();
    vector<int> idx(n);
    for (int i = 0; i < n; i++)
        idx[i] = i;
    stable_sort(idx.begin(), idx.end(), [&](int a, int b) { return profit[a] > profit[b]; }); //@sort
    int maxD = *max_element(deadline.begin(), deadline.end());
    slot.assign(maxD + 1, -1);
    int total = 0;
    for (int j : idx) //@loop
        for (int t = deadline[j]; t >= 1; t--) //@scan
            if (slot[t] == -1) { //@free
                slot[t] = j; //@place
                total += profit[j];
                break;
            }
    return total;
}
