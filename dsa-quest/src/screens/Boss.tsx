import { useMemo, useState } from 'react';
import { useProgress, update } from '../core/progress';
import { WORLDS, levelsOfWorld } from '../levels';
import { bossUnlocked, PASS_MARK } from '../core/unlock';
import { TestRunner } from '../core/Quiz';
import { Rng, newSeed } from '../core/rng';
import { sfx } from '../core/sfx';

export const BOSS_QUESTIONS = 12;

/** Cumulative test over a whole world: mixed questions + one random snippet. Opens the next world. */
export function BossScreen({ world }: { world: number }) {
  const p = useProgress();
  const w = WORLDS.find((x) => x.n === world);
  const ls = levelsOfWorld(world);
  const [seed, setSeed] = useState<number | null>(null);
  const [result, setResult] = useState<null | { score: number; codeOk: boolean }>(null);
  const gens = useMemo(() => ls.flatMap((l) => l.quiz), [ls]);
  const snips = useMemo(() => ls.flatMap((l) => l.snippets), [ls]);
  const chosen = useMemo(() => (seed === null || !snips.length ? [] : [new Rng(seed ^ 0x5bd1e995).pick(snips)]), [seed, snips]);

  if (!w || !ls.length) return <div className="panel">No such world. <a href="#/">Map</a></div>;
  if (!bossUnlocked(p, world))
    return (
      <div className="panel locked-panel">
        <h1>⚔ World {world} boss is sealed</h1>
        <p>Clear every level in {w.name} first.</p>
        <a className="btn" href="#/">
          Back to map
        </a>
      </div>
    );

  const nextWorld = WORLDS.find((x) => x.n === world + 1);
  const nextFirst = nextWorld ? levelsOfWorld(nextWorld.n)[0] : undefined;

  if (seed === null)
    return (
      <div className="panel test-intro boss-intro">
        <div className="eyebrow">World {world} · {w.name}</div>
        <h1>⚔ World boss</h1>
        <ul className="rules">
          <li>
            <b>{BOSS_QUESTIONS}</b> mixed questions drawn from all {ls.length} levels of this world.
          </li>
          {snips.length > 0 && <li>Plus one surprise snippet from this world — written from memory, zero errors.</li>}
          <li>
            Pass at <b>≥ {PASS_MARK}%</b> to open {nextWorld ? `World ${nextWorld.n}: ${nextWorld.name}` : 'the hall of fame'}.
          </li>
        </ul>
        <button
          className="btn primary big"
          onClick={() => {
            sfx('unlock');
            setSeed(newSeed());
          }}
        >
          Begin the fight
        </button>
      </div>
    );

  if (result) {
    const pass = result.score >= PASS_MARK && result.codeOk;
    return (
      <div className={`panel result ${pass ? 'pass' : 'fail'}`}>
        <div className="result-big">{pass ? '👑' : '🛡'}</div>
        <h2>{pass ? `${w.name} conquered!` : 'The boss stands. Regroup and retry.'}</h2>
        <p className="score">
          Questions <b>{result.score}%</b> · Code <b>{result.codeOk ? 'perfect' : 'had errors'}</b>
        </p>
        <div className="row-btns center">
          {pass ? (
            nextFirst ? (
              <a className="btn primary big" href={`#/level/${nextFirst.id}`}>
                Enter World {nextWorld!.n}: {nextWorld!.name} →
              </a>
            ) : (
              <a className="btn primary big" href="#/">
                Back to the map 🏆
              </a>
            )
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
        </div>
      </div>
    );
  }

  return (
    <TestRunner
      key={seed}
      title={`World ${world} boss`}
      gens={gens}
      count={BOSS_QUESTIONS}
      seed={seed}
      snippets={chosen}
      onFinish={(score, codeOk) => {
        setResult({ score, codeOk });
        const pass = score >= PASS_MARK && codeOk;
        if (pass) {
          const first = !p.bosses[world]?.passed;
          update((s) => {
            s.bosses[world] = { passed: true, best: Math.max(s.bosses[world]?.best ?? 0, score) };
            s.xp += first ? 150 : 20;
          });
          sfx('fanfare');
          setTimeout(() => sfx('unlock'), 1000);
        } else sfx('wrong');
      }}
    />
  );
}
