// @title Stack and queue as linked lists
// @desc No capacity limit. Stack: push/pop at the head (top). Queue: enqueue at rear, dequeue at front — keep both pointers so each is O(1).
struct SNode {
    int data;
    SNode* next;
};
SNode* top = nullptr;

void push(int x) {
    top = new SNode{x, top}; //@push
}

int pop() {
    if (top == nullptr) { //@pop-empty
        cout << "Stack underflow\n";
        return -1;
    }
    SNode* t = top; //@pop-take
    int x = t->data;
    top = t->next; //@pop-advance
    delete t;
    return x;
}

struct QNode {
    int data;
    QNode* next;
};
QNode* front = nullptr;
QNode* rear = nullptr;

void enqueue(int x) {
    QNode* t = new QNode{x, nullptr}; //@enq-new
    if (rear == nullptr) //@enq-empty
        front = rear = t;
    else {
        rear->next = t; //@enq-link
        rear = t; //@enq-rear
    }
}

int dequeue() {
    if (front == nullptr) { //@deq-empty
        cout << "Queue empty\n";
        return -1;
    }
    QNode* t = front; //@deq-take
    int x = t->data;
    front = front->next; //@deq-advance
    if (front == nullptr) //@deq-last
        rear = nullptr;
    delete t;
    return x;
}
