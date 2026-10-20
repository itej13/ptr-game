// Shared by all harnesses: headers, a swap() that logs index pairs, and array I/O.
// Protocol: each stdin line is "<command> <args...>", each answer is one stdout line.
#include <algorithm>
#include <cctype>
#include <climits>
#include <cstdlib>
#include <cstring>
#include <iomanip>
#include <iostream>
#include <map>
#include <queue>
#include <sstream>
#include <stack>
#include <string>
#include <utility>
#include <vector>
using namespace std;

static vector<pair<int, int>> g_swaps;
static const int* g_base = nullptr;
// Non-template, so it beats std::swap for int& arguments: lets us log which indices a snippet swaps.
void swap(int& x, int& y) {
    if (g_base) g_swaps.push_back({int(&x - g_base), int(&y - g_base)});
    int t = x;
    x = y;
    y = t;
}

inline vector<int> readInts(istream& in, int n) {
    vector<int> v(n);
    for (int& x : v) in >> x;
    return v;
}
inline void printInts(const vector<int>& v, int n = -1) {
    if (n < 0) n = (int)v.size();
    for (int i = 0; i < n; i++) cout << (i ? " " : "") << v[i];
}
inline void printSwaps() {
    for (size_t i = 0; i < g_swaps.size(); i++) cout << (i ? " " : "") << g_swaps[i].first << ":" << g_swaps[i].second;
}
