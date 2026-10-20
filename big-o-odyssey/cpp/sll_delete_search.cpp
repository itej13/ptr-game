// @title Singly linked list — delete, search, display
// @desc Uses Node and head from the insertion snippet. deleteValue removes the first node holding x; search returns a 0-based position or -1.
bool deleteValue(int x) {
    Node* cur = head; //@d-init
    Node* prev = nullptr;
    while (cur != nullptr && cur->data != x) { //@d-walk
        prev = cur;
        cur = cur->next;
    }
    if (cur == nullptr) //@d-none
        return false;
    if (prev == nullptr) //@d-first
        head = cur->next;
    else
        prev->next = cur->next; //@d-bypass
    delete cur; //@d-free
    return true;
}

int search(int x) {
    int pos = 0;
    for (Node* p = head; p != nullptr; p = p->next) { //@s-walk
        if (p->data == x) //@s-cmp
            return pos;
        pos++;
    }
    return -1; //@s-none
}

void display() {
    for (Node* p = head; p != nullptr; p = p->next)
        cout << p->data << " ";
    cout << "\n";
}
