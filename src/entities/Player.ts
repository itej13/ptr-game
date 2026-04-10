import Phaser from 'phaser'
import { bus } from '../OperationBus'

const SPEED = 200
const JUMP_VELOCITY = -420

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: {
    up: Phaser.Input.Keyboard.Key
    left: Phaser.Input.Keyboard.Key
    right: Phaser.Input.Keyboard.Key
  }
  private lastVx = 0
  public canJump = true

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player')
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const kb = scene.input.keyboard!
    this.cursors = kb.createCursorKeys()
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setGravityY(600)
    body.setCollideWorldBounds(true)
  }

  update() {
    const body = this.body as Phaser.Physics.Arcade.Body
    const { left, right, up } = this.cursors
    const onGround = body.blocked.down

    const goLeft = left.isDown || this.wasd.left.isDown
    const goRight = right.isDown || this.wasd.right.isDown
    const jump = Phaser.Input.Keyboard.JustDown(up) ||
                 Phaser.Input.Keyboard.JustDown(this.wasd.up)

    let vx = 0
    if (goLeft) vx = -SPEED
    else if (goRight) vx = SPEED
    body.setVelocityX(vx)

    if (this.canJump && jump && onGround) {
      body.setVelocityY(JUMP_VELOCITY)
      bus.emit('dsa:operation', { op: 'ptr moved', zone: 'test' })
    }

    if (vx !== this.lastVx) {
      if (vx !== 0) bus.emit('dsa:operation', { op: 'ptr moved', zone: 'test' })
      this.lastVx = vx
    }
  }
}
