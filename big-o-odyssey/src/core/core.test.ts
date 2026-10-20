import { describe, it, expect } from 'vitest';
import { diffCode, gradeTokens, tokenize } from './cppTokens';
import { checkAnswer } from './check';
import type { Question } from './types';
import { parseSnippet } from './snippets';
import { Rng } from './rng';

describe('cpp tokenizer + grader', () => {
  it('ignores whitespace and comments', () => {
    const a = 'int f(int x) {\n    return x + 1; // add\n}';
    const b = 'int f( int x ){ return x+1; }';
    expect(diffCode(a, b).errors).toBe(0);
  });
  it('treats >> and > > the same', () => {
    expect(diffCode('vector<vector<int>> g;', 'vector<vector<int> > g;').errors).toBe(0);
  });
  it('counts substitutions, insertions and deletions', () => {
    expect(diffCode('a = b + c;', 'a = b - c;').errors).toBe(1);
    expect(diffCode('a = b + c;', 'a = b + c + d;').errors).toBe(2);
    expect(diffCode('if (x <= y) return;', 'if (x < y) return;').errors).toBe(1);
  });
  it('tokenizes operators longest-first', () => {
    expect(gradeTokens('i++; a->b; x <<= 2;').map((t) => t.s)).toEqual(['i', '++', ';', 'a', '->', 'b', ';', 'x', '<<=', '2', ';']);
  });
  it('keeps line numbers', () => {
    const t = tokenize('a\nb\n\nc').filter((x) => x.t === 'id');
    expect(t.map((x) => x.line)).toEqual([1, 2, 4]);
  });
});

describe('snippet parser', () => {
  it('strips metadata and line markers and maps labels', () => {
    const s = parseSnippet('x', '// @title T\n// @desc D1\n// @desc D2\nint f() { //@open\n    return 1; //@ret,end\n}\n');
    expect(s.title).toBe('T');
    expect(s.desc).toBe('D1 D2');
    expect(s.code).toBe('int f() {\n    return 1;\n}');
    expect(s.labels).toEqual({ open: 1, ret: 2, end: 2 });
  });
});

describe('answer checking', () => {
  it('mcq / multi / input', () => {
    expect(checkAnswer({ kind: 'mcq', prompt: '', explain: '', options: ['a', 'b'], answer: 1 }, 1)).toBe(true);
    expect(checkAnswer({ kind: 'multi', prompt: '', explain: '', options: ['a', 'b', 'c'], answer: [0, 2] }, [2, 0])).toBe(true);
    expect(checkAnswer({ kind: 'multi', prompt: '', explain: '', options: ['a', 'b', 'c'], answer: [0, 2] }, [0])).toBe(false);
    const n = { kind: 'input', norm: 'num', prompt: '', explain: '', answer: '42' } as const;
    expect(checkAnswer(n, ' 42 ')).toBe(true);
    expect(checkAnswer(n, '42.0')).toBe(true);
    expect(checkAnswer(n, '41')).toBe(false);
    const s: Question = { kind: 'input', norm: 'seq', prompt: '', explain: '', answer: ['3, -1, 4'] };
    expect(checkAnswer(s, '3 -1 4')).toBe(true);
    expect(checkAnswer(s, '3,-1,4')).toBe(true);
    expect(checkAnswer(s, '3 1 4')).toBe(false);
    const t = { kind: 'input', norm: 'text', prompt: '', explain: '', answer: 'AB+C*' } as const;
    expect(checkAnswer(t, 'a b + c *')).toBe(true);
  });
});

describe('rng', () => {
  it('is deterministic and in range', () => {
    const a = new Rng(5), b = new Rng(5);
    for (let i = 0; i < 100; i++) {
      const x = a.int(3, 9);
      expect(x).toBe(b.int(3, 9));
      expect(x).toBeGreaterThanOrEqual(3);
      expect(x).toBeLessThanOrEqual(9);
    }
  });
});
