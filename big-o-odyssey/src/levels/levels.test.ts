import { describe, it, expect } from 'vitest';
import { LEVELS, WORLDS } from './index';
import { SNIPPETS } from '../core/snippets';
import { drawQuestions } from '../core/Quiz';
import { Rng } from '../core/rng';
import { checkAnswer } from '../core/check';
import { SYLLABUS } from '../syllabus';
import type { Question } from '../core/types';

const bad = (s: string) => /undefined|NaN|\[object Object\]|Infinity/.test(s);

function validate(q: Question, where: string) {
  expect(q.prompt.trim(), where).not.toBe('');
  expect(q.explain.trim(), where).not.toBe('');
  expect(bad(q.prompt + q.explain + (q.code ?? '')), `${where}: ${q.prompt}`).toBe(false);
  if (q.kind === 'input') {
    const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
    expect(ans.length, where).toBeGreaterThan(0);
    for (const a of ans) {
      expect(bad(a), `${where}: answer ${a}`).toBe(false);
      expect(a.trim(), where).not.toBe('');
      if (q.norm === 'num') expect(Number.isFinite(Number(a)), `${where}: ${a}`).toBe(true);
      // the stored answer must be accepted by the checker
      expect(checkAnswer(q, a), `${where}: answer "${a}" rejected by checker`).toBe(true);
    }
  } else {
    expect(q.options.length, `${where}: ${q.prompt}`).toBeGreaterThanOrEqual(2);
    expect(new Set(q.options).size, `${where}: duplicate options in ${q.prompt}`).toBe(q.options.length);
    for (const o of q.options) expect(bad(o), `${where}: option ${o}`).toBe(false);
    if (q.kind === 'mcq') expect(q.answer >= 0 && q.answer < q.options.length, where).toBe(true);
    else {
      expect(q.answer.length, where).toBeGreaterThan(0);
      for (const a of q.answer) expect(a >= 0 && a < q.options.length, where).toBe(true);
    }
  }
}

describe('level registry', () => {
  it('numbers levels 1..N in world order with unique ids', () => {
    LEVELS.forEach((l, i) => {
      expect(l.n).toBe(i + 1);
      expect(l.id).toBe(`L${String(i + 1).padStart(2, '0')}`);
      expect(WORLDS.some((w) => w.n === l.world)).toBe(true);
      if (i) expect(l.world).toBeGreaterThanOrEqual(LEVELS[i - 1].world);
    });
  });
  it('references only existing C++ snippets', () => {
    for (const l of LEVELS) for (const s of [...l.snippets, ...(l.extraSnippets ?? [])]) expect(SNIPPETS[s], `${l.id} → ${s}`).toBeTruthy();
  });
  it('has cards and refs', () => {
    for (const l of LEVELS) {
      expect(l.cards.length, l.id).toBeGreaterThan(0);
      expect(l.refs.length, l.id).toBeGreaterThan(0);
    }
  });
});

describe('question generators produce well-formed, self-consistent questions', () => {
  for (const l of LEVELS) {
    it(`${l.id} ${l.title}`, () => {
      l.quiz.forEach((g, gi) => {
        for (let seed = 1; seed <= 250; seed++) validate(g(new Rng(seed * 7919 + gi)), `${l.id} gen#${gi} seed ${seed}`);
      });
      for (let seed = 1; seed <= 40; seed++) {
        const qs = drawQuestions(l.quiz, 10, seed);
        expect(qs.length, `${l.id}: only ${qs.length} distinct questions for seed ${seed}`).toBe(10);
        qs.forEach((q, k) => validate(q, `${l.id} drawn#${k}`));
      }
    });
  }
});

describe('syllabus coverage', () => {
  it('maps every topic to at least one level', () => {
    for (const u of SYLLABUS) for (const t of u.topics) expect(t.levels.length, t.topic).toBeGreaterThan(0);
  });
  it('every mapped level exists once the game is complete', () => {
    const ids = new Set(LEVELS.map((l) => l.id));
    const missing = SYLLABUS.flatMap((u) => u.topics.flatMap((t) => t.levels)).filter((id) => !ids.has(id));
    if (LEVELS.length >= 62) expect(missing).toEqual([]);
  });
});
