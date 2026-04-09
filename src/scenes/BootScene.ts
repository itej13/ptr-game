import Phaser from 'phaser'
import { Player } from '../entities/Player'

export class BootScene extends Phaser.Scene {
  private player!: Player
  private platforms!: Phaser.Physics.Arcade.StaticGroup

  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // 16×16 white square — no asset file needed
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(0xffffff)
    g.fillRect(0, 0, 16, 16)
    g.generateTexture('player', 16, 16)
    g.destroy()

    // Platform texture: 400×16 grey bar
    const pg = this.make.graphics({ x: 0, y: 0 })
    pg.fillStyle(0x888888)
    pg.fillRect(0, 0, 400, 16)
    pg.generateTexture('platform', 400, 16)
    pg.destroy()
  }

  create() {
    console.log('Phaser booted')

    this.platforms = this.physics.add.staticGroup()
    const platform = this.platforms.create(640, 600, 'platform') as Phaser.Physics.Arcade.Sprite
    platform.refreshBody()

    this.player = new Player(this, 640, 500)

    this.physics.add.collider(this.player, this.platforms)

    this.cameras.main.setBackgroundColor('#1a1a2e')
  }

  update() {
    this.player.update()
  }
}
