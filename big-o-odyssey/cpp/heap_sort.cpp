// @title Heapify & heap sort
// @desc Max-heap in a 0-based array: children of i are 2i+1 and 2i+2, parent is (i−1)/2. Build the heap bottom-up in O(n), then repeatedly move the max to the end.
void heapify(int a[], int n, int i) {
    int largest = i; //@hp-init
    int l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && a[l] > a[largest]) //@hp-left
        largest = l;
    if (r < n && a[r] > a[largest]) //@hp-right
        largest = r;
    if (largest != i) { //@hp-check
        swap(a[i], a[largest]); //@hp-swap
        heapify(a, n, largest); //@hp-rec
    }
}

void heapSort(int a[], int n) {
    for (int i = n / 2 - 1; i >= 0; i--) //@hs-build
        heapify(a, n, i);
    for (int i = n - 1; i > 0; i--) { //@hs-loop
        swap(a[0], a[i]); //@hs-swap
        heapify(a, i, 0); //@hs-fix
    }
}
