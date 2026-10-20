import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { Frame } from './types';
import { Player } from './Player';
import { Viz, parseNums } from './lesson';
import { Rng, newSeed } from './rng';

/**
 * Generic "type an input, watch the algorithm" widget.
 * fields: named text inputs; build(values) returns frames or an error string.
 */
export interface Field {
  name: string;
  label: string;
  initial: string;
  random?: (rng: Rng) => string;
  width?: number;
}

export function AlgoViz({
  title,
  note,
  fields,
  build,
  code,
  codeText,
  predict = false,
  children,
}: {
  title: string;
  note?: ReactNode;
  fields: Field[];
  build: (v: Record<string, string>) => Frame[] | string;
  code?: string;
  codeText?: string;
  predict?: boolean;
  children?: ReactNode;
}) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, f.initial])));
  const result = useMemo(() => {
    try {
      return build(vals);
    } catch (e) {
      return (e as Error).message;
    }
  }, [vals]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = useRef<Frame[] | null>(null);
  if (typeof result !== 'string') last.current = result;
  const frames = typeof result === 'string' ? last.current : result;
  const randomise = () => {
    const rng = new Rng(newSeed());
    setVals((v) => {
      const next = { ...v };
      for (const f of fields) if (f.random) next[f.name] = f.random(rng);
      return next;
    });
  };
  return (
    <Viz title={title} note={note}>
      <div className="inputbar">
        {fields.map((f) => (
          <label key={f.name}>
            <span>{f.label}</span>
            <input
              value={vals[f.name]}
              onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })}
              spellCheck={false}
              style={f.width ? { minWidth: Math.min(f.width, 120), width: f.width, maxWidth: '100%' } : undefined}
            />
          </label>
        ))}
        {fields.some((f) => f.random) && (
          <button className="btn" onClick={randomise}>
            🎲 Random
          </button>
        )}
        {typeof result === 'string' && <span className="input-err">{result}</span>}
      </div>
      {children}
      {frames && frames.length > 0 && <Player frames={frames} code={code} codeText={codeText} predict={predict} />}
    </Viz>
  );
}

/** Parse helpers that throw readable errors (AlgoViz shows them). */
export function nums(s: string, o: Parameters<typeof parseNums>[1] = {}): number[] {
  const r = parseNums(s, o);
  if (typeof r === 'string') throw new Error(r);
  return r;
}
export function int(s: string, name: string, min = -999, max = 999): number {
  const v = Number(s.trim());
  if (!Number.isInteger(v) || v < min || v > max) throw new Error(`${name} must be a whole number in ${min}..${max}.`);
  return v;
}
export function sortedNums(s: string, o: Parameters<typeof parseNums>[1] = {}): number[] {
  const a = nums(s, o);
  for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) throw new Error('This algorithm needs the array sorted ascending.');
  return a;
}

export const useFrames = (fn: () => Frame[], deps: unknown[]) => useMemo(fn, deps); // eslint-disable-line react-hooks/exhaustive-deps
export { useState };
