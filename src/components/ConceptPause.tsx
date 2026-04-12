import { useEffect, useState } from 'react'
import { bus } from '../OperationBus'
import type { ConceptPausePayload } from '../OperationBus'
import { useGameStore } from '../store/gameStore'
import type { GameState } from '../store/gameStore'

const ZONE_ACCENT: Record<string, string> = {
  array: '#00ffcc',
  stack: '#ffcc00',
  list: '#00ff88',
}

export function ConceptPause() {
  const [data, setData] = useState<ConceptPausePayload | null>(null)
  const currentZone = useGameStore((s: GameState) => s.currentZone)

  useEffect(() => {
    const onPause = (payload: ConceptPausePayload) => setData(payload)
    bus.on('concept:pause', onPause)
    return () => { bus.off('concept:pause', onPause) }
  }, [])

  useEffect(() => {
    if (!data) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setData(null)
        bus.emit('concept:resume', undefined)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data])

  if (!data) return null

  const accent = ZONE_ACCENT[currentZone] ?? '#00ffcc'

  const handleOverlayClick = () => {
    setData(null)
    bus.emit('concept:resume', undefined)
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 90,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={handleOverlayClick}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .concept-card-anim {
            animation: concept-glow-pulse 2s ease-in-out infinite;
          }
          .concept-hint-anim {
            animation: concept-hint-blink 1.5s ease-in-out infinite;
          }
        }
        @keyframes concept-glow-pulse {
          0%,  100% { box-shadow: 0 0 10px ${accent}33, 0 0 2px ${accent}55; }
          50%        { box-shadow: 0 0 26px ${accent}77, 0 0 6px ${accent}99; }
        }
        @keyframes concept-hint-blink {
          0%,  100% { opacity: 0.28; }
          50%        { opacity: 0.65; }
        }
      `}</style>

      <div
        className="concept-card-anim"
        style={{
          maxWidth: 520,
          width: '90%',
          backgroundColor: '#0d0d0d',
          border: `1px solid ${accent}44`,
          borderRadius: 6,
          padding: '28px 32px',
          fontFamily: 'monospace',
          cursor: 'default',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* dim label */}
        <div style={{
          color: '#3a3a3a',
          fontSize: 10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          💡 CONCEPT PAUSE
        </div>

        {/* title */}
        <div style={{
          color: accent,
          fontSize: 18,
          fontWeight: 'bold',
          letterSpacing: '0.04em',
          marginBottom: 14,
        }}>
          {data.title}
        </div>

        {/* body */}
        <div style={{
          color: '#cccccc',
          fontSize: 13,
          lineHeight: 1.7,
          marginBottom: 26,
        }}>
          {data.conceptBody}
        </div>

        {/* hint */}
        <div
          className="concept-hint-anim"
          style={{
            color: '#555555',
            fontSize: 11,
            textAlign: 'center',
            letterSpacing: '0.05em',
          }}
        >
          Press SPACE to continue
        </div>
      </div>
    </div>
  )
}
