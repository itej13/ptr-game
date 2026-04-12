import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import type { GameState, CodexEntry } from '../store/gameStore'

type Tab = 'pause' | 'codex'

export function PauseMenu() {
  const paused = useGameStore((s: GameState) => s.paused)
  const codex  = useGameStore((s: GameState) => s.codex)
  const toggle = useGameStore((s: GameState) => s.togglePause)
  const [tab, setTab] = useState<Tab>('pause')
  const [selected, setSelected] = useState<CodexEntry | null>(null)

  if (!paused) return null

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/85 select-none">
      <div className="w-[680px] max-w-[90vw] max-h-[80vh] bg-[#060c08] border border-green-900/60 rounded-lg overflow-hidden flex flex-col font-mono">

        {/* tabs */}
        <div className="flex border-b border-green-900/40">
          <TabBtn label="PAUSE" active={tab === 'pause'} onClick={() => { setTab('pause'); setSelected(null) }} />
          <TabBtn label={`CODEX (${codex.length})`} active={tab === 'codex'} onClick={() => { setTab('codex'); setSelected(null) }} />
          <div className="flex-1" />
          <button
            onClick={toggle}
            className="px-4 text-green-800 hover:text-green-400 text-xs tracking-wider transition-colors cursor-pointer"
          >
            ESC — RESUME
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'pause' && <PauseTab onResume={toggle} />}
          {tab === 'codex' && !selected && <CodexList entries={codex} onSelect={setSelected} />}
          {tab === 'codex' && selected && <CodexDetail entry={selected} onBack={() => setSelected(null)} />}
        </div>
      </div>
    </div>
  )
}

/* ── tab button ─────────────────────────────── */

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-xs tracking-widest transition-colors cursor-pointer
        ${active
          ? 'text-green-300 border-b-2 border-green-400 bg-green-950/30'
          : 'text-green-800 hover:text-green-500'}`}
    >
      {label}
    </button>
  )
}

/* ── pause tab ──────────────────────────────── */

function PauseTab({ onResume }: { onResume: () => void }) {
  const zone = useGameStore((s: GameState) => s.currentZone)

  return (
    <div className="space-y-6">
      <div>
        <div className="text-green-600 text-xs mb-1 tracking-widest">CURRENT ZONE</div>
        <div className="text-green-300 text-lg">{zone || 'boot'}</div>
      </div>

      <div className="text-green-800 text-xs space-y-1">
        <div>ESC — resume game</div>
        <div>→ / ← — navigate nodes</div>
        <div>SPACE — primary action</div>
        <div>R — repair vine (Zone 3)</div>
      </div>

      <button
        onClick={onResume}
        className="font-mono text-sm text-green-400 border border-green-700 bg-green-950/40 px-6 py-2 rounded
                   hover:bg-green-900/50 hover:text-green-300 hover:border-green-400
                   transition-colors cursor-pointer tracking-wider"
      >
        [ RESUME ]
      </button>
    </div>
  )
}

/* ── codex list ─────────────────────────────── */

function CodexList({ entries, onSelect }: { entries: CodexEntry[]; onSelect: (e: CodexEntry) => void }) {
  if (entries.length === 0) {
    return (
      <div className="text-green-900 text-sm py-12 text-center">
        No codex entries yet. Complete a zone to unlock.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-green-700 text-xs tracking-widest mb-2">UNLOCKED DATA STRUCTURES</div>
      {entries.map((e) => (
        <button
          key={e.zone}
          onClick={() => onSelect(e)}
          className="w-full text-left bg-green-950/30 border border-green-900/40 rounded p-3
                     hover:border-green-600/60 hover:bg-green-950/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-green-400 text-sm group-hover:text-green-300">{e.name}</span>
            <span className="text-green-800 text-xs">— {e.zone}</span>
          </div>
          <div className="text-green-700 text-xs mt-1">{e.oneLiner}</div>
        </button>
      ))}
    </div>
  )
}

/* ── codex detail ───────────────────────────── */

function CodexDetail({ entry, onBack }: { entry: CodexEntry; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-green-700 text-xs hover:text-green-400 transition-colors cursor-pointer"
      >
        ← back to list
      </button>

      <div>
        <div className="text-green-400 text-lg">{entry.name}</div>
        <div className="text-green-700 text-xs mt-0.5">{entry.oneLiner}</div>
      </div>

      {/* pseudocode */}
      <div className="bg-black/50 border border-green-900/40 rounded p-3">
        <div className="text-green-700 text-[10px] tracking-widest mb-2">PSEUDOCODE</div>
        <pre className="text-green-400/85 text-xs leading-relaxed whitespace-pre">{entry.pseudocode}</pre>
      </div>

      {/* big-O table */}
      <div className="bg-black/50 border border-green-900/40 rounded p-3">
        <div className="text-green-700 text-[10px] tracking-widest mb-2">COMPLEXITY</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-green-700">
              <th className="text-left py-0.5 font-normal">Operation</th>
              <th className="text-right py-0.5 font-normal">Time</th>
            </tr>
          </thead>
          <tbody>
            {entry.bigO.map((row) => (
              <tr key={row.op} className="border-t border-green-900/20">
                <td className="text-green-500 py-1">{row.op}</td>
                <td className={`text-right py-1 font-bold ${
                  row.time === 'O(1)' ? 'text-green-400'
                    : row.time === 'O(log n)' ? 'text-yellow-400'
                    : 'text-red-400'
                }`}>{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
