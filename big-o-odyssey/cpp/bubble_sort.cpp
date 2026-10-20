// @title Bubble sort (optimised)
// @desc Sort a[0..n-1] ascending; stop early when a pass makes no swap.
void bubbleSort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) { //@pass
        bool swapped = false; //@flag
        for (int j = 0; j < n - i - 1; j++) { //@inner
            if (a[j] > a[j + 1]) { //@cmp
                swap(a[j], a[j + 1]); //@swap
                swapped = true;
            }
        }
        if (!swapped) //@check
            break; //@stop
    }
}
