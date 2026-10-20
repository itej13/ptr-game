import type { Level, World } from '../core/types';
import w01 from './w01';
import w02 from './w02';
import w03 from './w03';
import w04 from './w04';
import w05 from './w05';
import w06a from './w06a';
import w06b from './w06b';
import w07 from './w07';
import w08 from './w08';
import w09a from './w09a';
import w09b from './w09b';
import w10 from './w10';
import w11 from './w11';
import w12 from './w12';
import w13 from './w13';

export const WORLDS: World[] = [
  { n: 1, name: 'Foundations', tagline: 'Algorithms, cost, and the language of growth', glyph: '⌬' },
  { n: 2, name: 'Arrays & Strings', tagline: 'Memory layout, searching and the first sorts', glyph: '▦' },
  { n: 3, name: 'Stacks & Queues', tagline: 'LIFO, FIFO, recursion and Polish notation', glyph: '⧉' },
  { n: 4, name: 'Linked Lists', tagline: 'Pointers, nodes and the art of relinking', glyph: '⛓' },
  { n: 5, name: 'Divide & Conquer', tagline: 'Recurrences, Master theorem, merge & quick sort', glyph: '⟁' },
  { n: 6, name: 'Trees', tagline: 'Binary trees, BSTs, heaps, AVL and B-trees', glyph: '🜁' },
  { n: 7, name: 'Hashing & Files', tagline: 'Hash functions, collisions, file organisation', glyph: '#' },
  { n: 8, name: 'Sorting Mastery', tagline: 'Radix, external sorting and the n log n wall', glyph: '⇅' },
  { n: 9, name: 'Graphs', tagline: 'Traversals, MSTs, shortest paths, activity networks', glyph: '◈' },
  { n: 10, name: 'Greedy', tagline: 'Locally best, globally optimal — when it works', glyph: '✦' },
  { n: 11, name: 'Dynamic Programming', tagline: 'Overlapping subproblems, optimal substructure', glyph: '▤' },
  { n: 12, name: 'Backtracking & B&B', tagline: 'State-space trees, pruning and bounding', glyph: '♛' },
  { n: 13, name: 'Complexity', tagline: 'P, NP, NP-hard and NP-complete', glyph: '∞' },
];

export const LEVELS: Level[] = [...w01, ...w02, ...w03, ...w04, ...w05, ...w06a, ...w06b, ...w07, ...w08, ...w09a, ...w09b, ...w10, ...w11, ...w12, ...w13];

export const levelById = (id: string) => LEVELS.find((l) => l.id === id);
export const levelsOfWorld = (w: number) => LEVELS.filter((l) => l.world === w);
