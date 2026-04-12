import { useEffect, useState } from 'react'
import { virtualInput } from '../input/virtualInput'
import { useGameStore } from '../store/gameStore'
import type { GameState } from '../store/gameStore'

function isTouchDevice() {
  return typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
}

/**
 * Dispatch a synthetic keyboard event at the window level so Phaser's
 * keyboard manager (which listens on window) picks it up.
 * Used for keys not in virtualInput (Zone3: Insert, Delete).
 */
function fireKey(key: string, keyCode: number, type: 'keydown' | 'keyup') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.dispatchEvent(new KeyboardEvent(type, { key, code: key, keyCode, which: keyCode, bubbles: true } as any))
}

interface BtnProps {
  label: string
  onPress: () => void
  onRelease?: () => void
  className?: string
}

function Btn({ label, onPress, onRelease, className = '' }: BtnProps) {
  return (
    <button
      style={{ touchAction: 'manipulation' }}
      className={`select-none flex items-center justify-center
        bg-black/50 border border-white/20 text-white/80
        font-mono font-bold active:opacity-50
        transition-opacity ${className}`}
      onPointerDown={e => { e.preventDefault(); e.stopPropagation(); onPress() }}
      onPointerUp={e => { e.preventDefault(); e.stopPropagation(); onRelease?.() }}
      onPointerCancel={e => { e.preventDefault(); e.stopPropagation(); onRelease?.() }}
      onPointerLeave={e => { e.preventDefault(); e.stopPropagation(); onRelease?.() }}
    >
      {label}
    </button>
  )
}

/** Right-side action buttons, contextual per zone */
function ZoneActions({ zone }: { zone: string }) {
  if (zone === 'array') {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">step</span>
        <Btn
          label="STEP"
          onPress={() => virtualInput.pressSpace()}
          className="w-16 h-14 text-sm text-cyan-300 border-cyan-700/50 rounded-lg"
        />
      </div>
    )
  }

  if (zone === 'stack') {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">pop</span>
        <Btn
          label="POP"
          onPress={() => virtualInput.pressSpace()}
          className="w-16 h-14 text-base text-yellow-300 border-yellow-700/50 rounded-lg"
        />
      </div>
    )
  }

  if (zone === 'list') {
    return (
      <div className="flex gap-2 items-end">
        <div className="flex flex-col gap-2">
          <Btn
            label="INS"
            onPress={() => fireKey('Insert', 45, 'keydown')}
            onRelease={() => fireKey('Insert', 45, 'keyup')}
            className="w-14 h-12 text-sm text-green-300 border-green-700/50 rounded-lg"
          />
          <Btn
            label="DEL"
            onPress={() => fireKey('Delete', 46, 'keydown')}
            onRelease={() => fireKey('Delete', 46, 'keyup')}
            className="w-14 h-12 text-sm text-red-300 border-red-700/50 rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Btn
            label="RPR"
            onPress={() => virtualInput.pressR()}
            className="w-14 h-12 text-sm text-yellow-300 border-yellow-700/50 rounded-lg"
          />
          <Btn
            label="ACT"
            onPress={() => virtualInput.pressSpace()}
            className="w-14 h-12 text-sm text-cyan-300 border-cyan-700/50 rounded-lg"
          />
        </div>
      </div>
    )
  }

  // boot / menu — generic action
  return (
    <Btn
      label="A"
      onPress={() => virtualInput.pressSpace()}
      className="w-16 h-16 text-xl text-green-300 border-green-700/50 rounded-full"
    />
  )
}

export function TouchControls() {
  const [visible, setVisible] = useState(false)
  const currentZone = useGameStore((s: GameState) => s.currentZone)

  useEffect(() => {
    setVisible(isTouchDevice())
  }, [])

  if (!visible) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[50]"
      style={{ touchAction: 'none' }}
    >
      {/* ── D-pad: bottom-left ─────────────────── */}
      <div
        className="absolute left-6 pointer-events-auto touch-safe-pad"
        style={{ bottom: 0 }}
      >
        {/* Up */}
        <div className="flex justify-center mb-1">
          <Btn
            label="↑"
            onPress={() => virtualInput.pressUp()}
            className="w-14 h-14 text-xl text-cyan-300 border-cyan-700/50 rounded-full"
          />
        </div>
        {/* Left · gap · Right */}
        <div className="flex gap-1">
          <Btn
            label="←"
            onPress={() => virtualInput.pressLeft()}
            onRelease={() => virtualInput.releaseLeft()}
            className="w-14 h-14 text-xl rounded-full"
          />
          <div className="w-14 h-14" />
          <Btn
            label="→"
            onPress={() => virtualInput.pressRight()}
            onRelease={() => virtualInput.releaseRight()}
            className="w-14 h-14 text-xl rounded-full"
          />
        </div>
      </div>

      {/* ── Action buttons: bottom-right ───────── */}
      <div
        className="absolute right-6 pointer-events-auto touch-safe-pad flex gap-3 items-end"
        style={{ bottom: 0 }}
      >
        <ZoneActions zone={currentZone} />
      </div>
    </div>
  )
}
