import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'

const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: 1280,
  height: 720,
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene],
}

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    gameRef.current = new Phaser.Game({
      ...GAME_CONFIG,
      parent: containerRef.current,
    })

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div ref={containerRef} />
}
