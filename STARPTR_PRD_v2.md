# *PTR — Product Requirements Document
**"You are the pointer. Navigate or segfault."**
*Version 2.0 | Revised for Vihaan 9 × GoAlgo Hackathon | April 2026*
*Solo Project by Tejas Das, DTU CSE*

---

## Name Decision

### Why `*PTR` (pronounced "Star Pointer")

Three names were considered:

| Name | Vibe | Strength | Weakness |
|---|---|---|---|
| `*PTR` | Minimal, cryptic, techy | The asterisk IS the dereference operator — the name is the mechanic. Works as a logo. Perfect for CS students. | Might need a one-line explainer for judges who aren't C/C++ fluent |
| **ALGO BHAI** | Indian Gen-Z, viral potential | Uniquely DTU-native. "Algo Bhai samjha de" IS the tagline. Would trend locally. | May not read as "serious" to faculty judges |
| **NODERUNNER** | Action game, accessible | Clean, sounds like a game, accessible | Too generic, no double meaning |

**Winner: `*PTR`**

The asterisk (`*`) in C/C++ is the dereference operator — it means "the value at this memory address." The player character IS a memory pointer being dereferenced through data structures. The name is not a metaphor. It IS the mechanic. It looks incredible as a monospaced logo:

```
  ★ PTR
```

**Tagline options** (pick at the hackathon based on vibe):
- *"You are the pointer. Navigate or segfault."*
- *"Dereference the world."*
- *"Every data structure. One pointer. Zero null exceptions."*

**Hashtag**: `#StarPTR` or `#PTRgame`

---

## Executive Summary

`*PTR` is a 2D puzzle-platformer where players embody a memory pointer (`*ptr`) traversing a living, crumbling computer system. Each level is physically shaped like a different data structure — and the game world's physics and movement rules enforce that structure's real algorithmic constraints. You don't watch a linked list traversal: **you are the pointer following next-arrows, unable to teleport**. You don't observe a stack: **you can only stand on top of it**, and the floor collapses if you try to go deeper.

Built for the **Vihaan 9 × GoAlgo "Game Up Your DSA"** hackathon, `*PTR` is designed as the first platformer where the game engine and the data structure are the same system.

---

## 1. Problem Statement

### The Learning Gap in DSA Education

Data Structures and Algorithms are the most conceptually difficult topics for CS students to internalize. The root cause: **abstraction without embodiment**.

- Students read about a stack's LIFO principle but have no visceral sense of what that *means*.
- Passive visualization tools (VisuAlgo, Algorithm Visualizer) show animations — but watching is not doing.
- Gamified tools stop at quizzes or coding challenges — they assume understanding already exists.
- Retention is low without emotional or physical engagement.

### The GoAlgo Brief's Explicit Problem Statement

> *"A generic arcade title with a detached 'DSA explainer' block that players can ignore"*
> — GoAlgo Contest Brief, describing what NOT to build

`*PTR` solves this by making the DSA rule the *only* rule of the game world. There is no separate explainer. The linked list level has no random-access platforms — not because a popup says so, but because **the world physically doesn't have them**. The DSA constraint IS the game constraint.

---

## 2. Competitive Landscape

| Tool | Type | Passive? | Physical Constraint? |
|---|---|---|---|
| VisuAlgo | Visualizer | ✅ Yes | ❌ |
| Algorithm Visualizer | Visualizer | ✅ Yes | ❌ |
| CS50 DSA | Video | ✅ Yes | ❌ |
| Sorting.at | Sorting Race | Partial | ❌ |
| LeetCode | Coding Challenge | Partial | ❌ |
| Code Combat | Coding RPG | No | ❌ — teaches *writing* code, not structure intuition |
| **`*PTR`** | **Puzzle Platformer** | **No** | **✅ — world physics = DSA rules** |

**The physical constraint column is the entire differentiator.** No existing tool enforces DSA rules as game physics. This is the innovation that satisfies GoAlgo's judging criterion for originality.

---

## 3. Target Users

### Primary
- **CSE students (1st–3rd year)** preparing for exams, placements, and coding interviews
- Age group: 17–22, already know at least one programming language
- Context: frustrated by abstract textbook DSA explanations

### Secondary
- Self-taught developers learning DSA for interviews
- High-school students in AP CS / CBSE CS
- Anyone who has asked "but WHY is linked list O(n) lookup?"

### Persona: Tejas
> A first-year CSE student who understands code syntax but struggles to *visualize* what happens in memory when a tree is traversed. He can write a DFS function but cannot mentally simulate why backtracking occurs. He needs to *feel* it — not read about it.

---

## 4. Core Game Concept

### Genre
2D Puzzle-Platformer / Narrative Adventure

### Tone
Glitchy, witty, slightly dark. The aesthetic is a dying computer's memory — think Tron meets Hollow Knight rendered in a VS Code dark theme. Error messages are dialogue. Corrupted memory is the villain. The humor is programmer-native.

### Player Character
`*ptr` — a small white blinking terminal cursor that has grown legs. Represents a dereferenced memory pointer. Fast, curious, determined.

### The Antagonist
**The Corruption** — a spreading memory error consuming the system. Manifests as red glitch-static that corrupts data elements into enemies. The only way to stop it is to correctly traverse and organize the data structures in each Memory Zone.

### Narrative Hook (displayed at game start)
```
> SYSTEM INTEGRITY: 12%
> MEMORY ZONES COMPROMISED: 6/7
> ROGUE POINTER DETECTED IN SECTOR 0x00
> LAST HOPE PROTOCOL INITIATED
> YOU ARE *PTR
> TRAVERSE THE MEMORY.
> FIX THE STRUCTURES.
> DON'T. SEGFAULT.
```

---

## 5. Locked MVP Scope — 3 Zones (Non-Negotiable)

Given the 48-hour hackathon window, the non-negotiable deliverable is **3 zones executed with complete polish** — not 7 zones half-built. Judges reward execution quality over breadth.

> Rule: **Each zone must be fully winnable, have a death state, show the Operation Log, and show a Zone Complete screen before it ships.**

---

### ZONE 1: THE ARRAY PLAINS
**DSA Concept**: Arrays, O(1) Random Access, Linear Search vs. Binary Search

**Visual Theme**: A vast flat landscape of glowing equal-width boxes labeled `[0]`, `[1]`, `[2]`... Each box holds a glowing orb (element). Feels like infinite grid paper at night.

**Core Movement Rule**: `*ptr` can teleport to any index instantly (O(1) random access). This feels *liberating* — and the player immediately notices.

**Puzzle Arc**:
1. Tutorial — teleport to find a specific element randomly. The player is fast, happy.
2. Puzzle — the array is now 1,000 elements long. Random access still works but a "Step Counter" appears on the HUD. Finding it randomly takes many jumps. Player discovers Binary Search: only allowed to jump to the midpoint, then half again. The Step Counter visibly plummets. **O(log n) is felt, not explained.**
3. A "sorted array" vs "unsorted array" section shows why binary search requires sorting first.

**Boss — "THE LINEAR SEARCHER"**: A slow enemy that starts at index 0 and checks every element, chasing `*ptr`. Player must reach the target element using binary search before the enemy does using linear search. **Player RACES O(n) vs their own O(log n).**

**Death State**: Accessing `array[-1]`
```
ArrayIndexOutOfBoundsException at index: -1
You accessed memory before the array started.
```

**Zone Complete Pseudocode Shown**:
```
// What you just did
binary_search(arr, target):
    left = 0, right = n-1
    while left <= right:
        mid = (left + right) / 2
        if arr[mid] == target: return mid
        if arr[mid] < target: left = mid + 1
        else: right = mid - 1
    return -1
// Time: O(log n) | Space: O(1)
```

---

### ZONE 2: THE STACK DUNGEON
**DSA Concept**: Stack (LIFO), Push, Pop, Stack Overflow, Stack Underflow

**Visual Theme**: A deep vertical stone dungeon. Elements are glowing blocks stacked on top of each other. The dungeon is dark below — only the top few layers are visible. The ceiling descends as the stack grows.

**Core Movement Rule**: `*ptr` can only stand on the **topmost block**. Cannot access anything below it. The rules of the world physically prevent it — there is no platform below the top.

**Operations available to player**:
- `PUSH` — drops a new element block from above, player rides it up
- `POP` — removes the current top block, player drops to the next one

**Puzzle Arc**:
1. Tutorial — push and pop to navigate to an exit door at a specific height
2. Puzzle — a bridge is blocked by elements in wrong order. Must pop, re-stack using a second stack, rebuild in correct order. This is the classic "balanced parentheses" puzzle made physical.
3. Advanced puzzle — a sequence of operations must produce a specific element on top. Player learns to think in reverse (LIFO intuition).

**Boss — "THE OVERFLOW"**: A massive red element keeps PUSHing from above, trying to fill the dungeon ceiling. Player must POP fast enough to prevent stack overflow. Momentum is the mechanic — pop too slow, the ceiling crushes you. **Stack Overflow as a survival game.**

**Death State 1** — Pop from empty stack:
```
StackUnderflowError: Cannot pop() from empty stack.
You tried to take from nothing.
```
**Death State 2** — Stack grows to ceiling:
```
StackOverflowError: Stack depth exceeded.
You pushed too many without popping.
```

**Zone Complete Pseudocode Shown**:
```
// What you just did
stack = []
stack.push(element)    // O(1)
top = stack.pop()      // O(1)
peek = stack[-1]       // O(1) — look without removing

// Time: O(1) for all ops | Space: O(n)
// Used in: function calls, undo/redo, expression evaluation
```

---

### ZONE 3: THE LINKED LIST JUNGLE
**DSA Concept**: Singly Linked List, Traversal, Insertion, Deletion, Null Pointer, Cycle Detection

**Visual Theme**: A dense neon jungle at night. Nodes are glowing orbs hanging from vines. Between each node, an arrow-vine points to the next. **There are NO solid platforms between nodes — only vines.**

**Core Movement Rule**: `*ptr` can ONLY travel by following a `next` vine to the adjacent node. No teleporting. No jumping to a node three ahead. If a vine is null, movement is impossible. **Random access is physically impossible in this world.**

**This is the moment players feel O(n) traversal in their spine.**

**Puzzle Arc**:
1. Tutorial — follow the `next` vines to reach the exit node. Player immediately feels how different this is from Array Plains.
2. Puzzle — insert a new node: player physically creates a vine from a node to a new orb, then creates a vine from the new orb to what was previously `next`. Pointer manipulation made tactile.
3. Puzzle — delete a node: player re-routes the vine from the previous node to skip the current one. The deleted node floats away into the void.
4. **Secret area** — a cycle! Player follows vines and gets stuck in an infinite loop. The Corruption is laughing. Player must detect the cycle using **Floyd's Tortoise and Hare**: player gains a "Ghost Mode" (fast pointer) that moves 2 vines per step while the normal body moves 1. When Ghost catches up to body = cycle detected. The vine causing the cycle becomes visible (highlighted red), player cuts it.

**Boss — "THE NULL"**: A boss that keeps severing `next` vines and replacing them with null. Player must repair the list (re-attach vines) before the Corruption reaches the head node and the whole list dissolves.

**Death State 1** — Following a null vine:
```
NullPointerException: Cannot dereference null.
You followed a vine that led nowhere.
```
**Death State 2** — Entering the cycle without detecting it:
```
InfiniteLoop: Cycle detected after 1000 traversals.
You needed Floyd's algorithm.
```

**Zone Complete Pseudocode Shown**:
```
// What you just did
# Traversal — O(n)
current = head
while current != null:
    visit(current)
    current = current.next

# Insertion after node p — O(1) once at position
new_node.next = p.next
p.next = new_node

# Deletion of node after p — O(1) once at position
p.next = p.next.next

# Floyd's Cycle Detection — O(n) time, O(1) space
slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow == fast: return "cycle detected"
```

---

## 6. HUD System (Applies to All Zones)

### Complexity Meter
Real-time Big-O indicator for the current operation. Updates with every player action.
- Green: O(1) or O(log n)
- Yellow: O(n)
- Red: O(n²) or worse

### Operation Log (Terminal)
A small terminal in the bottom-right corner. Every player action emits a line:
```
> ptr = ptr->next
> stack.push(42)
> arr[mid] = target? → false
> new_node->next = ptr->next
```
This is the "explainer" — but it's passive, embedded, and never interrupts gameplay. Judges can see it immediately.

### Memory Map (Mini-Map)
Top-right corner shows the full data structure topology — where the player currently is, which nodes have been visited, and where the corruption is spreading.

### Death Screen
Full-screen glitch effect, then:
```
[ error type ] ← monospaced red header
[ one-line DSA explanation of what went wrong ]
[ RESTART FROM HEAD ]    [ QUIT TO MENU ]
```

### Zone Complete Screen
```
ZONE 2: STACK DUNGEON — CLEARED
Operations performed: PUSH × 14, POP × 11
Complexity: O(1) per operation ✓
[ view pseudocode ] [ codex updated ] [ NEXT ZONE → ]
```

### The DSA Codex
An in-game reference book (accessible from the pause menu) that fills up as zones are completed. Each entry includes: data structure name, real pseudocode, Big-O table, and one-line "why it matters." Doubles as an actual study tool.

---

## 7. Visual & Audio Style

### Visual Direction
- **Color palette**: Deep `#0d0d0d` background (memory space); `#00ffcc` / `#00ff88` neon for valid pointers; `#ff3333` glitch-static for Corruption; pure white `#ffffff` for `*ptr`
- **Art style**: Pixel art world + vector HUD overlay — lo-fi retro game running inside a modern dark terminal
- **Font**: JetBrains Mono or Fira Code everywhere — menus, HUD, dialogue, death screens, all monospace
- **Aesthetic references**: Tron: Legacy grid world + Hollow Knight atmosphere + VS Code dark theme

### GoAlgo Aesthetic Alignment
GoAlgo's existing games feature clean, educational UI with clear visual feedback. `*PTR` aligns by:
- Using a consistently dark, minimal palette (no rainbow clutter)
- Making the educational layer (HUD) always visible, never hidden behind menus
- Clean typography that matches the code-adjacent nature of the platform
- Every UI element uses either the data structure's visual language or the terminal aesthetic

### Audio Direction
- **Ambient**: Synthesizer drone + computer fan white noise + glitch artifacts
- **SFX**: Mechanical keyboard clicks for operations, satisfying "ping" for correct moves, buzzy error tone for death
- **Music**: Lo-fi chiptune that becomes progressively more chaotic as Corruption spreads
- **Death Sound**: A low, buzzy error tone — instantly recognizable as "something broke"

---

## 8. Technical Architecture

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Game Engine | **Phaser.js 3.x** | Browser-native Canvas/WebGL, mature, rich physics |
| UI Layer | **React 18** | Menus, HUD overlays, Codex — thin wrapper only |
| State Management | **Zustand** | Lightweight, no boilerplate, perfect for game state |
| Level Design | **Tiled Map Editor** + JSON export | Visual level building, loads directly into Phaser |
| Styling (UI) | **Tailwind CSS v4** | Only for React portions; game canvas is pure Phaser |
| Build Tool | **Vite** | Fast HMR, easy Phaser + React integration |
| Language | **TypeScript** | Type safety for game state and DSA operation emitters |
| Hosting | **Vercel** (free, permanent) | Instant GitHub deployment, permanent HTTPS URL |
| Version Control | **GitHub** (public repo) | Required by hackathon brief |

### Architecture Overview
```
React Shell
├── MainMenu
├── HUDOverlay (Complexity Meter, Op Log, Memory Map)
├── DeathScreen
├── ZoneCompleteScreen
└── Codex (pause menu)
         ↕ event bus (mitt)
Phaser Game Instance (Canvas)
├── BootScene
├── PreloadScene
├── Zone1_ArrayScene
├── Zone2_StackScene
└── Zone3_LinkedListScene
```

### Key Engineering Decisions

**1. DSA Constraints as Phaser Physics, Not UI Rules**
Movement restrictions are implemented at the Phaser input and physics level — not as UI overlays or popups. In the Linked List Zone, there are literally no Phaser platforms between nodes. The game engine enforces the constraint. This is the architectural decision that separates `*PTR` from "explainer games."

**2. Operation Event Bus**
Every game action emits a custom Phaser event:
```typescript
this.events.emit('dsa:operation', { op: 'ptr = ptr->next', zone: 'linkedlist' });
```
The React HUD subscribes to this bus to update the Operation Log and Complexity Meter in real-time.

**3. No localStorage / sessionStorage**
The game is served in sandboxed iframes during judging. Zone completion state is stored in memory (Zustand store) only. No crashes from blocked storage APIs.

**4. No fetch() for Binary Assets**
All assets loaded via Phaser's built-in loader (which uses HTML elements internally, not JavaScript fetch). No CORS issues.

---

## 9. Repository Structure

```
starptr/
├── README.md                  ← Judged deliverable (see Section 10)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
│   └── assets/
│       ├── sprites/           ← *ptr character, nodes, elements
│       ├── tilemaps/          ← Zone 1, 2, 3 Tiled JSON
│       ├── tilesets/          ← Zone-specific tile images
│       └── audio/             ← SFX, ambient tracks
└── src/
    ├── main.tsx               ← React entry point
    ├── App.tsx                ← React shell
    ├── game/
    │   ├── PhaserGame.tsx     ← Phaser mount component
    │   ├── scenes/
    │   │   ├── BootScene.ts
    │   │   ├── PreloadScene.ts
    │   │   ├── MenuScene.ts
    │   │   ├── Zone1_Array.ts
    │   │   ├── Zone2_Stack.ts
    │   │   └── Zone3_LinkedList.ts
    │   ├── entities/
    │   │   ├── Player.ts      ← *ptr character
    │   │   └── Corruption.ts  ← antagonist entity
    │   └── systems/
    │       ├── ComplexityTracker.ts
    │       └── OperationBus.ts
    └── ui/
        ├── HUD.tsx
        ├── Codex.tsx
        ├── DeathScreen.tsx
        └── ZoneComplete.tsx
```

---

## 10. README Template (Judged Deliverable)

```markdown
# *PTR — Dereference the World

> A 2D puzzle-platformer where you ARE the memory pointer.
> Navigate living data structures. Don't segfault.

🎮 **Play Now**: [starptr.vercel.app](https://starptr.vercel.app)
📦 **Source**: This repo

---

## What is *PTR?

*PTR teaches Data Structures through physical constraint.
Each level IS a data structure — the game world's physics enforce its rules.

- 🟩 **Array Plains** — O(1) teleport access. Binary search boss.
- 🟦 **Stack Dungeon** — Can only touch the top. Stack overflow survival.
- 🌿 **Linked List Jungle** — No random access. Follow the next-vine or fall.

The DSA rules aren't popups. They're the laws of physics.

---

## DSA Concepts Covered

| Zone | Concept | Operations |
|------|---------|------------|
| Array Plains | Arrays, Search | O(1) access, O(log n) binary search |
| Stack Dungeon | Stack (LIFO) | push(), pop(), overflow, underflow |
| Linked List Jungle | Linked Lists | traversal, insert, delete, cycle detection |

---

## How to Run Locally

\```bash
git clone https://github.com/yourusername/starptr
cd starptr
npm install
npm run dev
# Open http://localhost:5173
\```

**Requirements**: Node 18+, npm 9+

---

## Tech Stack

- **Phaser.js 3** — game engine (Canvas/WebGL)
- **React 18** — HUD and menu UI
- **Zustand** — game state
- **TypeScript** — type safety
- **Vite** — build tool
- **Vercel** — deployment

---

## Design Decision

The DSA constraint is the movement constraint.
There is no separate "learn this concept" popup.
If you try to random-access a linked list node, the world doesn't have a platform there.
That's it. That's the whole design.

---

Built for **Vihaan 9 × GoAlgo "Game Up Your DSA"** hackathon.
Solo project by Tejas Das, DTU CSE — April 2026.
```

---

## 11. "Off-Brief" Defense

The GoAlgo brief explicitly warns against: *"a generic arcade title with a detached 'DSA explainer' block that players can ignore."*

`*PTR` is structurally immune to this failure mode because:

| Failure Mode | *PTR Response |
|---|---|
| DSA explainer can be skipped | There IS no explainer. The constraint IS the game. |
| Arcade game + tacked-on lesson | Arcade mechanics ARE the DSA operations. Push = push(). |
| Educational content is optional | You cannot complete any zone without using DSA rules correctly. |
| Learning happens outside gameplay | Learning happens because gameplay is physically impossible without internalizing the structure. |

**How judges see this immediately**:
- The Operation Log is always visible, updating in real-time as they play
- The Complexity Meter visually reacts to every operation
- The Zone Complete screen shows exact pseudocode of what they just did
- There is no "skip tutorial" for the DSA mechanics — the mechanics ARE the level

---

## 12. 48-Hour Execution Timeline
**Saturday April 11 → Sunday April 12, 2026**

| Time | Task | Deliverable |
|---|---|---|
| **Sat 00:00–02:00** | Vite + Phaser + React + TypeScript scaffold, Tiled configured, player character movement | Booting game with *ptr walking |
| **Sat 02:00–05:00** | Zone 1 (Array Plains) — tilemap, teleport mechanic, step counter HUD | Playable Zone 1 without boss |
| **Sat 05:00–07:00** | Zone 1 boss (Linear Searcher), death screen, Zone Complete screen | Zone 1 fully complete |
| **Sat 07:00–08:00** | Buffer / sleep / food | — |
| **Sat 08:00–11:00** | Zone 2 (Stack Dungeon) — vertical level, push/pop mechanics | Playable Zone 2 without boss |
| **Sat 11:00–13:00** | Zone 2 boss (The Overflow), Stack's death screens | Zone 2 fully complete |
| **Sat 13:00–14:00** | Buffer / lunch | — |
| **Sat 14:00–17:00** | Zone 3 (Linked List Jungle) — vine traversal mechanics, insert/delete puzzles | Playable Zone 3 without boss |
| **Sat 17:00–19:00** | Zone 3 Floyd's cycle puzzle, The Null boss | Zone 3 fully complete |
| **Sat 19:00–21:00** | HUD system — Complexity Meter, Operation Log, Memory Map | Full HUD live |
| **Sat 21:00–23:00** | Main menu, narrative intro, Codex (partial) | Full game flow |
| **Sun 00:00–02:00** | Audio (SFX, ambient), visual polish on all 3 zones | Game feels alive |
| **Sun 02:00–04:00** | Mobile touch controls, responsive layout | Mobile-ready |
| **Sun 04:00–06:00** | Vercel deployment, GitHub repo public, README written | Live HTTPS URL |
| **Sun 06:00–08:00** | Bug fixing, stability, edge case death states | Stable build |
| **Sun 08:00–09:00** | Demo video recording (if required), final submission | **SUBMITTED** |

### Risk Mitigation

| Risk | Mitigation |
|---|---|
| Zone design takes too long | Timebox each zone: 5 hours MAX. Cut puzzles before cutting zones. |
| Phaser-React integration friction | Use official `phaser/react` bridge template from day 1 |
| Scope creep to 7 zones | Zones 4–7 are POST-HACKATHON. They do not exist during the event. |
| Audio too complex | Use free 8-bit SFX from OpenGameArt. No custom audio during event. |
| Vercel deployment fails | Test deployment on Saturday night, not Sunday morning. |

---

## 13. Pre-Event Checklist (Today & Friday, April 9–10)

- [ ] Scaffold project locally: Vite + Phaser + React + TypeScript
- [ ] Test Phaser 3 basic scene renders in browser
- [ ] Install Tiled Map Editor and create a test tilemap
- [ ] Set up Vercel project linked to GitHub repo
- [ ] Download free tileset assets for glitch/neon aesthetic (OpenGameArt, itch.io)
- [ ] Download free monospace/terminal font (JetBrains Mono via Google Fonts)
- [ ] Sketch *ptr character as a pixel sprite (or use a placeholder)
- [ ] Test a basic player movement in Phaser with collision
- [ ] Confirm Vercel deployment URL is accessible from a phone (HTTPS)
- [ ] Read GoAlgo's existing game catalog for aesthetic reference

---

## 14. Educational Framework

### Learning Philosophy: Constraint-Based Intuition

`*PTR` follows the constraint-based intuition model:
1. **Experience the constraint** (you literally cannot random-access a linked list)
2. **Feel the consequence** (this is the O(n) epiphany — you *traverse* because there's no other option)
3. **Master it elegantly** (puzzles reward efficient algorithmic thinking)
4. **See it abstracted** (Operation Log shows the pseudocode of what you just physically did)

Students don't memorize that linked list search is O(n). They *know it* because they *lived* traversing every vine to find one node.

### DSA Coverage in MVP

| Zone | Primary Concept | Secondary Concepts |
|---|---|---|
| Array Plains | Arrays, Indexing | O(1) access, Binary Search, O(log n) vs O(n) |
| Stack Dungeon | Stack LIFO | Push, Pop, Overflow, Underflow, Balanced parens |
| Linked List Jungle | Singly Linked List | Traversal, Insert, Delete, Cycle Detection |

---

## 15. Success Metrics

### Hackathon Judging Criteria Alignment

| GoAlgo Criterion | *PTR Response |
|---|---|
| **Pedagogical Clarity** | Operation Log + Complexity Meter + Zone Complete pseudocode — learning layer is always visible |
| **Engagement** | Boss fights, death screens with humor, narrative, progressive difficulty |
| **Originality** | First platformer where game physics = data structure constraints |
| **Technical Execution** | Phaser.js + React + TypeScript, 3 complete stable zones |
| **Accessibility** | Runs in Chrome/Edge/Firefox, no install, mobile touch controls |

### Post-Hackathon Metrics (If Pursued Further)
- Zone completion rate target: > 70%
- Return rate target: > 40% next day
- Self-reported "aha moment" after each zone: > 80%
- Correlation with DSA quiz scores improvement

---

## 16. Post-Hackathon Vision (V2+)

- **Zone 4 — BST Mountains**: Navigate by comparison (left = smaller, right = larger), AVL rotations as mountain-shifting boss
- **Zone 5 — Queue River**: FIFO surf mechanics, circular queue island, deadlock boss
- **Zone 6 — Graph Metropolis**: BFS fire-spread puzzle, Dijkstra's fastest-route delivery mission
- **Zone 7 — Hash Highlands**: Hash function puzzles, collision resolution, worst-case boss
- **Multiplayer Race Mode**: Two players race the same zone — better algorithm wins
- **Community Level Editor**: Build custom zones for any DSA concept
- **LeetCode Bridge**: Solve a LeetCode problem → unlock a visual zone for that concept
- **Mobile App**: Native iOS/Android with haptic feedback for operations

---

*PRD v2.0 — Revised for Vihaan 9 × GoAlgo Hackathon. `*PTR` is an original concept by Tejas Das, DTU CSE, April 2026.*
