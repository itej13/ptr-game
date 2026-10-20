// @title String length, concat, substring
// @desc Null-terminated char arrays, no library calls. dest/out must have room for the result.
int length(const char s[]) {
    int n = 0; //@len-init
    while (s[n] != '\0') //@len-loop
        n++;
    return n; //@len-ret
}

void concat(char dest[], const char src[]) {
    int i = length(dest), j = 0; //@cat-init
    while (src[j] != '\0') //@cat-loop
        dest[i++] = src[j++]; //@cat-copy
    dest[i] = '\0'; //@cat-end
}

void substring(const char s[], int pos, int len, char out[]) {
    for (int k = 0; k < len; k++) //@sub-loop
        out[k] = s[pos + k]; //@sub-copy
    out[len] = '\0'; //@sub-end
}
