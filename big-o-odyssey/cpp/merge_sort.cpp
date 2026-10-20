// @title Merge sort
// @desc Sort a[l..r]: split at the middle, sort both halves recursively, merge them. Call mergeSort(a, 0, n - 1). Stable; Θ(n log n) always; Θ(n) extra space.
void merge(int a[], int l, int m, int r) {
    vector<int> L(a + l, a + m + 1), R(a + m + 1, a + r + 1); //@copy
    int i = 0, j = 0, k = l; //@init
    while (i < (int)L.size() && j < (int)R.size()) { //@loop
        if (L[i] <= R[j]) //@cmp
            a[k++] = L[i++]; //@takeL
        else
            a[k++] = R[j++]; //@takeR
    }
    while (i < (int)L.size()) //@restL
        a[k++] = L[i++];
    while (j < (int)R.size()) //@restR
        a[k++] = R[j++];
}

void mergeSort(int a[], int l, int r) {
    if (l < r) { //@base
        int m = l + (r - l) / 2; //@mid
        mergeSort(a, l, m); //@left
        mergeSort(a, m + 1, r); //@right
        merge(a, l, m, r); //@merge
    }
}
