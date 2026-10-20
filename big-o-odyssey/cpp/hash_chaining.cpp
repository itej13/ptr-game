// @title Hash table with separate chaining
// @desc B buckets, each a linked list; h(k) = k mod B (keys ≥ 0). New keys go to the FRONT of their chain, so insert is O(1); search walks one chain.
const int B = 10;

struct HNode {
    int key;
    HNode* next;
};

HNode* bucket[B]; // globals start as nullptr

int hashChain(int key) { return key % B; }

void chainInsert(int key) {
    int h = hashChain(key); //@ins-hash
    bucket[h] = new HNode{key, bucket[h]}; //@ins-front
}

bool chainSearch(int key) {
    for (HNode* p = bucket[hashChain(key)]; p != nullptr; p = p->next) //@s-walk
        if (p->key == key) //@s-cmp
            return true;
    return false; //@s-miss
}
