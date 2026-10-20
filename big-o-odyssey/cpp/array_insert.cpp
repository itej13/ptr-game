// @title Insert into an array
// @desc Insert x at index pos (0 ≤ pos ≤ n) of a[0..n-1], capacity cap. Returns the new size, or -1 on overflow / invalid position.
int insertAt(int a[], int n, int cap, int pos, int x) {
    if (n == cap || pos < 0 || pos > n) //@check
        return -1;
    for (int i = n - 1; i >= pos; i--) //@loop
        a[i + 1] = a[i]; //@shift
    a[pos] = x; //@write
    return n + 1; //@ret
}
