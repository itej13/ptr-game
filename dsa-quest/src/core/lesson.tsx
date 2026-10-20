import type { ReactNode } from 'react';
import { CodePanel } from './CodePanel';

/** Building blocks for lesson pages. */

export function Sec({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className="lsec" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

const CALLOUT = {
  exam: { icon: '🎯', name: 'Exam focus' },
  errata: { icon: '⚠️', name: 'Errata — your notes say otherwise' },
  convention: { icon: '📚', name: 'Textbook conventions differ' },
  tip: { icon: '💡', name: 'Insight' },
  pitfall: { icon: '🕳️', name: 'Common mistake' },
  daa: { icon: '🧭', name: 'DAA connection' },
} as const;

export function Callout({ kind, children, title }: { kind: keyof typeof CALLOUT; children: ReactNode; title?: string }) {
  const c = CALLOUT[kind];
  return (
    <aside className={`callout c-${kind}`}>
      <div className="callout-h">
        <span aria-hidden>{c.icon}</span> {title ?? c.name}
      </div>
      <div>{children}</div>
    </aside>
  );
}

export function Table({ head, rows, caption }: { head: ReactNode[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="table-wrap">
      <table>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Display formula — plain HTML/Unicode, no TeX dependency. */
export function F({ children }: { children: ReactNode }) {
  return <div className="formula">{children}</div>;
}

export function Code({ id }: { id: string }) {
  return <CodePanel id={id} maxHeight={520} />;
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="steps">{children}</ol>;
}

export function Viz({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <div className="viz">
      <div className="viz-h">
        <span className="badge">▶ Interactive</span> {title}
      </div>
      {note && <p className="muted small">{note}</p>}
      {children}
    </div>
  );
}

/** Text field + buttons for custom inputs. */
export function InputBar({
  value,
  onChange,
  onRandom,
  label,
  placeholder,
  error,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  onRandom?: () => void;
  label: string;
  placeholder?: string;
  error?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="inputbar">
      <label>
        <span>{label}</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false} />
      </label>
      {onRandom && (
        <button className="btn" onClick={onRandom}>
          🎲 Random
        </button>
      )}
      {children}
      {error && <span className="input-err">{error}</span>}
    </div>
  );
}

/** Parse "5, 3 8 1" -> numbers. Returns error string when invalid. */
export function parseNums(s: string, o: { min?: number; max?: number; minLen?: number; maxLen?: number } = {}): number[] | string {
  const parts = s.split(/[\s,]+/).filter(Boolean);
  const nums = parts.map(Number);
  if (nums.some((x) => !Number.isInteger(x))) return 'Use whole numbers separated by commas or spaces.';
  const { min = -999, max = 999, minLen = 1, maxLen = 12 } = o;
  if (nums.length < minLen || nums.length > maxLen) return `Enter between ${minLen} and ${maxLen} numbers.`;
  if (nums.some((x) => x < min || x > max)) return `Keep values between ${min} and ${max}.`;
  return nums;
}
