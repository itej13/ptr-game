import { useRef, useState } from 'react';
import { useProgress, update, exportProgress, importProgress, resetProgress } from '../core/progress';

export function Settings() {
  const p = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="panel">
      <h1>Settings</h1>
      <div className="setting">
        <div>
          <b>Tester mode</b>
          <p className="muted">Unlocks every level and boss so you can review the whole game. Progress still saves normally.</p>
        </div>
        <label className="switch">
          <input type="checkbox" checked={p.settings.tester} onChange={(e) => update((s) => void (s.settings.tester = e.target.checked))} />
          <span>{p.settings.tester ? 'On' : 'Off'}</span>
        </label>
      </div>
      <div className="setting">
        <div>
          <b>Sound effects</b>
          <p className="muted">Synthesised in the browser — no downloads.</p>
        </div>
        <label className="switch">
          <input type="checkbox" checked={!p.settings.muted} onChange={(e) => update((s) => void (s.settings.muted = !e.target.checked))} />
          <span>{p.settings.muted ? 'Off' : 'On'}</span>
        </label>
      </div>
      <div className="setting">
        <div>
          <b>Theme</b>
        </div>
        <select value={p.settings.theme} onChange={(e) => update((s) => void (s.settings.theme = e.target.value as 'auto'))} aria-label="Theme">
          <option value="auto">Match system</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      <div className="setting">
        <div>
          <b>Your save</b>
          <p className="muted">Progress lives in this browser only. Export it to move to another device.</p>
        </div>
        <div className="row-btns">
          <button
            className="btn"
            onClick={() => {
              const blob = new Blob([exportProgress()], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'big-o-odyssey-save.json';
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Export save
          </button>
          <button className="btn" onClick={() => file.current?.click()}>
            Import save
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                importProgress(await f.text());
                setMsg('Save imported.');
              } catch (err) {
                setMsg(`Import failed: ${(err as Error).message}`);
              }
              e.target.value = '';
            }}
          />
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Erase all progress in this browser? This cannot be undone.')) {
                resetProgress();
                setMsg('Progress reset.');
              }
            }}
          >
            Reset progress
          </button>
        </div>
      </div>
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}
