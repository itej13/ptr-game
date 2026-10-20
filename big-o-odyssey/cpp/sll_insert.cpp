// @title Singly linked list — insertion
// @desc Node = data + next; head is the first node (nullptr when empty). insertAt uses 0-based positions (0 ≤ pos ≤ length).
struct Node {
    int data;
    Node* next;
};

Node* head = nullptr;

void insertBegin(int x) {
    Node* t = new Node{x, head}; //@ib-new
    head = t; //@ib-head
}

void insertEnd(int x) {
    Node* t = new Node{x, nullptr}; //@ie-new
    if (head == nullptr) { //@ie-empty
        head = t;
        return;
    }
    Node* p = head; //@ie-p
    while (p->next != nullptr) //@ie-walk
        p = p->next;
    p->next = t; //@ie-link
}

void insertAt(int pos, int x) {
    if (pos == 0) { //@ia-zero
        insertBegin(x);
        return;
    }
    Node* p = head; //@ia-p
    for (int i = 0; i < pos - 1 && p != nullptr; i++) //@ia-walk
        p = p->next;
    if (p == nullptr) { //@ia-check
        cout << "Invalid position\n";
        return;
    }
    p->next = new Node{x, p->next}; //@ia-link
}
