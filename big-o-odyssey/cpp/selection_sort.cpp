// @title Selection sort
// @desc Sort a[0..n-1] ascending by repeatedly selecting the minimum of the unsorted part.
void selectionSort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) { //@pass
        int minIdx = i; //@init
        for (int j = i + 1; j < n; j++) //@inner
            if (a[j] < a[minIdx]) //@cmp
                minIdx = j; //@newmin
        swap(a[i], a[minIdx]); //@swap
    }
}
