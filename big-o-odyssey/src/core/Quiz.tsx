import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Question, QGen } from './types';
import { Rng } from './rng';
import { checkAnswer, answerText, type Response } from './check';
import { CodeView } from './CodePanel';
import { Stage } from './Stage';
import { sfx } from './sfx';
import { snippet } from './snippets';
import { diffCode, describeErrors } from './cppTokens';

/** Tiny inline markup for prompts: `code`, **bold**, newlines. */
export function md(s: string): ReactNode {
  return s.split('\n').map((ln, li) => (
    <Fragment key={li}>
      {li > 0 && <br />}
      {ln.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) =>
        part.startsWith('`') ? (
          <code key={i}>{part.slice(1, -1)}</code>
        ) : part.startsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </Fragment>
  ));
}

/** Draw `count` questions, spreading across generators and avoiding duplicate prompts. */
export function drawQuestions(gens: QGen[], count: number, seed: number): Question[] {
  const rng = new Rng(seed);
  const order = rng.shuffle(gens.map((_, i) => i));
  const out: Question[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < count && i < count * 6; i++) {
    const q = gens[order[i % order.length]](rng);
    const key = q.prompt + (q.code ?? '') + JSON.stringify(q.scene?.nodes.map((n) => n.label) ?? '');
    if (seen.has(key)) continue;
    seen.add(key);
    if (q.kind !== 'input') {
      // shuffle options so answer position never gives it away
      const perm = rng.shuffle(q.options.map((_, k) => k));
      const options = perm.map((k) => q.options[k]);
      if (q.kind === 'mcq') out.push({ ...q, options, answer: perm.indexOf(q.answer) });
      else out.push({ ...q, options, answer: q.answer.map((a) => perm.indexOf(a)) });
    } else out.push(q);
  }
  return out;
}

export function QuestionView({ q, onAnswered, index, total }: { q: Question; onAnswered: (ok: boolean) => void; index?: number; total?: number }) {
  if (import.meta.env.DEV) (window as unknown as { __q: Question }).__q = q; // dev-only hook for scripted playtests
  const [resp, setResp] = useState<Response | null>(q.kind === 'multi' ? [] : null);
  const [done, setDone] = useState<null | boolean>(null);
  const [text, setText] = useState('');

  const submit = () => {
    if (done !== null) return;
    const r: Response | null = q.kind === 'input' ? text : resp;
    if (r === null || (Array.isArray(r) && !r.length) || (typeof r === 'string' && !r.trim())) return;
    const ok = checkAnswer(q, r);
    setDone(ok);
    sfx(ok ? 'correct' : 'wrong');
  };

  return (
    <div className={`question${done === null ? '' : done ? ' is-right' : ' is-wrong'}`}>
      {index !== undefined && (
        <div className="q-meta">
          Question {index + 1} of {total}
          <span className="q-kind">{q.kind === 'multi' ? 'select all that apply' : q.kind === 'input' ? 'type the answer' : 'choose one'}</span>
        </div>
      )}
      <div className="q-prompt">{md(q.prompt)}</div>
      {q.code && <CodeView code={q.code} maxHeight={300} />}
      {q.scene && (
        <div className="stage-wrap small">
          <Stage scene={q.scene} animate={false} maxHeight={300} />
        </div>
      )}
      {q.kind === 'input' ? (
        <input
          className="q-input"
          value={text}
          placeholder={q.placeholder ?? (q.norm === 'seq' ? 'e.g. 3, 1, 4' : 'answer')}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={done !== null}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          aria-label="Your answer"
        />
      ) : (
        <div className="q-opts">
          {q.options.map((o, k) => {
            const chosen = q.kind === 'mcq' ? resp === k : (resp as number[]).includes(k);
            const isAns = q.kind === 'mcq' ? q.answer === k : q.answer.includes(k);
            const cls = done === null ? (chosen ? ' chosen' : '') : isAns ? ' right' : chosen ? ' wrong' : '';
            return (
              <button
                key={k}
                className={`opt${cls}`}
                disabled={done !== null}
                aria-pressed={chosen}
                onClick={() => {
                  sfx('click');
                  if (q.kind === 'mcq') setResp(k);
                  else setResp((r) => ((r as number[]).includes(k) ? (r as number[]).filter((x) => x !== k) : [...(r as number[]), k]));
                }}
              >
                <span className="opt-key">{q.kind === 'multi' ? (chosen ? '☑' : '☐') : String.fromCharCode(65 + k)}</span>
                <span>{md(o)}</span>
              </button>
            );
          })}
        </div>
      )}
      {done === null ? (
        <button className="btn primary" onClick={submit}>
          Check
        </button>
      ) : (
        <div className="feedback" role="status">
          <div className="fb-head">{done ? '✓ Correct' : `✗ Not quite — answer: ${answerText(q)}`}</div>
          <div className="fb-explain">{md(q.explain)}</div>
          <button className="btn primary" onClick={() => onAnswered(done)} autoFocus>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- code editor ---------------- */

export function CodeEditor({ value, onChange, rows = 16, label }: { value: string; onChange: (v: string) => void; rows?: number; label: string }) {
  const escaped = useRef(false);
  return (
    <textarea
      className="code-editor"
      value={value}
      rows={rows}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      aria-label={`${label}. Tab indents; press Escape then Tab to leave the editor.`}
      placeholder="Type the C++ here…"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        const ta = e.currentTarget;
        const { selectionStart: s, selectionEnd: t, value: v } = ta;
        const put = (ins: string, del = 0) => {
          const nv = v.slice(0, s - del) + ins + v.slice(t);
          onChange(nv);
          requestAnimationFrame(() => ta.setSelectionRange(s - del + ins.length, s - del + ins.length));
        };
        if (e.key === 'Escape') {
          escaped.current = true;
          return;
        }
        if (e.key === 'Tab' && !escaped.current) {
          e.preventDefault();
          put('    ');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const lineStart = v.lastIndexOf('\n', s - 1) + 1;
          const indent = /^\s*/.exec(v.slice(lineStart, s))![0];
          const extra = /\{\s*$/.test(v.slice(lineStart, s)) ? '    ' : '';
          put('\n' + indent + extra);
        } else if (e.key === '}') {
          const lineStart = v.lastIndexOf('\n', s - 1) + 1;
          const before = v.slice(lineStart, s);
          if (/^\s{4,}$/.test(before)) {
            e.preventDefault();
            put('}', 4);
          }
        }
        if (e.key !== 'Escape') escaped.current = false;
      }}
    />
  );
}

/**
 * Full recall of a snippet from a blank editor.
 * mode 'test': 2 submissions; the first failure only reports how many token errors, the second is final.
 * mode 'dojo': unlimited, full diff shown.
 */
export function CodeRecall({ id, mode, onResult }: { id: string; mode: 'test' | 'dojo'; onResult: (ok: boolean) => void }) {
  const s = snippet(id);
  if (import.meta.env.DEV) (window as unknown as { __code: string }).__code = s.code; // dev-only hook for scripted playtests
  const [code, setCode] = useState('');
  const [tries, setTries] = useState(0);
  const [result, setResult] = useState<null | { errors: number; msgs: string[] }>(null);
  const [final, setFinal] = useState<null | boolean>(null);
  const [revealed, setRevealed] = useState(false);

  const submit = () => {
    if (!code.trim() || final !== null) return;
    const { errors, ops } = diffCode(s.code, code);
    const n = tries + 1;
    setTries(n);
    setResult({ errors, msgs: describeErrors(ops) });
    if (errors === 0) {
      sfx('correct');
      setFinal(true);
      onResult(true);
    } else {
      sfx('wrong');
      if (mode === 'test' && n >= 2) {
        setFinal(false);
        onResult(false);
      }
    }
  };

  return (
    <div className="recall">
      <div className="recall-head">
        <div>
          <div className="eyebrow">Write from memory</div>
          <h3>{s.title}</h3>
          <p className="muted">{s.desc}</p>
        </div>
        {mode === 'test' && <div className="tries">Submissions left: {Math.max(0, 2 - tries)}</div>}
      </div>
      <CodeEditor value={code} onChange={setCode} label={`Editor for ${s.title}`} rows={Math.min(26, s.code.split('\n').length + 3)} />
      {result && result.errors > 0 && (
        <div className="recall-errors" role="status">
          <strong>
            {result.errors} token error{result.errors > 1 ? 's' : ''}.
          </strong>{' '}
          {mode === 'test' && final === null && 'One more submission — find them yourself (whitespace and comments are ignored).'}
          {(mode === 'dojo' || final === false) && (
            <ul>
              {result.msgs.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {final === true && <div className="recall-ok">✓ Perfect recall — every token matches.</div>}
      <div className="row-btns">
        {final === null && (
          <button className="btn primary" onClick={submit}>
            Submit code
          </button>
        )}
        {mode === 'dojo' && final === null && (
          <button className="btn" onClick={() => setRevealed((r) => !r)}>
            {revealed ? 'Hide answer' : 'Peek (no credit)'}
          </button>
        )}
      </div>
      {(revealed || final === false) && (
        <div className="reveal">
          <div className="eyebrow">Reference</div>
          <CodeView code={s.code} maxHeight={360} />
        </div>
      )}
    </div>
  );
}

/* ---------------- test runner ---------------- */

export function TestRunner({
  gens,
  count,
  seed,
  snippets,
  onFinish,
  title,
}: {
  gens: QGen[];
  count: number;
  seed: number;
  snippets: string[];
  title: string;
  onFinish: (score: number, codeOk: boolean) => void;
}) {
  const qs = useMemo(() => drawQuestions(gens, count, seed), [gens, count, seed]);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [codeIdx, setCodeIdx] = useState(0);
  const [codeOk, setCodeOk] = useState(true);
  const [codeDone, setCodeDone] = useState(false);
  const [stage, setStage] = useState<'q' | 'code' | 'done'>(qs.length ? 'q' : snippets.length ? 'code' : 'done');
  const finished = useRef(false);

  const finish = (r: number, ok: boolean) => {
    if (finished.current) return;
    finished.current = true;
    setStage('done');
    onFinish(qs.length ? Math.round((100 * r) / qs.length) : 100, ok);
  };

  if (stage === 'q') {
    return (
      <div className="test">
        <div className="test-bar">
          <span>{title}</span>
          <div className="meter" aria-label={`Progress ${i} of ${qs.length}`}>
            <div style={{ width: `${(100 * i) / qs.length}%` }} />
          </div>
          <span>
            {right}/{i} ✓
          </span>
        </div>
        <QuestionView
          key={i}
          q={qs[i]}
          index={i}
          total={qs.length}
          onAnswered={(ok) => {
            const r = right + (ok ? 1 : 0);
            setRight(r);
            if (i + 1 < qs.length) setI(i + 1);
            else if (snippets.length) setStage('code');
            else finish(r, true);
          }}
        />
      </div>
    );
  }
  if (stage === 'code') {
    const id = snippets[codeIdx];
    return (
      <div className="test">
        <div className="test-bar">
          <span>
            {title} · code recall {codeIdx + 1}/{snippets.length}
          </span>
          <span>
            Questions: {right}/{qs.length}
          </span>
        </div>
        <CodeRecall
          key={id}
          id={id}
          mode="test"
          onResult={(ok) => {
            setCodeOk((c) => c && ok);
            setCodeDone(true);
          }}
        />
        {codeDone && (
          <button
            className="btn primary"
            autoFocus
            onClick={() => {
              setCodeDone(false);
              if (codeIdx + 1 < snippets.length) setCodeIdx(codeIdx + 1);
              else finish(right, codeOk);
            }}
          >
            {codeIdx + 1 < snippets.length ? 'Next snippet →' : 'See result →'}
          </button>
        )}
      </div>
    );
  }
  return null;
}
