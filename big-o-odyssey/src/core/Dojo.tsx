import { useMemo, useState } from 'react';
import { snippet } from './snippets';
import { tokenize, diffCode, describeErrors } from './cppTokens';
import { CodeView } from './CodePanel';
import { CodeEditor, CodeRecall } from './Quiz';
import { Rng, newSeed } from './rng';
import { sfx } from './sfx';
import { patchLevel, update, today, BOX_DAYS, useProgress } from './progress';

/** The memorisation ladder: copy → order → fill 30% → fill 70% → blank page. */
export const STAGES = ['Type-along', 'Line order', 'Fill 30%', 'Fill 70%', 'Blank page'] as const;

export function Dojo({ levelId, ids, cleared }: { levelId: string; ids: string[]; cleared: Record<string, number> }) {
  const [sel, setSel] = useState(ids[0]);
  const s = snippet(sel);
  const done = cleared[sel] ?? 0;
  const [stage, setStage] = useState(Math.min(done + 1, 5));
  const [nonce, setNonce] = useState(0);
  const tester = useProgress().settings.tester;

  const pass = (st: number) => {
    sfx('correct');
    patchLevel(levelId, (lp) => {
      lp.dojo[sel] = Math.max(lp.dojo[sel] ?? 0, st);
    });
    if (st === 5) {
      update((p) => {
        const c = p.leitner[`code:${sel}`];
        if (!c) p.leitner[`code:${sel}`] = { box: 1, due: today() + BOX_DAYS[1] };
        p.xp += 25;
      });
      sfx('fanfare');
    } else update((p) => void (p.xp += 5));
  };

  return (
    <div className="dojo">
      {ids.length > 1 && (
        <div className="tabs small" role="tablist">
          {ids.map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={id === sel}
              className={id === sel ? 'on' : ''}
              onClick={() => {
                setSel(id);
                setStage(Math.min((cleared[id] ?? 0) + 1, 5));
              }}
            >
              {snippet(id).title} {(cleared[id] ?? 0) >= 5 ? '★' : `${cleared[id] ?? 0}/5`}
            </button>
          ))}
        </div>
      )}
      <ol className="ladder">
        {STAGES.map((name, k) => {
          const st = k + 1;
          const locked = !tester && st > done + 1;
          return (
            <li key={name}>
              <button
                className={`rung${stage === st ? ' on' : ''}${st <= done ? ' cleared' : ''}`}
                disabled={locked}
                onClick={() => {
                  setStage(st);
                  setNonce((n) => n + 1);
                }}
              >
                <span className="rung-n">{st <= done ? '✓' : locked ? '🔒' : st}</span>
                {name}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="muted small">{s.desc}</p>
      <div key={`${sel}-${stage}-${nonce}`}>
        {stage === 1 && <TypeAlong id={sel} onPass={() => pass(1)} />}
        {stage === 2 && <Parsons id={sel} onPass={() => pass(2)} />}
        {stage === 3 && <Cloze id={sel} ratio={0.3} onPass={() => pass(3)} />}
        {stage === 4 && <Cloze id={sel} ratio={0.7} onPass={() => pass(4)} />}
        {stage === 5 && <CodeRecall id={sel} mode="dojo" onResult={(ok) => ok && pass(5)} />}
      </div>
    </div>
  );
}

function TypeAlong({ id, onPass }: { id: string; onPass: () => void }) {
  const s = snippet(id);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string[] | null>(null);
  const [ok, setOk] = useState(false);
  return (
    <div className="split">
      <div>
        <div className="eyebrow">Reference — read it, then type it</div>
        <CodeView code={s.code} maxHeight={520} />
      </div>
      <div>
        <div className="eyebrow">Your copy</div>
        <CodeEditor value={code} onChange={setCode} label={`Type along ${s.title}`} rows={Math.min(28, s.code.split('\n').length + 2)} />
        <div className="row-btns">
          <button
            className="btn primary"
            onClick={() => {
              const d = diffCode(s.code, code);
              if (d.errors === 0) {
                setOk(true);
                setMsg(null);
                onPass();
              } else {
                sfx('wrong');
                setMsg(describeErrors(d.ops));
              }
            }}
          >
            Check
          </button>
        </div>
        {ok && <div className="recall-ok">✓ Identical. Next rung unlocked.</div>}
        {msg && (
          <ul className="recall-errors">
            {msg.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Parsons({ id, onPass }: { id: string; onPass: () => void }) {
  const s = snippet(id);
  const lines = useMemo(() => s.code.split('\n').map((l) => l.trim()).filter(Boolean), [s.code]);
  const [pool, setPool] = useState(() => new Rng(newSeed()).shuffle(lines.map((t, i) => ({ t, i }))));
  const [ans, setAns] = useState<{ t: string; i: number }[]>([]);
  const [verdict, setVerdict] = useState<null | number>(null); // index of first wrong line, -1 = all right

  const check = () => {
    const firstBad = ans.findIndex((l, k) => l.t !== lines[k]);
    if (firstBad === -1 && ans.length === lines.length) {
      setVerdict(-1);
      onPass();
    } else {
      setVerdict(firstBad === -1 ? ans.length : firstBad);
      sfx('wrong');
    }
  };
  return (
    <div className="split">
      <div>
        <div className="eyebrow">Shuffled lines — click to append</div>
        <div className="parsons">
          {pool.map((l) => (
            <button
              key={l.i}
              className="pline"
              onClick={() => {
                sfx('click');
                setPool(pool.filter((x) => x !== l));
                setAns([...ans, l]);
                setVerdict(null);
              }}
            >
              <code>{l.t}</code>
            </button>
          ))}
          {!pool.length && <p className="muted">All lines placed.</p>}
        </div>
      </div>
      <div>
        <div className="eyebrow">Your program — click a line to send it back</div>
        <div className="parsons answer">
          {ans.map((l, k) => (
            <button
              key={l.i}
              className={`pline${verdict !== null && verdict >= 0 && k >= verdict ? ' bad' : ''}${verdict === -1 ? ' good' : ''}`}
              onClick={() => {
                setAns(ans.filter((x) => x !== l));
                setPool([...pool, l]);
                setVerdict(null);
              }}
            >
              <span className="ln">{k + 1}</span>
              <code>{l.t}</code>
            </button>
          ))}
        </div>
        <div className="row-btns">
          <button className="btn primary" onClick={check} disabled={!ans.length}>
            Check order
          </button>
        </div>
        {verdict !== null && verdict >= 0 && (
          <p className="recall-errors">
            Lines 1–{verdict} are right; line {verdict + 1} {verdict >= ans.length ? 'is missing' : 'is out of place'}.
          </p>
        )}
        {verdict === -1 && <div className="recall-ok">✓ Correct order.</div>}
      </div>
    </div>
  );
}

const BLANKABLE = new Set(['id', 'kw', 'type', 'num', 'op']);

function Cloze({ id, ratio, onPass }: { id: string; ratio: number; onPass: () => void }) {
  const s = snippet(id);
  const { toks, blanks } = useMemo(() => {
    const toks = tokenize(s.code);
    const eligible = toks.map((t, i) => (BLANKABLE.has(t.t) ? i : -1)).filter((i) => i >= 0);
    const rng = new Rng(newSeed());
    const k = Math.max(1, Math.round(eligible.length * ratio));
    return { toks, blanks: new Set(rng.shuffle(eligible).slice(0, k)) };
  }, [s.code, ratio]);
  const [vals, setVals] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const wrong = [...blanks].filter((i) => (vals[i] ?? '').trim() !== toks[i].s);
  const allRight = checked && wrong.length === 0;

  // build lines of token indices
  const lines: number[][] = [[]];
  toks.forEach((t, i) => {
    const parts = t.s.split('\n');
    if (parts.length === 1) lines[lines.length - 1].push(i);
    else {
      // whitespace/comment spanning lines: render pieces
      parts.forEach((_, k) => {
        if (k > 0) lines.push([]);
        lines[lines.length - 1].push(-(i * 1000 + k) - 1);
      });
    }
  });

  return (
    <div>
      <div className="eyebrow">
        Fill the {blanks.size} blanks ({Math.round(ratio * 100)}% of keywords, names, numbers and operators)
      </div>
      <div className="code cloze">
        <pre>
          {lines.map((ln, li) => (
            <div key={li} className="code-line">
              <span className="ln">{li + 1}</span>
              <span className="lc">
                {ln.map((ix) => {
                  if (ix < 0) {
                    const enc = -ix - 1;
                    const ti = Math.floor(enc / 1000);
                    const part = toks[ti].s.split('\n')[enc % 1000];
                    return part ? (
                      <span key={ix} className={`tk-${toks[ti].t}`}>
                        {part}
                      </span>
                    ) : null;
                  }
                  const t = toks[ix];
                  if (!blanks.has(ix))
                    return (
                      <span key={ix} className={`tk-${t.t}`}>
                        {t.s}
                      </span>
                    );
                  const bad = checked && wrong.includes(ix);
                  return (
                    <input
                      key={ix}
                      className={`blank${bad ? ' bad' : checked ? ' good' : ''}`}
                      style={{ width: `${Math.max(2, t.s.length) + 1.2}ch` }}
                      value={vals[ix] ?? ''}
                      aria-label={`Blank on line ${li + 1}`}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoComplete="off"
                      onChange={(e) => {
                        setVals({ ...vals, [ix]: e.target.value });
                        setChecked(false);
                      }}
                    />
                  );
                })}
              </span>
            </div>
          ))}
        </pre>
      </div>
      <div className="row-btns">
        <button
          className="btn primary"
          onClick={() => {
            setChecked(true);
            if (wrong.length === 0) onPass();
            else sfx('wrong');
          }}
        >
          Check blanks
        </button>
        {checked && !allRight && <span className="recall-errors inline">{wrong.length} blank(s) wrong — fix the red ones.</span>}
        {allRight && <span className="recall-ok inline">✓ All blanks right.</span>}
      </div>
    </div>
  );
}
