import type { Question, QGen, Scene } from './types';
import type { Rng } from './rng';

/** Helpers for writing question generators. Options are shuffled later by drawQuestions. */

export function mcq(prompt: string, correct: string, wrong: string[], explain: string, extra: { code?: string; scene?: Scene } = {}): Question {
  const opts = [correct, ...wrong.filter((w) => w !== correct)];
  return { kind: 'mcq', prompt, options: [...new Set(opts)], answer: 0, explain, ...extra };
}

export function multi(prompt: string, options: [string, boolean][], explain: string, extra: { code?: string; scene?: Scene } = {}): Question {
  return {
    kind: 'multi',
    prompt,
    options: options.map((o) => o[0]),
    answer: options.map((o, i) => (o[1] ? i : -1)).filter((i) => i >= 0),
    explain,
    ...extra,
  };
}

export function num(prompt: string, answer: number, explain: string, extra: { code?: string; scene?: Scene; placeholder?: string } = {}): Question {
  return { kind: 'input', norm: 'num', prompt, answer: String(answer), explain, ...extra };
}

export function seq(prompt: string, answer: (string | number)[] | string[][], explain: string, extra: { code?: string; scene?: Scene; placeholder?: string } = {}): Question {
  const accepted = Array.isArray(answer[0]) ? (answer as string[][]).map((a) => a.join(', ')) : [(answer as (string | number)[]).join(', ')];
  return { kind: 'input', norm: 'seq', prompt, answer: accepted, explain, ...extra };
}

export function txt(prompt: string, answer: string | string[], explain: string, extra: { code?: string; scene?: Scene; placeholder?: string } = {}): Question {
  return { kind: 'input', norm: 'text', prompt, answer, explain, ...extra };
}

export function tf(statement: string, truth: boolean, explain: string): Question {
  return { kind: 'mcq', prompt: `True or false: ${statement}`, options: ['True', 'False'], answer: truth ? 0 : 1, explain };
}

/** A generator that draws one question from a fixed bank. */
export const bank = (qs: Question[]): QGen => (rng: Rng) => rng.pick(qs);

/** Numbers that are distinct from `ans` and each other, near it — for numeric MCQ distractors. */
export function near(rng: Rng, ans: number, k = 3, spread = 3): number[] {
  const out = new Set<number>();
  let guard = 0;
  while (out.size < k && guard++ < 200) {
    const d = rng.int(1, spread) * (rng.chance(0.5) ? 1 : -1);
    const v = ans + d;
    if (v !== ans) out.add(v);
  }
  return [...out];
}
