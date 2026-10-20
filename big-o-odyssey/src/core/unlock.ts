import type { Progress } from './progress';
import { LEVELS, levelsOfWorld } from '../levels';

/** Gating rules: next level needs the previous level's test; next world needs the world boss. */
export function levelUnlocked(p: Progress, id: string): boolean {
  if (p.settings.tester) return true;
  const lvl = LEVELS.find((l) => l.id === id);
  if (!lvl) return false;
  const inWorld = levelsOfWorld(lvl.world);
  const k = inWorld.findIndex((l) => l.id === id);
  if (k > 0) return !!p.levels[inWorld[k - 1].id]?.passed;
  if (lvl.world === 1) return true;
  return !!p.bosses[lvl.world - 1]?.passed;
}

export function bossUnlocked(p: Progress, world: number): boolean {
  if (p.settings.tester) return true;
  const ls = levelsOfWorld(world);
  return ls.length > 0 && ls.every((l) => p.levels[l.id]?.passed);
}

export const PASS_MARK = 80;
