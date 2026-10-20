import { useEffect, useMemo, useRef } from 'react';
import { tokenize } from './cppTokens';
import { snippet } from './snippets';

/** Splits highlighted tokens into lines of <span>s. */
export function highlightLines(code: string) {
  const lines: { t: string; s: string }[][] = [[]];
  for (const tk of tokenize(code)) {
    const parts = tk.s.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ t: tk.t, s: part });
    });
  }
  return lines;
}

export function CodeView({ code, active, maxHeight, dim }: { code: string; active?: number; maxHeight?: number; dim?: boolean }) {
  const lines = useMemo(() => highlightLines(code), [code]);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // keep the active line visible without scrolling the page
    const el = box.current;
    if (!el || !active) return;
    const row = el.querySelector<HTMLElement>(`[data-ln="${active}"]`);
    if (!row) return;
    const top = row.offsetTop - el.clientHeight / 2 + row.clientHeight / 2;
    el.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [active]);
  return (
    <div className={`code${dim ? ' dim' : ''}`} ref={box} style={{ maxHeight }}>
      <pre>
        {lines.map((ln, i) => (
          <div key={i} data-ln={i + 1} className={`code-line${active === i + 1 ? ' on' : ''}`}>
            <span className="ln">{i + 1}</span>
            <span className="lc">
              {ln.length ? ln.map((tk, j) => (
                <span key={j} className={`tk-${tk.t}`}>
                  {tk.s}
                </span>
              )) : ' '}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function CodePanel({ id, label, maxHeight = 380 }: { id: string; label?: string; maxHeight?: number }) {
  const s = snippet(id);
  const active = label ? s.labels[label] : undefined;
  return (
    <div className="code-panel">
      <div className="code-title">
        <span className="dot" /> {s.title}
        <span className="lang">C++</span>
      </div>
      <CodeView code={s.code} active={active} maxHeight={maxHeight} />
    </div>
  );
}
