import type { ComponentType } from 'react';
import type { Rng } from './rng';

export type Tone = 'base' | 'active' | 'compare' | 'done' | 'muted' | 'warn' | 'path' | 'accent' | 'ghost';

/** One drawable thing on the stage: an array cell, a tree node, a pointer tag, a table cell, a caption. */
export interface SNode {
  id: string;
  x: number;
  y: number;
  /** rect width / circle diameter */
  w?: number;
  h?: number;
  shape?: 'circle' | 'rect' | 'text' | 'tag';
  label?: string | number;
  sub?: string | number;
  subPos?: 'below' | 'above' | 'left' | 'right';
  tone?: Tone;
  fontSize?: number;
  /** text-anchor for shape:'text' */
  anchor?: 'start' | 'middle' | 'end';
}

export interface SEdge {
  from: string;
  to: string;
  label?: string | number;
  directed?: boolean;
  tone?: Tone;
  /** perpendicular curvature offset in px (multigraphs, back edges) */
  bend?: number;
  dashed?: boolean;
}

export interface Scene {
  w: number;
  h: number;
  nodes: SNode[];
  edges?: SEdge[];
}

export interface Ask {
  prompt: string;
  options: string[];
  answer: number;
  hint?: string;
}

export type SfxName = 'tick' | 'swap' | 'compare' | 'correct' | 'wrong' | 'unlock' | 'fanfare' | 'pop' | 'push' | 'found' | 'click';

export interface Frame {
  scene: Scene;
  /** `//@label` in the level's C++ snippet that this frame executes */
  line?: string;
  say: string;
  vars?: Record<string, string | number | boolean>;
  sfx?: SfxName;
  /** predict-mode question shown before this frame is revealed */
  ask?: Ask;
}

interface QBase {
  prompt: string;
  code?: string;
  scene?: Scene;
  explain: string;
}
export type Question =
  | (QBase & { kind: 'mcq'; options: string[]; answer: number })
  | (QBase & { kind: 'multi'; options: string[]; answer: number[] })
  | (QBase & {
      kind: 'input';
      /** accepted answers; compared after normalisation */
      answer: string | string[];
      /** num: numeric compare · seq: list of tokens split on , or space · text: case/space-insensitive */
      norm: 'num' | 'seq' | 'text';
      placeholder?: string;
    });

export type QGen = (rng: Rng) => Question;

export interface Card {
  q: string;
  a: string;
}

export interface Level {
  id: string;
  n: number;
  world: number;
  title: string;
  blurb: string;
  /** syllabus lines this level covers, e.g. "DS U1 · Stacks" */
  syllabus: string[];
  /** C++ snippet ids that must be recalled to pass the test */
  snippets: string[];
  /** snippets shown in the dojo but not gated (bonus / other convention) */
  extraSnippets?: string[];
  Lesson: ComponentType;
  Practice?: ComponentType;
  quiz: QGen[];
  cards: Card[];
  refs: string[];
}

export interface World {
  n: number;
  name: string;
  tagline: string;
  glyph: string;
}
