import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BootScene } from '../scenes/BootScene'
import { MainMenuScene } from '../scenes/MainMenuScene'
import { Zone1_Array } from '../scenes/Zone1_Array'
import { Zone2_Stack } from '../scenes/Zone2_Stack'
import { Zone3_LinkedList } from '../scenes/Zone3_LinkedList'
import { ConceptPauseManager } from '../systems/ConceptPauseManager'
import '../systems/ConceptPauseResumeHandler'

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    gameRef.current = new Phaser.Game({
      type: Phaser.CANVAS,
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      input: {
        activePointers: 3,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
        parent: containerRef.current,
      },
      scene: [BootScene, MainMenuScene, Zone1_Array, Zone2_Stack, Zone3_LinkedList],
    })

    ConceptPauseManager.init(gameRef.current)

    const onResize = () => {
      gameRef.current?.scale.resize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
