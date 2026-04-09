import { PhaserGame } from './components/PhaserGame'
import { HUD } from './components/HUD'
import { useGameStore } from './store/gameStore'
import type { GameState } from './store/gameStore'

export default function App() {
  const currentZone = useGameStore((s: GameState) => s.currentZone)

  return (
    <div className="relative w-[1280px] h-[720px]">
      <PhaserGame />
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
        <div className="pointer-events-auto self-start bg-black/60 text-white text-sm px-3 py-1 rounded">
          Zone: {currentZone}
        </div>
      </div>
      <HUD />
    </div>
  )
}
