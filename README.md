# ★ PTR — Dereference the World

> A 2D puzzle-platformer where **you ARE the memory pointer**.
> Navigate living data structures. Don't segfault.

🎮 **Play Now**: [ptr-game.vercel.app](https://ptr-game.vercel.app)
📦 **Source**: [github.com/tejasdas/starptr](https://github.com/tejasdas/starptr)
🏆 **Built for**: Vihaan 9 × GoAlgo "Game Up Your DSA" Hackathon — April 2026

---

## Gameplay

<!-- Replace with actual GIF after recording -->
> 📹 60-second demo: `demo.gif` — record with `! ./record_demo.sh` then drop here

---

## What is ★ PTR?

`*PTR` teaches Data Structures through **physical constraint, not explanation**.
Each level IS a data structure. The game world's physics enforce its algorithmic rules.
There is no popup. There is no tutorial. The constraint is the gameplay.

| Zone | Data Structure | Core Constraint |
|------|---------------|-----------------|
| 🟩 **Array Plains** | Array | O(1) teleport access. Race O(log n) binary search vs O(n) enemy. |
| 🟦 **Stack Dungeon** | Stack (LIFO) | Only stand on the top block. Survive 30 s of auto-pushes by popping. |
| 🌿 **Linked List Jungle** | Singly Linked List | No random access — follow `next` vines only. Detect cycles. Repair severed pointers before the list dissolves. |

**The DSA rules aren't popups. They are the laws of physics.**

---

## DSA Concepts Covered

| Zone | Concept | Complexity Demonstrated |
|------|---------|------------------------|
| Array Plains | Arrays · Binary Search · Linear Search | O(1) access · O(log n) search · O(n) enemy scan |
| Stack Dungeon | Stack LIFO · Push · Pop · Overflow | O(1) push/pop |
| Linked List Jungle | Traversal · Insert · Delete · Floyd's Cycle Detection | O(n) traversal · O(1) insert/delete at pointer · O(n) / O(1) cycle detection |

---

## Controls

| Input | Action |
|-------|--------|
| `← →` / `A D` | Move `*ptr` |
| `↑` / `W` | Jump |
| **Click box** or `SPACE` | Binary search step (Zone 1) |
| `SPACE` / `S` / `↓` | Pop stack block (Zone 2) |
| `→` | Traverse `ptr = ptr->next` (Zone 3) |
| `R` | Repair severed vine (Zone 3 corruption phase) |
| `SPACE` | Cut detected cycle (Zone 3 Floyd's phase) |
| `ESC` | Pause / open DSA Codex |

**Touch devices**: on-screen D-pad (↑ ← →) + **A** (action) + **R** (repair) appear automatically.

---

## HUD System

- **Operation Log** — live terminal log of every DSA operation (`ptr = ptr->next`, `push(42)`, etc.)
- **Complexity Meter** — color-coded badge: 🟢 O(1) / O(log n) · 🟡 O(n) · 🔴 O(n²)
- **Memory Map** — mini-map of the current data structure topology with player position
- **DSA Codex** — unlocks after each zone; shows pseudocode + Big-O table as a study reference

---

## How to Run Locally

```bash
git clone https://github.com/tejasdas/starptr
cd starptr
npm install
npm run dev
# Open http://localhost:5173
```

**Requirements**: Node 18+, npm 9+

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | **Phaser.js 3** — Canvas rendering, Arcade physics |
| UI / HUD | **React 18** — overlay layer for HUD, menus, Codex |
| State | **Zustand** — game state, pause, codex entries |
| Styling | **Tailwind CSS v4** — React overlay only |
| Build | **Vite** — HMR dev server |
| Language | **TypeScript** — strict mode throughout |
| Audio | **Web Audio API** — procedural 8-bit synthesis, no external files |
| Hosting | **Vercel** — instant GitHub CI/CD |

---

## Architecture

```
React Shell (App.tsx)
├── HUD (ComplexityMeter · MemoryMap · OperationLog)
├── TouchControls  ← virtual D-pad, touch-only
├── PauseMenu + DSA Codex
└── PhaserGame (Canvas)
         ↕ OperationBus (mitt event emitter)
    Phaser Scenes
    ├── BootScene → MainMenuScene
    ├── Zone1_Array   (binary search race)
    ├── Zone2_Stack   (survival mode)
    └── Zone3_LinkedList (traversal · Floyd's · corruption)
```

**Key decision**: DSA constraints are Phaser physics, not UI guards.
In the Linked List zone there are literally no platforms between nodes.
The engine enforces the data structure.

---

## Design Philosophy

> *"You don't learn that linked list search is O(n). You LIVE it — you traverse every vine because the world has no other path."*

The Operation Log is passive and always visible. Judges see every DSA operation in real-time without the game pausing to explain it. The Codex fills in after each zone as an optional reference, never interrupting play.

---

## Project Structure

```
src/
├── scenes/
│   ├── MainMenuScene.ts      # glitch intro + typewriter boot sequence
│   ├── Zone1_Array.ts        # binary search race
│   ├── Zone2_Stack.ts        # LIFO survival
│   └── Zone3_LinkedList.ts   # traversal + Floyd's + corruption enemy
├── entities/
│   └── Player.ts             # *ptr character, keyboard + touch input
├── components/
│   ├── HUD.tsx               # ComplexityMeter · MemoryMap · OperationLog
│   ├── PauseMenu.tsx         # pause overlay + DSA Codex tabs
│   └── TouchControls.tsx     # on-screen D-pad (touch devices only)
├── store/
│   ├── gameStore.ts          # Zustand state
│   └── codexEntries.ts       # pseudocode + Big-O for all zones
├── audio/
│   └── soundManager.ts       # Web Audio API 8-bit SFX
├── input/
│   └── virtualInput.ts       # shared touch ↔ Phaser input bridge
└── OperationBus.ts           # mitt event bus (game → HUD)
```

---

Built for **Vihaan 9 × GoAlgo "Game Up Your DSA"** hackathon.
Solo project by **Tejas Das, DTU CSE** — April 2026.

*"You are the pointer. Navigate or segfault."*
