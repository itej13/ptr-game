// @title Linear search
// @desc Return the index of the first occurrence of key in a[0..n-1], or -1.
int linearSearch(int a[], int n, int key) {
    for (int i = 0; i < n; i++) //@loop
        if (a[i] == key) //@cmp
            return i; //@found
    return -1; //@notfound
}
