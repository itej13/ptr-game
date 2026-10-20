// @title Quick sort (Lomuto, CLRS)
// @desc Other convention: pivot = a[high]; i marks the end of the "≤ pivot" region. Simpler to prove, more swaps than the two-pointer version.
int partitionLomuto(int a[], int low, int high) {
    int p = a[high];
    int i = low - 1;
    for (int j = low; j < high; j++)
        if (a[j] <= p)
            swap(a[++i], a[j]);
    swap(a[i + 1], a[high]);
    return i + 1;
}

void quickSortLomuto(int a[], int low, int high) {
    if (low < high) {
        int pi = partitionLomuto(a, low, high);
        quickSortLomuto(a, low, pi - 1);
        quickSortLomuto(a, pi + 1, high);
    }
}
