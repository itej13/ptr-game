// @title Circular linked list
// @desc Keep a pointer to the LAST node; last->next is the first node. Insert at front or end, and delete the front, all in O(1).
struct CNode {
    int data;
    CNode* next;
};

CNode* last = nullptr;

void insertFront(int x) {
    CNode* t = new CNode{x, nullptr}; //@if-new
    if (last == nullptr) { //@if-empty
        t->next = t;
        last = t;
        return;
    }
    t->next = last->next; //@if-link
    last->next = t; //@if-close
}

void insertEnd(int x) {
    insertFront(x); //@ie-front
    last = last->next; //@ie-advance
}

void deleteFront() {
    if (last == nullptr) //@df-empty
        return;
    CNode* first = last->next; //@df-first
    if (first == last) //@df-single
        last = nullptr;
    else
        last->next = first->next; //@df-bypass
    delete first; //@df-free
}

void display() {
    if (last == nullptr)
        return;
    CNode* p = last->next;
    do {
        cout << p->data << " ";
        p = p->next;
    } while (p != last->next); //@disp-stop
    cout << "\n";
}
