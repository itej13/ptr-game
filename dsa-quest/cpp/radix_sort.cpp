// @title LSD radix sort
// @desc Non-negative integers, base 10: sort by the units digit, then tens, then hundreds… Each pass is a STABLE counting sort on one digit, so earlier passes break ties.
void countingSortByDigit(int a[], int n, int exp) {
    vector<int> out(n);
    int count[10] = {0};
    for (int i = 0; i < n; i++) //@count
        count[(a[i] / exp) % 10]++;
    for (int d = 1; d < 10; d++) //@prefix
        count[d] += count[d - 1];
    for (int i = n - 1; i >= 0; i--) //@place
        out[--count[(a[i] / exp) % 10]] = a[i];
    for (int i = 0; i < n; i++) //@copy
        a[i] = out[i];
}

void radixSort(int a[], int n) {
    if (n == 0)
        return;
    int mx = *max_element(a, a + n); //@max
    for (int exp = 1; mx / exp > 0; exp *= 10) //@pass
        countingSortByDigit(a, n, exp);
}
