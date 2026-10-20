// @title Polynomial addition (linked lists)
// @desc Each polynomial is a list of terms in decreasing exponent order. Merge like merging two sorted lists; equal exponents add, and zero coefficients are dropped.
struct Term {
    int coef, exp;
    Term* next;
};

Term* addPoly(Term* a, Term* b) {
    Term dummy{0, 0, nullptr};
    Term* tail = &dummy;
    while (a != nullptr && b != nullptr) { //@loop
        if (a->exp > b->exp) { //@a-bigger
            tail->next = new Term{a->coef, a->exp, nullptr};
            a = a->next;
        } else if (a->exp < b->exp) { //@b-bigger
            tail->next = new Term{b->coef, b->exp, nullptr};
            b = b->next;
        } else {
            int c = a->coef + b->coef; //@equal
            if (c != 0)
                tail->next = new Term{c, a->exp, nullptr};
            a = a->next;
            b = b->next;
        }
        if (tail->next != nullptr)
            tail = tail->next;
    }
    for (Term* r = (a != nullptr ? a : b); r != nullptr; r = r->next) { //@rest
        tail->next = new Term{r->coef, r->exp, nullptr};
        tail = tail->next;
    }
    return dummy.next;
}
