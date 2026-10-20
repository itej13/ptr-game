// @title Doubly linked list
// @desc Each node has prev and next. Inserting/deleting next to a known node is O(1) — no need to find the predecessor.
struct DNode {
    int data;
    DNode* prev;
    DNode* next;
};

DNode* head = nullptr;

void insertBegin(int x) {
    DNode* t = new DNode{x, nullptr, head}; //@ib-new
    if (head != nullptr) //@ib-fix
        head->prev = t;
    head = t; //@ib-head
}

void insertEnd(int x) {
    DNode* t = new DNode{x, nullptr, nullptr}; //@ie-new
    if (head == nullptr) {
        head = t;
        return;
    }
    DNode* p = head;
    while (p->next != nullptr) //@ie-walk
        p = p->next;
    p->next = t; //@ie-link
    t->prev = p; //@ie-back
}

void insertAfter(DNode* p, int x) {
    DNode* t = new DNode{x, p, p->next}; //@ia-new
    if (p->next != nullptr) //@ia-fix
        p->next->prev = t;
    p->next = t; //@ia-link
}

void deleteNode(DNode* p) {
    if (p->prev != nullptr) //@dn-prev
        p->prev->next = p->next;
    else
        head = p->next; //@dn-head
    if (p->next != nullptr) //@dn-next
        p->next->prev = p->prev;
    delete p; //@dn-free
}
