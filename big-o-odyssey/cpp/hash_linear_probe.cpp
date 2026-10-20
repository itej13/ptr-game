// @title Open addressing: linear probing
// @desc Table of M slots holding keys ≥ 0; EMPTY marks a free slot (fill ht with EMPTY first). Probe h(k), h(k)+1, … (mod M) until a free slot or the key itself.
const int M = 11;
const int EMPTY = -1;
int ht[M];

int hashProbe(int key) { return key % M; }

bool probeInsert(int key) {
    int h = hashProbe(key); //@ins-hash
    for (int i = 0; i < M; i++) { //@ins-loop
        int j = (h + i) % M; //@ins-probe
        if (ht[j] == EMPTY || ht[j] == key) { //@ins-check
            ht[j] = key; //@ins-store
            return true;
        }
    }
    return false; //@ins-full
}

int probeSearch(int key) {
    int h = hashProbe(key); //@s-hash
    for (int i = 0; i < M; i++) {
        int j = (h + i) % M; //@s-probe
        if (ht[j] == EMPTY) //@s-empty
            return -1;
        if (ht[j] == key) //@s-hit
            return j;
    }
    return -1; //@s-miss
}
