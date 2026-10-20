// @title Infix → prefix
// @desc Reverse the infix, swap ( and ), convert like postfix but with associativity flipped (pop on equal precedence only for ^), then reverse the result. Uses prec() from infix → postfix.
string toPrefix(string infix) {
    reverse(infix.begin(), infix.end());
    for (char& c : infix) {
        if (c == '(')
            c = ')';
        else if (c == ')')
            c = '(';
    }
    char st[100];
    int top = -1;
    string out;
    for (char c : infix) {
        if (isalnum(c))
            out += c;
        else if (c == '(')
            st[++top] = c;
        else if (c == ')') {
            while (st[top] != '(')
                out += st[top--];
            top--;
        } else {
            while (top >= 0 && (prec(st[top]) > prec(c) || (prec(st[top]) == prec(c) && c == '^')))
                out += st[top--];
            st[++top] = c;
        }
    }
    while (top >= 0)
        out += st[top--];
    reverse(out.begin(), out.end());
    return out;
}
