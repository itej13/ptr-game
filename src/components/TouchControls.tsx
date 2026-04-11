import { useEffect, useState } from 'react'
import { virtualInput } from '../input/virtualInput'

/** Only render on devices that support touch */
function isTouchDevice() {
  return typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
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
      className={`select-none touch-none flex items-center justify-center
        rounded-full bg-black/50 border border-white/20 text-white/80
        font-mono font-bold active:bg-white/10 active:scale-95
        transition-transform ${className}`}
      onPointerDown={e => { e.preventDefault(); onPress() }}
      onPointerUp={e => { e.preventDefault(); onRelease?.() }}
      onPointerCancel={e => { e.preventDefault(); onRelease?.() }}
      onPointerLeave={e => { e.preventDefault(); onRelease?.() }}
    >
      {label}
    </button>
  )
}

export function TouchControls() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(isTouchDevice())
  }, [])

  if (!visible) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-[50]">
      {/* ── D-pad: bottom-left ─────────────────── */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        {/* Jump row */}
        <div className="flex justify-center mb-1">
          <Btn
            label="↑"
            onPress={() => virtualInput.pressUp()}
            className="w-14 h-14 text-xl text-cyan-300 border-cyan-700/50"
          />
        </div>
        {/* Left / Right row */}
        <div className="flex gap-1">
          <Btn
            label="←"
            onPress={() => virtualInput.pressLeft()}
            onRelease={() => virtualInput.releaseLeft()}
            className="w-14 h-14 text-xl"
          />
          <div className="w-14 h-14" /> {/* centre gap */}
          <Btn
            label="→"
            onPress={() => virtualInput.pressRight()}
            onRelease={() => virtualInput.releaseRight()}
            className="w-14 h-14 text-xl"
          />
        </div>
      </div>

      {/* ── Action buttons: bottom-right ───────── */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex gap-3 items-end">
        {/* R — repair vine (Zone 3) */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">repair</span>
          <Btn
            label="R"
            onPress={() => virtualInput.pressR()}
            className="w-12 h-12 text-base text-yellow-300 border-yellow-700/50"
          />
        </div>

        {/* A — Space (binary step / pop / cut cycle) */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">action</span>
          <Btn
            label="A"
            onPress={() => virtualInput.pressSpace()}
            className="w-16 h-16 text-xl text-green-300 border-green-700/50"
          />
        </div>
      </div>
    </div>
  )
}
