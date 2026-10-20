// @title Infix → postfix
// @desc Operands are single letters/digits; operators + - * / ^ and ( ). ^ is right-associative, the rest left-associative.
int prec(char op) {
    if (op == '^')
        return 3;
    if (op == '*' || op == '/')
        return 2;
    if (op == '+' || op == '-')
        return 1;
    return 0; // '('
}

string toPostfix(const string& infix) {
    char st[100];
    int top = -1;
    string out;
    for (char c : infix) {
        if (isalnum(c)) //@operand
            out += c;
        else if (c == '(') //@lparen
            st[++top] = c;
        else if (c == ')') { //@rparen
            while (st[top] != '(')
                out += st[top--];
            top--; // discard '('
        } else {
            while (top >= 0 && (prec(st[top]) > prec(c) || (prec(st[top]) == prec(c) && c != '^'))) //@popop
                out += st[top--];
            st[++top] = c; //@pushop
        }
    }
    while (top >= 0) //@flush
        out += st[top--];
    return out;
}
