#!/usr/bin/env bash
# Compiles every C++ harness in cpp/tests with warnings-as-errors + ASan/UBSan,
# and checks every snippet in cpp/ is exercised by some harness.
# Binaries land in build/cpp/ for src/crosscheck.test.ts to drive.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build/cpp
CXX=${CXX:-clang++}
FLAGS="-std=c++17 -O1 -g -Wall -Wextra -Werror -Wshadow -fsanitize=address,undefined -fno-omit-frame-pointer -fno-sanitize-recover=all"
fail=0
for snip in cpp/*.cpp; do
  name=$(basename "$snip")
  if ! grep -q "\"../$name\"" cpp/tests/*.cpp 2>/dev/null; then
    echo "✗ $name is not included by any harness in cpp/tests/"; fail=1
  fi
done
for t in cpp/tests/*.cpp; do
  out="build/cpp/$(basename "$t" .cpp)"
  if [[ ! -x "$out" || "$t" -nt "$out" || -n "$(find cpp -maxdepth 2 \( -name '*.cpp' -o -name '*.h' \) -newer "$out" -print -quit)" ]]; then
    if $CXX $FLAGS "$t" -o "$out" 2> "$out.log"; then echo "✓ compiled $(basename "$t")"; else echo "✗ $(basename "$t")"; cat "$out.log"; fail=1; fi
  fi
done
exit $fail
