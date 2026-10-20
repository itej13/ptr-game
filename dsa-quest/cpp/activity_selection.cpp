// @title Activity selection (greedy)
// @desc One resource, activities [s, f). Sort by finish time (stable); take every activity that starts no earlier than the last chosen one finishes. Returns the chosen indices. Lab Experiment 7.
vector<int> selectActivities(const vector<int>& s, const vector<int>& f) {
    int n = s.size();
    vector<int> idx(n);
    for (int i = 0; i < n; i++)
        idx[i] = i;
    stable_sort(idx.begin(), idx.end(), [&](int a, int b) { return f[a] < f[b]; }); //@sort
    vector<int> chosen;
    int lastFinish = INT_MIN;
    for (int i : idx) //@loop
        if (s[i] >= lastFinish) { //@check
            chosen.push_back(i); //@take
            lastFinish = f[i];
        }
    return chosen;
}
