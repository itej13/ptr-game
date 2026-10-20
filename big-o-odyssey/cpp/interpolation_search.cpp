// @title Interpolation search
// @desc a[0..n-1] sorted ascending (ideally uniformly spread). Probe where key "should" be. Return an index or -1.
int interpolationSearch(int a[], int n, int key) {
    int low = 0, high = n - 1; //@init
    while (low <= high && key >= a[low] && key <= a[high]) { //@loop
        if (a[high] == a[low]) //@same
            return (a[low] == key) ? low : -1;
        int pos = low + (key - a[low]) * (high - low) / (a[high] - a[low]); //@pos
        if (a[pos] == key) //@eq
            return pos; //@found
        if (a[pos] < key) //@lt
            low = pos + 1; //@right
        else
            high = pos - 1; //@left
    }
    return -1; //@notfound
}
