import { useState } from 'react';
import { useProgress, patchLevel, update, starsFor, today, BOX_DAYS, levelProgress } from '../core/progress';
import { LEVELS, levelById, WORLDS, levelsOfWorld } from '../levels';
import { levelUnlocked, PASS_MARK } from '../core/unlock';
import { Dojo } from '../core/Dojo';
import { TestRunner } from '../core/Quiz';
import { newSeed } from '../core/rng';
import { sfx } from '../core/sfx';
import { snippet } from '../core/snippets';

const TABS = ['learn', 'practice', 'dojo', 'test'] as const;
type Tab = (typeof TABS)[number];
export const TEST_QUESTIONS = 10;

export function LevelScreen({ id, tab }: { id: string; tab?: string }) {
  const p = useProgress();
  const lvl = levelById(id);
  if (!lvl) return <div className="panel">Unknown level. <a href="#/">Back to map</a></div>;
  if (!levelUnlocked(p, id))
    return (
      <div className="panel locked-panel">
        <h1>🔒 Level {lvl.n} is locked</h1>
        <p>Pass the previous level's test (or its world boss) to open it. Want to look around anyway? Turn on Tester mode in Settings.</p>
        <a className="btn" href="#/">
          Back to map
        </a>
      </div>
    );

  const lp = levelProgress(p, id);
  const allSnips = [...lvl.snippets, ...(lvl.extraSnippets ?? [])];
  const tabs = TABS.filter((t) => (t === 'practice' ? !!lvl.Practice : t === 'dojo' ? allSnips.length > 0 : true));
  const cur: Tab = (tabs as readonly string[]).includes(tab ?? '') ? (tab as Tab) : 'learn';
  const world = WORLDS.find((w) => w.n === lvl.world)!;
  const idx = LEVELS.indexOf(lvl);
  const nextLvl = LEVELS[idx + 1];
  const lastOfWorld = levelsOfWorld(lvl.world).at(-1)?.id === lvl.id;

  return (
    <div className="level">
      <div className="level-head">
        <a href="#/" className="back">
          ← Map
        </a>
        <div className="eyebrow">
          World {world.n} · {world.name} · Level {lvl.n}
        </div>
        <h1>{lvl.title}</h1>
        <p className="lede">{lvl.blurb}</p>
        <div className="tags">
          {lvl.syllabus.map((s) => (
            <span key={s} className="tag">
              {s}
            </span>
          ))}
          {lp.passed && <span className="tag good">Passed · best {lp.best}% · {'★'.repeat(lp.stars ?? 0)}</span>}
        </div>
        <div className="tabs" role="tablist">
          {tabs.map((t, k) => (
            <a key={t} role="tab" aria-selected={cur === t} className={cur === t ? 'on' : ''} href={`#/level/${id}/${t}`}>
              <span className="tab-n">{k + 1}</span>
              {t === 'learn' ? 'Learn' : t === 'practice' ? 'Practice' : t === 'dojo' ? 'Code Dojo' : 'Level Test'}
              {t === 'learn' && lp.learned && ' ✓'}
              {t === 'practice' && lp.practiced && ' ✓'}
              {t === 'dojo' && allSnips.length > 0 && ` ${allSnips.filter((s) => (lp.dojo[s] ?? 0) >= 5).length}/${allSnips.length}`}
              {t === 'test' && lp.passed && ' ✓'}
            </a>
          ))}
        </div>
      </div>

      {cur === 'learn' && (
        <article className="lesson">
          <lvl.Lesson />
          <section className="lsec refs">
            <h2>References</h2>
            <ul>
              {lvl.refs.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
          <div className="row-btns end">
            <a
              className="btn primary"
              href={`#/level/${id}/${tabs[1]}`}
              onClick={() => {
                if (!lp.learned) {
                  patchLevel(id, (l) => void (l.learned = true));
                  update((s) => void (s.xp += 10));
                }
              }}
            >
              I've read it → {tabs[1] === 'practice' ? 'Practice' : tabs[1] === 'dojo' ? 'Code Dojo' : 'Test'}
            </a>
          </div>
        </article>
      )}

      {cur === 'practice' && lvl.Practice && (
        <div className="practice">
          <p className="muted">
            Predict each step before it happens. Wrong guesses cost nothing; the goal is to make the algorithm's next move feel obvious.
          </p>
          <lvl.Practice />
          <div className="row-btns end">
            <a
              className="btn primary"
              href={`#/level/${id}/${tabs.includes('dojo') ? 'dojo' : 'test'}`}
              onClick={() => {
                if (!lp.practiced) {
                  patchLevel(id, (l) => void (l.practiced = true));
                  update((s) => void (s.xp += 10));
                }
              }}
            >
              Done practising → {tabs.includes('dojo') ? 'Code Dojo' : 'Test'}
            </a>
          </div>
        </div>
      )}

      {cur === 'dojo' && <Dojo levelId={id} ids={allSnips} cleared={lp.dojo} />}

      {cur === 'test' && (
        <LevelTest
          key={id}
          id={id}
          onPassedNext={nextLvl && !lastOfWorld ? `#/level/${nextLvl.id}` : `#/boss/${lvl.world}`}
          nextLabel={nextLvl && !lastOfWorld ? `Level ${nextLvl.n}: ${nextLvl.title}` : `World ${lvl.world} boss`}
        />
      )}
    </div>
  );
}

function LevelTest({ id, onPassedNext, nextLabel }: { id: string; onPassedNext: string; nextLabel: string }) {
  const lvl = levelById(id)!;
  const p = useProgress();
  const lp = levelProgress(p, id);
  const [seed, setSeed] = useState<number | null>(null);
  const [result, setResult] = useState<null | { score: number; codeOk: boolean }>(null);
  const notReady = lvl.snippets.filter((s) => (lp.dojo[s] ?? 0) < 5);

  if (seed === null)
    return (
      <div className="panel test-intro">
        <h2>Level test</h2>
        <ul className="rules">
          <li>
            <b>{TEST_QUESTIONS}</b> questions, freshly randomised every attempt — MCQs, traces on new inputs, numeric answers.
          </li>
          {lvl.snippets.length > 0 ? (
            <li>
              Then write <b>{lvl.snippets.map((s) => snippet(s).title).join(', ')}</b> from a blank editor. Whitespace and comments are ignored; every
              other token must match. You get two submissions per snippet — the first only tells you how many errors.
            </li>
          ) : (
            <li>This is a concept level — no code to recall.</li>
          )}
          <li>
            Pass: <b>≥ {PASS_MARK}%</b>
            {lvl.snippets.length > 0 && <> and <b>perfect code</b></>}. Stars: 80% ★ · 90% ★★ · 100% ★★★.
          </li>
        </ul>
        {notReady.length > 0 && (
          <p className="warn-note">
            Heads-up: you haven't cleared the Blank-page rung in the Code Dojo for {notReady.map((s) => snippet(s).title).join(', ')}. You can still try.
          </p>
        )}
        <button className="btn primary big" onClick={() => setSeed(newSeed())}>
          Start test
        </button>
      </div>
    );

  if (result) {
    const pass = result.score >= PASS_MARK && result.codeOk;
    return (
      <div className={`panel result ${pass ? 'pass' : 'fail'}`}>
        <div className="result-big">{pass ? '🏆' : '🧩'}</div>
        <h2>{pass ? 'Level cleared!' : 'Not yet — the door stays shut.'}</h2>
        <p className="score">
          Questions: <b>{result.score}%</b> {result.score >= PASS_MARK ? '✓' : `(need ${PASS_MARK}%)`}
          {lvl.snippets.length > 0 && (
            <>
              {' '}
              · Code: <b>{result.codeOk ? 'perfect ✓' : 'had errors ✗'}</b>
            </>
          )}
        </p>
        {pass && <p className="stars-big">{'★'.repeat(starsFor(result.score))}</p>}
        <div className="row-btns center">
          {pass ? (
            <a className="btn primary big" href={onPassedNext}>
              Next: {nextLabel} →
            </a>
          ) : (
            <button
              className="btn primary big"
              onClick={() => {
                setResult(null);
                setSeed(newSeed());
              }}
            >
              Retry with new questions
            </button>
          )}
          <a className="btn" href={`#/level/${id}/learn`}>
            Review lesson
          </a>
          {lvl.snippets.length > 0 && (
            <a className="btn" href={`#/level/${id}/dojo`}>
              Code Dojo
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <TestRunner
      key={seed}
      title={`Level ${lvl.n} test`}
      gens={lvl.quiz}
      count={TEST_QUESTIONS}
      seed={seed}
      snippets={lvl.snippets}
      onFinish={(score, codeOk) => {
        const pass = score >= PASS_MARK && codeOk;
        setResult({ score, codeOk });
        if (pass) {
          const stars = starsFor(score);
          const first = !lp.passed;
          patchLevel(id, (l) => {
            l.passed = true;
            l.best = Math.max(l.best ?? 0, score);
            l.stars = Math.max(l.stars ?? 0, stars);
          });
          update((s) => {
            s.xp += (first ? 50 : 10) + stars * 10;
            lvl.cards.forEach((_, k) => {
              const key = `fact:${id}:${k}`;
              s.leitner[key] ??= { box: 1, due: today() + BOX_DAYS[1] };
            });
            lvl.snippets.forEach((sn) => {
              s.leitner[`code:${sn}`] ??= { box: 1, due: today() + BOX_DAYS[1] };
            });
          });
          sfx('fanfare');
          if (first) setTimeout(() => sfx('unlock'), 900);
        } else {
          patchLevel(id, (l) => void (l.best = Math.max(l.best ?? 0, score)));
          sfx('wrong');
        }
      }}
    />
  );
}
