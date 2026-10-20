// @title Tower of Hanoi
// @desc Move n disks from peg `from` to peg `to` using `via`, printing each move. Makes 2^n − 1 moves.
void hanoi(int n, char from, char to, char via) {
    if (n == 0) //@base
        return;
    hanoi(n - 1, from, via, to); //@first
    cout << "Move disk " << n << " from " << from << " to " << to << "\n"; //@move
    hanoi(n - 1, via, to, from); //@second
}
