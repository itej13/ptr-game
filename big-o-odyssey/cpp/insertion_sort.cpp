// @title Insertion sort
// @desc Sort a[0..n-1] ascending by inserting each element into the sorted prefix.
void insertionSort(int a[], int n) {
    for (int i = 1; i < n; i++) { //@pass
        int key = a[i]; //@key
        int j = i - 1; //@init
        while (j >= 0 && a[j] > key) { //@cmp
            a[j + 1] = a[j]; //@shift
            j--;
        }
        a[j + 1] = key; //@place
    }
}
