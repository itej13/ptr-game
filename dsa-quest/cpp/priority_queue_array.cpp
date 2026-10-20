// @title Priority queue (unsorted array)
// @desc insert is O(1); deleteMax scans for the largest value, O(n), and fills the hole with the last element. The heap version (Level 29) makes both O(log n).
const int MAX = 100;
int pq[MAX];
int n = 0;

void insert(int x) {
    if (n == MAX) { //@full
        cout << "Overflow\n";
        return;
    }
    pq[n++] = x; //@append
}

int deleteMax() {
    if (n == 0) { //@empty
        cout << "Underflow\n";
        return -1;
    }
    int m = 0; //@init
    for (int i = 1; i < n; i++) //@scan
        if (pq[i] > pq[m]) //@cmp
            m = i;
    int x = pq[m]; //@take
    pq[m] = pq[--n]; //@fill
    return x;
}
