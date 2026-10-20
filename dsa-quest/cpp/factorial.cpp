// @title Factorial (recursive)
// @desc n! = n · (n−1)!, with 0! = 1! = 1. Each call waits on the stack for the smaller one.
long long factorial(int n) {
    if (n <= 1) //@base
        return 1; //@ret1
    return n * factorial(n - 1); //@rec
}
