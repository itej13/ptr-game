// @title Binary search (recursive)
// @desc Search sorted a[low..high] for key; first call binarySearchRec(a, 0, n - 1, key). Return an index or -1.
int binarySearchRec(int a[], int low, int high, int key) {
    if (low > high) //@base
        return -1; //@notfound
    int mid = low + (high - low) / 2; //@mid
    if (a[mid] == key) //@eq
        return mid; //@found
    if (a[mid] < key) //@lt
        return binarySearchRec(a, mid + 1, high, key); //@right
    return binarySearchRec(a, low, mid - 1, key); //@left
}
