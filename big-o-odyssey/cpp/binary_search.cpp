// @title Binary search (iterative)
// @desc a[0..n-1] is sorted ascending. Return an index where a[index] == key, or -1.
int binarySearch(int a[], int n, int key) {
    int low = 0, high = n - 1; //@init
    while (low <= high) { //@loop
        int mid = low + (high - low) / 2; //@mid
        if (a[mid] == key) //@eq
            return mid; //@found
        else if (a[mid] < key) //@lt
            low = mid + 1; //@right
        else
            high = mid - 1; //@left
    }
    return -1; //@notfound
}
