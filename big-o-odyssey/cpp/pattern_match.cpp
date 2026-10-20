// @title Naive pattern matching
// @desc Return the first index where pat occurs in text, or -1. Uses length() from the string-ops snippet.
int patternMatch(const char text[], const char pat[]) {
    int n = length(text), m = length(pat); //@init
    for (int i = 0; i + m <= n; i++) { //@shift
        int j = 0; //@reset
        while (j < m && text[i + j] == pat[j]) //@cmp
            j++; //@adv
        if (j == m) //@check
            return i; //@found
    }
    return -1; //@notfound
}
