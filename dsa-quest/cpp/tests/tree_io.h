// Binary-tree helpers for harnesses: parse "preorder with # for null" and serialise back.
inline TNode* parseTree(istream& in) {
    string tok;
    in >> tok;
    if (tok == "#") return nullptr;
    TNode* t = new TNode{stoi(tok), nullptr, nullptr};
    t->left = parseTree(in);
    t->right = parseTree(in);
    return t;
}
inline void serialise(TNode* t, string& out) {
    if (!t) { out += "# "; return; }
    out += to_string(t->data) + " ";
    serialise(t->left, out);
    serialise(t->right, out);
}
inline string captured(void (*f)(TNode*), TNode* t) {
    stringstream buf;
    streambuf* old = cout.rdbuf(buf.rdbuf());
    f(t);
    cout.rdbuf(old);
    return buf.str();
}
