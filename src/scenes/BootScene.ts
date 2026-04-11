import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // 16×16 white square for player
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xffffff)
    g.fillRect(0, 0, 16, 16)
    g.generateTexture('player', 16, 16)
    g.destroy()
  }

  create() {
    // Wait for JetBrains Mono before rendering the main menu title.
    // Falls back immediately if the font can't be loaded.
    let started = false
    const go = () => {
      if (started) return
      started = true
      this.scene.start('MainMenuScene')
    }

    const fallback = setTimeout(go, 2000)
    document.fonts.load('bold 92px "JetBrains Mono"').finally(() => {
      clearTimeout(fallback)
      go()
    })
  }
}
