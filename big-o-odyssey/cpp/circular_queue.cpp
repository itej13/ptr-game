// @title Circular queue (array)
// @desc Horowitz–Sahni convention: front is one slot behind the first element, rear is the last element. One slot always stays empty, so it holds at most MAX − 1 items.
const int MAX = 8;
int q[MAX];
int front = 0, rear = 0;

bool isEmpty() { return front == rear; }
bool isFull() { return (rear + 1) % MAX == front; }

void enqueue(int x) {
    if (isFull()) { //@full
        cout << "Queue full\n";
        return;
    }
    rear = (rear + 1) % MAX; //@advrear
    q[rear] = x; //@store
}

int dequeue() {
    if (isEmpty()) { //@empty
        cout << "Queue empty\n";
        return -1;
    }
    front = (front + 1) % MAX; //@advfront
    return q[front]; //@take
}
