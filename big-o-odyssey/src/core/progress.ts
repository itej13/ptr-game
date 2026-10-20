import { useSyncExternalStore } from 'react';

/** Everything a player has done, persisted in localStorage (per browser — no accounts). */
export interface LevelProgress {
  learned?: boolean;
  practiced?: boolean;
  /** snippet id -> highest dojo stage cleared (1..5) */
  dojo: Record<string, number>;
  best?: number; // best test score %
  passed?: boolean;
  stars?: number;
}
export interface Progress {
  v: 1;
  xp: number;
  levels: Record<string, LevelProgress>;
  bosses: Record<number, { passed?: boolean; best?: number }>;
  /** Leitner box per recall card: box 0..5, due = epoch day */
  leitner: Record<string, { box: number; due: number }>;
  settings: { muted: boolean; tester: boolean; theme: 'auto' | 'light' | 'dark' };
}

// ponytail: pre-rename id kept on purpose — changing it would orphan existing saves
const KEY = 'dsa-quest.v1';
const fresh = (): Progress => ({
  v: 1,
  xp: 0,
  levels: {},
  bosses: {},
  leitner: {},
  settings: { muted: false, tester: false, theme: 'auto' },
});

function load(): Progress {
  try {
    const s = localStorage.getItem(KEY);
    if (s) {
      const p = JSON.parse(s) as Progress;
      if (p && p.v === 1) return { ...fresh(), ...p, settings: { ...fresh().settings, ...p.settings } };
    }
  } catch {
    /* private mode / blocked storage: play without saving */
  }
  return fresh();
}

let state = load();
if (typeof location !== 'undefined' && /[?&]tester=1/.test(location.search)) state.settings.tester = true;
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function update(fn: (p: Progress) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  save();
  listeners.forEach((l) => l());
}

export const getProgress = () => state;
export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export function levelProgress(p: Progress, id: string): LevelProgress {
  return p.levels[id] ?? { dojo: {} };
}

export function patchLevel(id: string, fn: (lp: LevelProgress) => void) {
  update((p) => {
    const lp = p.levels[id] ?? { dojo: {} };
    fn(lp);
    p.levels[id] = lp;
  });
}

export const starsFor = (score: number) => (score >= 100 ? 3 : score >= 90 ? 2 : score >= 80 ? 1 : 0);

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}
export function importProgress(json: string) {
  const p = JSON.parse(json) as Progress;
  if (!p || p.v !== 1 || typeof p.levels !== 'object') throw new Error('Not a Big-O Odyssey save file');
  update((s) => Object.assign(s, fresh(), p));
}
export function resetProgress() {
  const keepSettings = state.settings;
  update((s) => Object.assign(s, fresh(), { settings: keepSettings }));
}

export const today = () => Math.floor(Date.now() / 86_400_000);
/** Leitner intervals in days for boxes 0..5 */
export const BOX_DAYS = [0, 1, 2, 4, 8, 16];
