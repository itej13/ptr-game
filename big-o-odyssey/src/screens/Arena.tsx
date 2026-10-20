import { useMemo, useState } from 'react';
import { useProgress, update, today, BOX_DAYS } from '../core/progress';
import { levelById } from '../levels';
import { CodeRecall } from '../core/Quiz';
import { SNIPPETS } from '../core/snippets';
import { sfx } from '../core/sfx';

/** Spaced repetition (Leitner): right answers push a card to a longer interval, misses send it back to box 1. */
export function Arena() {
  const p = useProgress();
  const [session, setSession] = useState<string[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [codeDone, setCodeDone] = useState<null | boolean>(null);
  const t = today();
  const due = useMemo(
    () =>
      Object.entries(p.leitner)
        .filter(([k, c]) => c.due <= t && cardExists(k))
        .sort((a, b) => a[1].box - b[1].box)
        .map(([k]) => k),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session === null, t],
  );
  const total = Object.keys(p.leitner).length;

  const grade = (key: string, ok: boolean) => {
    update((s) => {
      const c = s.leitner[key];
      const box = ok ? Math.min(5, c.box + 1) : 1;
      s.leitner[key] = { box, due: today() + BOX_DAYS[box] };
      if (ok) s.xp += 3;
    });
    sfx(ok ? 'correct' : 'wrong');
    setShown(false);
    setCodeDone(null);
    setI((x) => x + 1);
  };

  if (!session)
    return (
      <div className="panel">
        <div className="eyebrow">Spaced repetition</div>
        <h1>Recall Arena</h1>
        <p className="lede">
          Every snippet you master and every key fact from a passed level lands here. Recall it on the day it's due: get it right and the gap grows (1 → 2 → 4
          → 8 → 16 days); miss it and it comes back tomorrow. This is what turns "I memorised it" into "I still know it in the exam".
        </p>
        <div className="boxes">
          {[1, 2, 3, 4, 5].map((b) => (
            <div key={b} className="box">
              <b>{Object.values(p.leitner).filter((c) => c.box === b).length}</b>
              <span>box {b} · {BOX_DAYS[b]}d</span>
            </div>
          ))}
        </div>
        {due.length ? (
          <button
            className="btn primary big"
            onClick={() => {
              setSession(due);
              setI(0);
            }}
          >
            Review {due.length} due card{due.length > 1 ? 's' : ''}
          </button>
        ) : (
          <p className="muted">{total ? 'Nothing due today. Come back tomorrow.' : 'No cards yet — pass a level to fill the arena.'}</p>
        )}
      </div>
    );

  if (i >= session.length)
    return (
      <div className="panel result pass">
        <div className="result-big">🧠</div>
        <h2>Review complete</h2>
        <button className="btn primary" onClick={() => setSession(null)}>
          Back to the arena
        </button>
      </div>
    );

  const key = session[i];
  const head = (
    <div className="test-bar">
      <span>Recall Arena</span>
      <div className="meter">
        <div style={{ width: `${(100 * i) / session.length}%` }} />
      </div>
      <span>
        {i + 1}/{session.length}
      </span>
    </div>
  );

  if (key.startsWith('code:')) {
    const id = key.slice(5);
    return (
      <div className="test">
        {head}
        <CodeRecall key={key} id={id} mode="test" onResult={(ok) => setCodeDone(ok)} />
        {codeDone !== null && (
          <button className="btn primary" onClick={() => grade(key, codeDone)}>
            Next card →
          </button>
        )}
      </div>
    );
  }
  const [, lid, k] = key.split(':');
  const card = levelById(lid)!.cards[+k];
  return (
    <div className="test">
      {head}
      <div className="flash">
        <div className="eyebrow">{levelById(lid)!.title}</div>
        <p className="flash-q">{card.q}</p>
        {shown ? (
          <>
            <p className="flash-a">{card.a}</p>
            <div className="row-btns center">
              <button className="btn primary" onClick={() => grade(key, true)}>
                I knew it
              </button>
              <button className="btn" onClick={() => grade(key, false)}>
                I missed it
              </button>
            </div>
          </>
        ) : (
          <button className="btn primary" onClick={() => setShown(true)}>
            Show answer
          </button>
        )}
      </div>
    </div>
  );
}

function cardExists(key: string) {
  if (key.startsWith('code:')) return !!SNIPPETS[key.slice(5)];
  const [, lid, k] = key.split(':');
  return !!levelById(lid)?.cards[+k];
}
