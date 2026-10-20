// @title KMP search (bonus)
// @desc Knuth–Morris–Pratt. lps[i] = length of the longest proper prefix of pat[0..i] that is also a suffix of it. The text pointer never moves back. Returns first index or -1.
int kmpSearch(const char text[], const char pat[]) {
    int n = length(text), m = length(pat);
    if (m == 0)
        return 0;
    vector<int> lps(m, 0);
    for (int i = 1, len = 0; i < m;) { //@lps
        if (pat[i] == pat[len])
            lps[i++] = ++len;
        else if (len > 0)
            len = lps[len - 1];
        else
            lps[i++] = 0;
    }
    for (int i = 0, j = 0; i < n;) { //@scan
        if (text[i] == pat[j]) {
            i++;
            j++;
            if (j == m)
                return i - m; //@found
        } else if (j > 0)
            j = lps[j - 1]; //@fallback
        else
            i++;
    }
    return -1;
}
