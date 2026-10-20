import { useEffect, useRef, useState } from 'react';
import { Stage } from './Stage';
import { CodePanel, CodeView } from './CodePanel';
import { sfx } from './sfx';
import type { Frame } from './types';

/**
 * Step-through player: stage + narration + C++ line sync + variables.
 * predict=true pauses before every frame that carries an `ask` until the player answers it.
 */
export function Player({
  frames,
  code,
  codeText,
  predict = false,
  maxHeight,
  onDone,
}: {
  frames: Frame[];
  /** C++ snippet id; frame.line is a //@label in it */
  code?: string;
  /** or literal code; frame.line is then a 1-based line number */
  codeText?: string;
  predict?: boolean;
  maxHeight?: number;
  onDone?: () => void;
}) {
  const [idx, setIdxState] = useState(0);
  const idxRef = useRef(0); // synchronous copy so rapid clicks / key repeats never read a stale index
  const setIdx = (i: number) => {
    idxRef.current = i;
    setIdxState(i);
  };
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [asking, setAsking] = useState<number | null>(null); // frame index whose ask is open
  const [picked, setPicked] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>([]); // display order of the open ask's options
  const [score, setScore] = useState({ right: 0, tries: 0 });
  const answered = useRef(new Set<number>());
  const doneFired = useRef(false);

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
    setAsking(null);
    setPicked(null);
    setScore({ right: 0, tries: 0 });
    answered.current = new Set();
    doneFired.current = false;
  }, [frames]);

  const last = frames.length - 1;

  const goto = (i: number, forward: boolean) => {
    const j = Math.max(0, Math.min(last, i));
    if (forward && predict && frames[j]?.ask && !answered.current.has(j)) {
      setPlaying(false);
      setAsking(j);
      setPicked(null);
      const k = frames[j].ask!.options.map((_, i) => i);
      for (let i = k.length - 1; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        [k[i], k[r]] = [k[r], k[i]];
      }
      setOrder(k);
      return;
    }
    setIdx(j);
    if (forward) sfx(frames[j]?.sfx ?? 'tick');
    if (j === last && !doneFired.current) {
      doneFired.current = true;
      onDone?.();
    }
  };

  useEffect(() => {
    if (!playing) return;
    if (idx >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => goto(idx + 1, true), 1100 / speed);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, idx, speed, last]);

  const f = frames[Math.min(idx, last)];
  if (!f) return null;
  const ask = asking !== null ? frames[asking].ask! : null;

  const answer = (k: number) => {
    if (asking === null || !ask) return;
    setPicked(k);
    const ok = k === ask.answer;
    setScore((s) => ({ right: s.right + (ok && picked === null ? 1 : 0), tries: s.tries + (picked === null ? 1 : 0) }));
    sfx(ok ? 'correct' : 'wrong');
    if (ok) {
      answered.current.add(asking);
      const j = asking;
      setTimeout(() => {
        setAsking(null);
        setPicked(null);
        goto(j, true);
      }, 650);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (asking !== null) return;
    if (e.key === 'ArrowRight') goto(idxRef.current + 1, true);
    else if (e.key === 'ArrowLeft') goto(idxRef.current - 1, false);
    else if (e.key === ' ') {
      e.preventDefault();
      setPlaying((p) => !p);
    } else return;
    e.preventDefault();
  };

  return (
    <div className="player" tabIndex={0} onKeyDown={onKey} aria-label="Algorithm player. Left and right arrows step, space plays.">
      <div className="player-main">
        <div className="stage-wrap">
          <Stage scene={f.scene} maxHeight={maxHeight} label={f.say} />
        </div>
        <p className="say" aria-live="polite">
          <span className="step-no">
            {idx + 1}/{frames.length}
          </span>{' '}
          {f.say}
        </p>
        {ask && (
          <div className="ask" role="group" aria-label="Predict the next step">
            <div className="ask-q">🔮 Predict: {ask.prompt}</div>
            <div className="ask-opts">
              {(order.length === ask.options.length ? order : ask.options.map((_, i) => i)).map((k) => (
                <button
                  key={k}
                  className={`opt${picked === k ? (k === ask.answer ? ' right' : ' wrong') : ''}`}
                  onClick={() => answer(k)}
                  disabled={picked === ask.answer}
                >
                  {ask.options[k]}
                </button>
              ))}
            </div>
            {picked !== null && picked !== ask.answer && <div className="hint">Not quite. {ask.hint ?? 'Look at the code line and the current values, then try again.'}</div>}
          </div>
        )}
        <div className="controls">
          <button className="icon-btn" onClick={() => goto(0, false)} aria-label="First step" disabled={asking !== null}>
            ⏮
          </button>
          <button className="icon-btn" onClick={() => goto(idxRef.current - 1, false)} aria-label="Previous step" disabled={asking !== null}>
            ◀
          </button>
          <button className="icon-btn play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'} disabled={asking !== null}>
            {playing ? '⏸' : '▶'}
          </button>
          <button className="icon-btn" onClick={() => goto(idxRef.current + 1, true)} aria-label="Next step" disabled={asking !== null}>
            ▶|
          </button>
          <input
            type="range"
            min={0}
            max={last}
            value={idx}
            onChange={(e) => goto(+e.target.value, false)}
            aria-label="Scrub steps"
            disabled={predict || asking !== null}
          />
          <select value={speed} onChange={(e) => setSpeed(+e.target.value)} aria-label="Speed">
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
          {predict && (
            <span className="pscore">
              🎯 {score.right}/{score.tries}
            </span>
          )}
        </div>
      </div>
      {(code || codeText || f.vars) && (
        <div className="player-side">
          {code && <CodePanel id={code} label={f.line} />}
          {codeText && <CodeView code={codeText} active={f.line ? Number(f.line) : undefined} maxHeight={380} />}
          {f.vars && Object.keys(f.vars).length > 0 && (
            <div className="vars">
              {Object.entries(f.vars).map(([k, v]) => (
                <div key={k} className="var">
                  <span className="vk">{k}</span>
                  <span className="vv">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
