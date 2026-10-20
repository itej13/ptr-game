// @title Delete from an array
// @desc Delete the element at index pos (0 ≤ pos < n) of a[0..n-1]. Returns the new size, or -1 if pos is invalid.
int deleteAt(int a[], int n, int pos) {
    if (pos < 0 || pos >= n) //@check
        return -1;
    for (int i = pos; i < n - 1; i++) //@loop
        a[i] = a[i + 1]; //@shift
    return n - 1; //@ret
}
