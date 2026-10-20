import { useEffect, useState } from 'react';
import { useProgress, update, today } from './core/progress';
import { WorldMap } from './screens/WorldMap';
import { LevelScreen } from './screens/LevelScreen';
import { BossScreen } from './screens/Boss';
import { Arena } from './screens/Arena';
import { Settings } from './screens/Settings';
import { Coverage } from './screens/Coverage';

function useHash() {
  const [h, setH] = useState(() => location.hash.slice(1) || '/');
  useEffect(() => {
    const on = () => {
      setH(location.hash.slice(1) || '/');
      window.scrollTo({ top: 0 });
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return h;
}

export function App() {
  const route = useHash();
  const p = useProgress();
  const due = Object.values(p.leitner).filter((c) => c.due <= today()).length;

  useEffect(() => {
    const t = p.settings.theme;
    if (t === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }, [p.settings.theme]);

  const parts = route.split('/').filter(Boolean);
  let screen;
  if (parts[0] === 'level' && parts[1]) screen = <LevelScreen key={parts[1]} id={parts[1]} tab={parts[2]} />;
  else if (parts[0] === 'boss' && parts[1]) screen = <BossScreen key={parts[1]} world={+parts[1]} />;
  else if (parts[0] === 'arena') screen = <Arena />;
  else if (parts[0] === 'settings') screen = <Settings />;
  else if (parts[0] === 'coverage') screen = <Coverage />;
  else screen = <WorldMap />;

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand" aria-label="DSA Quest home">
          <span className="brandmark">{'{}'}</span>
          <span>
            DSA&nbsp;Quest
            <small>Data Structures × DAA</small>
          </span>
        </a>
        <nav>
          <a href="#/" className={parts.length === 0 ? 'on' : ''}>
            Map
          </a>
          <a href="#/arena" className={parts[0] === 'arena' ? 'on' : ''}>
            Recall Arena{due > 0 && <span className="pill">{due}</span>}
          </a>
          <a href="#/coverage" className={parts[0] === 'coverage' ? 'on' : ''}>
            Syllabus
          </a>
          <a href="#/settings" className={parts[0] === 'settings' ? 'on' : ''}>
            Settings
          </a>
        </nav>
        <div className="hud">
          {p.settings.tester && <span className="tester">TESTER</span>}
          <span className="xp" title="Experience points">
            ⚡ {p.xp} XP
          </span>
          <button
            className="icon-btn"
            onClick={() => update((s) => void (s.settings.muted = !s.settings.muted))}
            aria-label={p.settings.muted ? 'Unmute sound' : 'Mute sound'}
            title={p.settings.muted ? 'Sound off' : 'Sound on'}
          >
            {p.settings.muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>
      <main>{screen}</main>
    </div>
  );
}
