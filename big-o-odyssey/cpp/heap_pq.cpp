// @title Heap priority queue: insert & deleteMax
// @desc Insert: put x at the end and sift it up while it beats its parent. deleteMax: move the last element to the root and heapify down. Both O(log n). Uses heapify().
void heapInsert(int a[], int& n, int x) {
    int i = n++; //@ins-end
    a[i] = x;
    while (i > 0 && a[(i - 1) / 2] < a[i]) { //@ins-cmp
        swap(a[i], a[(i - 1) / 2]); //@ins-swap
        i = (i - 1) / 2; //@ins-up
    }
}

int heapDeleteMax(int a[], int& n) {
    int mx = a[0]; //@del-take
    a[0] = a[--n]; //@del-last
    heapify(a, n, 0); //@del-fix
    return mx;
}
