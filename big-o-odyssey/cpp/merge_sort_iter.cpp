// @title Merge sort (iterative, bottom-up)
// @desc Lab Experiment 1's second version: merge runs of width 1, 2, 4, … with the same merge(). No recursion.
void mergeSortIterative(int a[], int n) {
    for (int width = 1; width < n; width *= 2) //@width
        for (int l = 0; l < n - width; l += 2 * width) { //@pair
            int m = l + width - 1; //@m
            int r = min(l + 2 * width - 1, n - 1); //@r
            merge(a, l, m, r); //@merge
        }
}
