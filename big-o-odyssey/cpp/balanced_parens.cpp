// @title Balanced brackets (bonus)
// @desc Classic stack application: every closer must match the most recent unmatched opener.
bool isBalanced(const string& s) {
    char st[100];
    int t = -1;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{')
            st[++t] = c;
        else if (c == ')' || c == ']' || c == '}') {
            if (t == -1)
                return false;
            char open = st[t--];
            if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{'))
                return false;
        }
    }
    return t == -1;
}
