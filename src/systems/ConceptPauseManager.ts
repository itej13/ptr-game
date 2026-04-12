import Phaser from 'phaser'
import { bus } from '../OperationBus'
import type { DsaOperation } from '../OperationBus'

interface PauseTrigger {
  triggerKey: string
  match: (op: DsaOperation) => boolean
  title: string
  conceptBody: string
}

const PAUSE_TRIGGERS: PauseTrigger[] = [
  // ── Array Zone ──────────────────────────────────────────────────────
  {
    triggerKey: 'array_random_access',
    match: ({ op, zone }) => op.includes('arr[') && zone === 'array',
    title: 'O(1) Random Access',
    conceptBody:
      "You just jumped directly to an index. Arrays store elements contiguously in memory, so accessing any position takes exactly one step — O(1). No other data structure gives you this.",
  },
  {
    triggerKey: 'array_binary_search_start',
    match: ({ op, zone }) => op.includes('binary search') && zone === 'array',
    title: 'Binary Search Begins',
    conceptBody:
      "Instead of checking every element, you're checking the midpoint and discarding half the data. This cuts your search from O(n) to O(log n) — the difference between checking 1,000 elements and checking ~10.",
  },
  {
    triggerKey: 'array_half_discard',
    match: ({ op, zone }) =>
      (op.includes('→ right') || op.includes('→ left')) && zone === 'array',
    title: 'Halving the Search Space',
    conceptBody:
      "You just eliminated half the remaining elements in one comparison. After k steps, only n/2^k elements remain. That's the power of logarithmic time.",
  },
  // ── Stack Zone ──────────────────────────────────────────────────────
  {
    triggerKey: 'stack_first_push',
    match: ({ op, zone }) => op.includes('push(') && zone === 'stack',
    title: 'Push — O(1)',
    conceptBody:
      "You placed an element on top of the stack. This is always O(1) — you never need to move anything else. The stack only cares about the top.",
  },
  {
    triggerKey: 'stack_first_pop',
    match: ({ op, zone }) => op.includes('pop()') && zone === 'stack',
    title: 'Pop — O(1)',
    conceptBody:
      "You removed the top element. In a stack, the last element added is the first one removed — Last In, First Out (LIFO). This is how function calls, undo buttons, and backtracking algorithms work.",
  },
  {
    triggerKey: 'stack_overflow_warning',
    match: ({ op, zone }) => op.includes('FATAL') && zone === 'stack',
    title: 'Stack Overflow!',
    conceptBody:
      "The stack is filling up beyond its capacity. In real programs, this crashes the process. Every recursive call adds a frame — too deep and you hit the limit.",
  },
  // ── Linked List Zone ────────────────────────────────────────────────
  {
    triggerKey: 'll_zone_intro',
    match: ({ op, zone }) => op.includes('Zone 3') && zone === 'list',
    title: 'Zone 3 — The Jungle of Nodes',
    conceptBody:
      "Arrays store every element in one contiguous block of memory. Element 0 sits right next to element 1, which sits right next to element 2 — so arr[5] jumps directly to slot 5 in a single step: O(1) random access.\n\nLinked lists throw that out completely. Each node can live anywhere in memory — there is no guaranteed adjacency. The only connection between nodes is a 'next' pointer: a stored memory address that says \"your next node is over there.\" Follow the pointer to find it. This is like a treasure hunt where each clue only reveals the location of the next clue.\n\nOr think of train cars: each car is coupled to the one behind it. The couplers are the pointers. Unhook one coupler and you splice in a new car — no need to slide the whole train.\n\nThe trade-offs:\n• No random access — to reach node #5 you must walk nodes 1→2→3→4→5. O(n) traversal.\n• O(1) insertion and deletion — rewiring two pointers is all it takes, regardless of list size.\n• Dynamic size — nodes are allocated individually, wherever memory is free.\n\nYou ARE the pointer. Press → to follow each 'next' link, one node at a time. Watch for cycle vines, a corruption entity severing pointers, and the NULL sentinel — the signal that the chain has ended.",
  },
  {
    triggerKey: 'll_first_traverse',
    match: ({ op, zone }) => op.includes('ptr = ptr->next') && zone === 'list',
    title: 'Following the Next Pointer',
    conceptBody:
      "You just followed a 'next' pointer to reach the adjacent node. There's no shortcut — to reach node #5, you MUST visit nodes 1, 2, 3, 4 first. This is O(n) traversal, the fundamental cost of linked lists.",
  },
  {
    triggerKey: 'll_insert',
    match: ({ op, zone }) => op.includes('new_node') && zone === 'list',
    title: 'O(1) Insertion',
    conceptBody:
      "You inserted a node by redirecting two pointers. No elements were shifted. In an array, inserting in the middle forces every element after it to move — O(n). Here, it's O(1) once you're at the position.",
  },
  {
    triggerKey: 'll_delete',
    match: ({ op, zone }) => op.includes('delete current.next') && zone === 'list',
    title: 'O(1) Deletion',
    conceptBody:
      "You deleted a node by skipping it — the previous node's 'next' now points past it. The deleted node is simply unreachable. No shifting, no reindexing. O(1).",
  },
]

class ConceptPauseManagerClass {
  private shown = new Set<string>()
  private game: Phaser.Game | null = null
  private pausedScene: Phaser.Scene | null = null
  private initialized = false

  init(game: Phaser.Game) {
    if (this.initialized) return
    this.initialized = true
    this.game = game
    bus.on('dsa:operation', (op) => this.handleOp(op))
  }

  resetForZone() {
    this.shown.clear()
  }

  resume() {
    const scene = this.pausedScene
    if (!scene) return
    this.pausedScene = null
    scene.physics.resume()
    scene.time.paused = false
    // Small delay so the SPACE key that dismissed the overlay
    // doesn't immediately trigger game actions in the same tick.
    setTimeout(() => {
      scene.input.enabled = true
    }, 80)
  }

  private handleOp(op: DsaOperation) {
    for (const trigger of PAUSE_TRIGGERS) {
      if (this.shown.has(trigger.triggerKey)) continue
      if (!trigger.match(op)) continue

      this.shown.add(trigger.triggerKey)
      this.pauseActiveScene()
      bus.emit('concept:pause', {
        triggerKey: trigger.triggerKey,
        title: trigger.title,
        conceptBody: trigger.conceptBody,
      })
      break
    }
  }

  private pauseActiveScene() {
    if (!this.game) return
    const scenes = this.game.scene.getScenes(true)
    if (!scenes.length) return
    const scene = scenes[0]
    this.pausedScene = scene
    scene.physics.pause()
    scene.input.enabled = false
    scene.time.paused = true
  }
}

export const ConceptPauseManager = new ConceptPauseManagerClass()
