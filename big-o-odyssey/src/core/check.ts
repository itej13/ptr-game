import type { Question } from './types';

/** Pure answer checking — unit-tested, used by every quiz and test. */
export type Response = number | number[] | string;

const seqNorm = (s: string) =>
  s
    .toLowerCase()
    .split(/[\s,;→]+/)
    .filter(Boolean)
    .join(' ');
const textNorm = (s: string) => s.toLowerCase().replace(/\s+/g, '');

export function checkAnswer(q: Question, r: Response): boolean {
  switch (q.kind) {
    case 'mcq':
      return r === q.answer;
    case 'multi': {
      if (!Array.isArray(r)) return false;
      const a = [...q.answer].sort();
      const b = [...new Set(r)].sort();
      return a.length === b.length && a.every((x, i) => x === b[i]);
    }
    case 'input': {
      if (typeof r !== 'string' || !r.trim()) return false;
      const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
      if (q.norm === 'num') {
        const v = Number(r.trim().replace(/\s+/g, ''));
        return Number.isFinite(v) && accepted.some((a) => Math.abs(Number(a) - v) < 1e-6);
      }
      if (q.norm === 'seq') return accepted.some((a) => seqNorm(a) === seqNorm(r));
      return accepted.some((a) => textNorm(a) === textNorm(r));
    }
  }
}

export function answerText(q: Question): string {
  if (q.kind === 'mcq') return q.options[q.answer];
  if (q.kind === 'multi') return q.answer.map((i) => q.options[i]).join(' · ');
  return Array.isArray(q.answer) ? q.answer[0] : q.answer;
}
