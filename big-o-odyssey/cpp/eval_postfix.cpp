// @title Evaluate postfix
// @desc Single-digit operands; + - * / with C++ integer division. The right operand is popped first.
int evalPostfix(const string& postfix) {
    int st[100];
    int top = -1;
    for (char c : postfix) {
        if (isdigit(c)) //@operand
            st[++top] = c - '0';
        else {
            int b = st[top--]; //@popb
            int a = st[top--]; //@popa
            if (c == '+') //@apply
                st[++top] = a + b;
            else if (c == '-')
                st[++top] = a - b;
            else if (c == '*')
                st[++top] = a * b;
            else
                st[++top] = a / b;
        }
    }
    return st[top]; //@result
}
