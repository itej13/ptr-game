// @title Quick sort (first-element pivot)
// @desc Your DAA deck's version: pivot = a[low]; i scans right for an element > pivot, j scans left for an element ≤ pivot; swap while i < j; finally swap the pivot into a[j]. Call quickSort(a, 0, n - 1).
int partition(int a[], int low, int high) {
    int p = a[low]; //@pivot
    int i = low, j = high; //@init
    while (i < j) { //@loop
        while (a[i] <= p && i <= high - 1) //@scani
            i++;
        while (a[j] > p && j >= low + 1) //@scanj
            j--;
        if (i < j) //@check
            swap(a[i], a[j]); //@swap
    }
    swap(a[low], a[j]); //@place
    return j; //@ret
}

void quickSort(int a[], int low, int high) {
    if (low < high) { //@base
        int pi = partition(a, low, high); //@part
        quickSort(a, low, pi - 1); //@left
        quickSort(a, pi + 1, high); //@right
    }
}
