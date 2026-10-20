import { useProgress } from '../core/progress';
import { WORLDS, LEVELS, levelsOfWorld } from '../levels';
import { levelUnlocked, bossUnlocked } from '../core/unlock';

export function WorldMap() {
  const p = useProgress();
  const next = LEVELS.find((l) => levelUnlocked(p, l.id) && !p.levels[l.id]?.passed);
  const passed = LEVELS.filter((l) => p.levels[l.id]?.passed).length;
  const pendingBoss = WORLDS.find((w) => levelsOfWorld(w.n).length && bossUnlocked(p, w.n) && !p.bosses[w.n]?.passed);

  return (
    <div className="map">
      <section className="hero">
        <div>
          <div className="eyebrow">DTU · Data Structures + Design &amp; Analysis of Algorithms</div>
          <h1>Learn it. Watch it run. Write it from memory.</h1>
          <p className="lede">
            {LEVELS.length} levels across {WORLDS.length} worlds, in order of difficulty. Each level teaches a concept, lets you step through it, drills
            the C++ until you can write it blind, and only opens the next door when you pass its test: <strong>≥ 80%</strong> and{' '}
            <strong>zero-error code recall</strong>.
          </p>
          <div className="row-btns">
            {pendingBoss && !p.settings.tester ? (
              <a className="btn primary big" href={`#/boss/${pendingBoss.n}`}>
                ⚔ Face the World {pendingBoss.n} boss
              </a>
            ) : next ? (
              <a className="btn primary big" href={`#/level/${next.id}`}>
                {passed ? 'Continue' : 'Start'} · Level {next.n}: {next.title}
              </a>
            ) : (
              <span className="badge big">All levels cleared 🏆</span>
            )}
          </div>
        </div>
        <div className="hero-stats">
          <div>
            <b>{passed}</b>
            <span>levels cleared</span>
          </div>
          <div>
            <b>{LEVELS.reduce((s, l) => s + (p.levels[l.id]?.stars ?? 0), 0)}</b>
            <span>stars</span>
          </div>
          <div>
            <b>{Object.keys(p.leitner).filter((k) => k.startsWith('code:')).length}</b>
            <span>snippets mastered</span>
          </div>
        </div>
      </section>

      <ol className="worlds">
        {WORLDS.map((w) => {
          const ls = levelsOfWorld(w.n);
          const open = ls.length > 0 && levelUnlocked(p, ls[0].id);
          const done = ls.filter((l) => p.levels[l.id]?.passed).length;
          const boss = p.bosses[w.n];
          return (
            <li key={w.n} className={`world${open ? '' : ' locked'}`}>
              <div className="world-head">
                <span className="glyph" aria-hidden>
                  {w.glyph}
                </span>
                <div>
                  <div className="eyebrow">World {w.n}</div>
                  <h2>{w.name}</h2>
                  <p className="muted">{w.tagline}</p>
                </div>
                <div className="world-prog">
                  {ls.length ? `${done}/${ls.length}` : 'soon'}
                  <div className="meter">
                    <div style={{ width: `${ls.length ? (100 * done) / ls.length : 0}%` }} />
                  </div>
                </div>
              </div>
              <div className="trail">
                {ls.map((l) => {
                  const lp = p.levels[l.id];
                  const unlocked = levelUnlocked(p, l.id);
                  return (
                    <a
                      key={l.id}
                      href={unlocked ? `#/level/${l.id}` : undefined}
                      className={`stop${lp?.passed ? ' passed' : unlocked ? ' open' : ' locked'}${next?.id === l.id ? ' current' : ''}`}
                      aria-disabled={!unlocked}
                      title={unlocked ? l.title : `Locked — pass Level ${l.n - 1} first`}
                    >
                      <span className="stop-n">{unlocked ? l.n : '🔒'}</span>
                      <span className="stop-t">{l.title}</span>
                      <span className="stars" aria-label={`${lp?.stars ?? 0} stars`}>
                        {'★'.repeat(lp?.stars ?? 0)}
                        <span className="dim">{'★'.repeat(3 - (lp?.stars ?? 0))}</span>
                      </span>
                    </a>
                  );
                })}
                {ls.length > 0 && (
                  <a
                    href={bossUnlocked(p, w.n) ? `#/boss/${w.n}` : undefined}
                    className={`stop boss${boss?.passed ? ' passed' : bossUnlocked(p, w.n) ? ' open' : ' locked'}`}
                    aria-disabled={!bossUnlocked(p, w.n)}
                    title="World boss — cumulative test that opens the next world"
                  >
                    <span className="stop-n">⚔</span>
                    <span className="stop-t">World boss</span>
                    <span className="stars">{boss?.passed ? `${boss.best}%` : ''}</span>
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
