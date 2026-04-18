import { useEffect, useState } from 'react'
import { virtualInput } from '../input/virtualInput'
import { useGameStore } from '../store/gameStore'
import type { GameState } from '../store/gameStore'

function isTouchDevice() {
  return typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)
}

function useIsLandscape() {
  const [landscape, setLandscape] = useState(
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  )
  useEffect(() => {
    const update = () => setLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    screen.orientation?.addEventListener('change', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      screen.orientation?.removeEventListener('change', update)
    }
  }, [])
  return landscape
}

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

function ZoneActions({ zone, sm }: { zone: string; sm: boolean }) {
  const wh = sm ? 'w-12 h-10' : 'w-16 h-14'
  const wh2 = sm ? 'w-11 h-9' : 'w-14 h-12'
  const txt = sm ? 'text-xs' : 'text-sm'

  if (zone === 'array') {
    return (
      <div className="flex flex-col items-center gap-1">
        {!sm && <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">step</span>}
        <Btn
          label="STEP"
          onPress={() => virtualInput.pressSpace()}
          className={`${wh} ${txt} text-cyan-300 border-cyan-700/50 rounded-lg`}
        />
      </div>
    )
  }

  if (zone === 'stack') {
    return (
      <div className="flex flex-col items-center gap-1">
        {!sm && <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">pop</span>}
        <Btn
          label="POP"
          onPress={() => virtualInput.pressSpace()}
          className={`${wh} ${txt} text-yellow-300 border-yellow-700/50 rounded-lg`}
        />
      </div>
    )
  }

  if (zone === 'list') {
    return (
      <div className="flex gap-2 items-end">
        <div className="flex flex-col gap-1">
          <Btn
            label="INS"
            onPress={() => fireKey('Insert', 45, 'keydown')}
            onRelease={() => fireKey('Insert', 45, 'keyup')}
            className={`${wh2} ${txt} text-green-300 border-green-700/50 rounded-lg`}
          />
          <Btn
            label="DEL"
            onPress={() => fireKey('Delete', 46, 'keydown')}
            onRelease={() => fireKey('Delete', 46, 'keyup')}
            className={`${wh2} ${txt} text-red-300 border-red-700/50 rounded-lg`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Btn
            label="RPR"
            onPress={() => virtualInput.pressR()}
            className={`${wh2} ${txt} text-yellow-300 border-yellow-700/50 rounded-lg`}
          />
          <Btn
            label="ACT"
            onPress={() => virtualInput.pressSpace()}
            className={`${wh2} ${txt} text-cyan-300 border-cyan-700/50 rounded-lg`}
          />
        </div>
      </div>
    )
  }

  // boot / menu
  return (
    <Btn
      label="A"
      onPress={() => virtualInput.pressSpace()}
      className={`${sm ? 'w-12 h-12' : 'w-16 h-16'} text-xl text-green-300 border-green-700/50 rounded-full`}
    />
  )
}

export function TouchControls() {
  const [visible, setVisible] = useState(false)
  const currentZone = useGameStore((s: GameState) => s.currentZone)
  const isLandscape = useIsLandscape()

  useEffect(() => {
    setVisible(isTouchDevice())
  }, [])

  if (!visible) return null

  const btnSize = isLandscape
    ? 'w-10 h-10 text-lg'
    : 'w-14 h-14 text-xl'
  const gap = isLandscape ? 'w-10 h-10' : 'w-14 h-14'

  // Safe area insets keep controls away from notch in landscape
  const bottomInset = 'calc(8px + env(safe-area-inset-bottom, 0px))'
  const leftInset = 'max(24px, env(safe-area-inset-left, 24px))'
  const rightInset = 'max(24px, env(safe-area-inset-right, 24px))'

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[50]"
      style={{ touchAction: 'none' }}
    >
      {/* D-pad: bottom-left, respects left safe area (notch in landscape) */}
      <div
        className="absolute pointer-events-auto"
        style={{ bottom: bottomInset, left: leftInset }}
      >
        <div className="flex justify-center mb-1">
          <Btn
            label="↑"
            onPress={() => virtualInput.pressUp()}
            className={`${btnSize} text-cyan-300 border-cyan-700/50 rounded-full`}
          />
        </div>
        <div className="flex gap-1">
          <Btn
            label="←"
            onPress={() => virtualInput.pressLeft()}
            onRelease={() => virtualInput.releaseLeft()}
            className={`${btnSize} rounded-full`}
          />
          <div className={gap} />
          <Btn
            label="→"
            onPress={() => virtualInput.pressRight()}
            onRelease={() => virtualInput.releaseRight()}
            className={`${btnSize} rounded-full`}
          />
        </div>
      </div>

      {/* Action buttons: bottom-right, respects right safe area */}
      <div
        className="absolute pointer-events-auto flex gap-3 items-end"
        style={{ bottom: bottomInset, right: rightInset }}
      >
        <ZoneActions zone={currentZone} sm={isLandscape} />
      </div>
    </div>
  )
}
