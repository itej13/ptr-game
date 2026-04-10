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
    console.log('Phaser booted')
    this.scene.start('Zone1_Array')
  }
}
