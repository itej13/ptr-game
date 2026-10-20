// @title Huffman coding
// @desc Repeatedly merge the two least frequent trees (ties: the older node first); the first popped becomes the LEFT child (bit 0). Codes are the root-to-leaf paths. Lab Experiment 11.
struct HNode {
    int freq;
    char ch;
    HNode *left, *right;
    int id;
};

struct Cmp {
    bool operator()(HNode* a, HNode* b) const { return a->freq != b->freq ? a->freq > b->freq : a->id > b->id; }
};

void buildCodes(HNode* t, const string& code, map<char, string>& codes) {
    if (t->left == nullptr) { //@leaf
        codes[t->ch] = code.empty() ? "0" : code;
        return;
    }
    buildCodes(t->left, code + "0", codes); //@go-left
    buildCodes(t->right, code + "1", codes); //@go-right
}

map<char, string> huffman(const vector<char>& chars, const vector<int>& freq) {
    priority_queue<HNode*, vector<HNode*>, Cmp> pq;
    int id = 0;
    for (size_t i = 0; i < chars.size(); i++) //@leaves
        pq.push(new HNode{freq[i], chars[i], nullptr, nullptr, id++});
    while (pq.size() > 1) { //@loop
        HNode* a = pq.top(); //@pop
        pq.pop();
        HNode* b = pq.top();
        pq.pop();
        pq.push(new HNode{a->freq + b->freq, '\0', a, b, id++}); //@merge
    }
    map<char, string> codes;
    buildCodes(pq.top(), "", codes); //@codes
    return codes;
}
