import { useEffect } from 'react'
import { PhaserGame } from './components/PhaserGame'
import { HUD } from './components/HUD'
import { PauseMenu } from './components/PauseMenu'
import { TouchControls } from './components/TouchControls'
import { useGameStore } from './store/gameStore'
import type { GameState } from './store/gameStore'

export default function App() {
  const currentZone = useGameStore((s: GameState) => s.currentZone)
  const togglePause = useGameStore((s: GameState) => s.togglePause)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentZone !== 'boot') togglePause()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentZone, togglePause])

  return (
    <div className="relative w-[1280px] h-[720px]">
      <PhaserGame />
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
        <div className="pointer-events-auto self-start bg-black/60 text-white text-sm px-3 py-1 rounded">
          Zone: {currentZone}
        </div>
      </div>
      <HUD />
      <TouchControls />
      <PauseMenu />
    </div>
  )
}
