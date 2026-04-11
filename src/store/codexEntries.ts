import type { CodexEntry } from './gameStore'

export const CODEX_ZONE1: CodexEntry = {
  zone: 'array',
  name: 'Binary Search',
  oneLiner: 'Halve the search space every step — O(log n) beats O(n) every time.',
  pseudocode: `function binarySearch(arr, target):
  lo = 0, hi = arr.length - 1
  while lo <= hi:
    mid = floor((lo + hi) / 2)
    if arr[mid] == target: return mid
    if arr[mid] < target: lo = mid + 1
    else: hi = mid - 1
  return -1`,
  bigO: [
    { op: 'Search (binary)', time: 'O(log n)' },
    { op: 'Search (linear)', time: 'O(n)' },
    { op: 'Access by index', time: 'O(1)' },
    { op: 'Insert / Delete', time: 'O(n)' },
  ],
}

export const CODEX_ZONE2: CodexEntry = {
  zone: 'stack',
  name: 'Stack (LIFO)',
  oneLiner: 'Last in, first out — push and pop are O(1), but overflow is lethal.',
  pseudocode: `// stack operations
stack.push(val)    // add to top     O(1)
stack.pop()        // remove top     O(1)
stack.peek()       // read top       O(1)

// overflow: stack.size > MAX → crash
// underflow: pop on empty → error`,
  bigO: [
    { op: 'Push', time: 'O(1)' },
    { op: 'Pop', time: 'O(1)' },
    { op: 'Peek', time: 'O(1)' },
    { op: 'Search', time: 'O(n)' },
  ],
}

export const CODEX_ZONE3: CodexEntry = {
  zone: 'list',
  name: 'Linked List',
  oneLiner: 'Nodes chained by pointers — O(1) splice, O(n) access, cycles kill.',
  pseudocode: `// traversal
ptr = head
while ptr != null:
  visit(ptr.value)
  ptr = ptr.next

// Floyd's cycle detection
slow = fast = head
while fast and fast.next:
  slow = slow.next
  fast = fast.next.next
  if slow == fast: // cycle!`,
  bigO: [
    { op: 'Access by index', time: 'O(n)' },
    { op: 'Insert at pointer', time: 'O(1)' },
    { op: 'Delete at pointer', time: 'O(1)' },
    { op: 'Cycle detection', time: 'O(n)' },
  ],
}
