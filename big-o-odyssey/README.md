# Big-O Odyssey

A level-gated web game for DTU **Data Structures** + **CS205 Design & Analysis of Algorithms**: 62 levels in 13 worlds, each with a lesson, step-by-step visualisers, a C++ memorisation dojo and a test. The next level opens only after ≥ 80 % on the test **and** zero-error recall of the level's C++.

## Play

```bash
npm install
npm run dev        # http://localhost:5173
```

- **Tester mode** (Settings, or open with `?tester=1`) unlocks every level and boss.
- Progress lives in your browser's localStorage. Use Settings → Export/Import to move it.

## Check the content

```bash
npm test           # engines vs brute force, every question generator × 250 seeds, syllabus coverage
npm run crosscheck # compiles all C++ with ASan/UBSan and checks it against the TS engines on random inputs
npm run build      # static site in dist/
```

## Layout

- `cpp/` — the C++ you memorise (one file per snippet; `//@label` markers sync code lines with animations). `cpp/tests/` holds thin I/O harnesses.
- `src/engines/` — every algorithm in TypeScript. Animations and quiz answers come from these, never from hand-typed answers.
- `src/levels/` — lessons, visualisers and question generators, one file per world.
- `src/core/` — renderer, step player, quiz/test runner, code dojo, progress, sound.
- `src/syllabus.ts` — every syllabus line mapped to the levels that teach it (shown in-game under **Syllabus**).
