// @title Stack using an array
// @desc Horowitz–Sahni style: a global array and a top index; top == -1 means empty. push/pop/peek are all O(1).
const int MAX = 100;
int stk[MAX];
int top = -1;

bool isEmpty() { return top == -1; }
bool isFull() { return top == MAX - 1; }

void push(int x) {
    if (isFull()) { //@full
        cout << "Stack overflow\n";
        return;
    }
    stk[++top] = x; //@push
}

int pop() {
    if (isEmpty()) { //@empty
        cout << "Stack underflow\n";
        return -1;
    }
    return stk[top--]; //@pop
}

int peek() {
    if (isEmpty()) {
        cout << "Stack is empty\n";
        return -1;
    }
    return stk[top]; //@peek
}
