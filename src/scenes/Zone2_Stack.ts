import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { bus } from '../OperationBus'
import { useGameStore } from '../store/gameStore'

const BLOCK = 64
const INIT_COUNT = 10
const STACK_CX = 640
const FLOOR_Y = 1500
const CEILING_Y = 200
const CEIL_H = 32
const WORLD_W = 1280
const WORLD_H = 1800
const CORR_HALF = 120
const WALL_L = STACK_CX - CORR_HALF
const WALL_R = STACK_CX + CORR_HALF

interface StackBlock {
  sprite: Phaser.GameObjects.Sprite
  valText: Phaser.GameObjects.Text
  label: Phaser.GameObjects.Text
  value: number
}

export class Zone2_Stack extends Phaser.Scene {
  private player!: Player
  private topPlatform!: Phaser.Physics.Arcade.StaticGroup
  private blocks: StackBlock[] = []
  private topIndex = -1
  private topHighlight!: Phaser.GameObjects.Graphics
  private busy = false
  private dead = false

  // keys
  private upKey!: Phaser.Input.Keyboard.Key
  private wKey!: Phaser.Input.Keyboard.Key
  private spaceKey!: Phaser.Input.Keyboard.Key
  private downKey!: Phaser.Input.Keyboard.Key
  private sKey!: Phaser.Input.Keyboard.Key
  private xKey!: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: 'Zone2_Stack' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#08080e')
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
    this.dead = false
    this.busy = false

    useGameStore.getState().resetSearch()

    this.generateTextures()
    this.drawWalls()
    this.drawTorches()

    // ── ceiling ───────────────────────────────
    const ceilZone = this.add.zone(STACK_CX, CEILING_Y - CEIL_H / 2, WORLD_W, CEIL_H)
    this.physics.add.existing(ceilZone, true)

    const cg = this.add.graphics().setDepth(1)
    cg.fillStyle(0x252020)
    cg.fillRect(0, CEILING_Y - CEIL_H, WORLD_W, CEIL_H)
    cg.lineStyle(2, 0x1a1515)
    cg.strokeRect(0, CEILING_Y - CEIL_H, WORLD_W, CEIL_H)
    for (let x = WALL_L; x <= WALL_R; x += 20) {
      cg.fillStyle(0x352525)
      cg.fillTriangle(x - 8, CEILING_Y, x + 8, CEILING_Y, x, CEILING_Y + 14)
    }
    const glowG = this.add.graphics().setDepth(0)
    glowG.fillStyle(0xff2200, 0.06)
    glowG.fillRect(WALL_L, CEILING_Y, CORR_HALF * 2, 60)
    glowG.fillStyle(0xff2200, 0.03)
    glowG.fillRect(WALL_L, CEILING_Y + 60, CORR_HALF * 2, 60)

    // ── wall collision ────────────────────────
    const wallL = this.add.zone(WALL_L - 100, WORLD_H / 2, 200, WORLD_H)
    this.physics.add.existing(wallL, true)
    const wallR = this.add.zone(WALL_R + 100, WORLD_H / 2, 200, WORLD_H)
    this.physics.add.existing(wallR, true)

    // ── stack ─────────────────────────────────
    this.blocks = []
    this.topIndex = -1
    this.topPlatform = this.physics.add.staticGroup()
    this.topHighlight = this.add.graphics().setDepth(5)

    for (let i = 0; i < INIT_COUNT; i++) {
      this.createBlock(i, Phaser.Math.Between(1, 99))
    }
    this.topIndex = INIT_COUNT - 1
    this.refreshTopPlatform()

    // ── player ────────────────────────────────
    const spawnY = this.blockY(this.topIndex) - BLOCK / 2 - 9
    this.player = new Player(this, STACK_CX, spawnY)
    this.player.setDepth(10)
    this.player.canJump = false

    this.physics.add.collider(this.player, this.topPlatform)
    this.physics.add.collider(this.player, ceilZone)
    this.physics.add.collider(this.player, wallL)
    this.physics.add.collider(this.player, wallR)

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.startFollow(this.player, false, 0, 0.08)

    // ── keys ──────────────────────────────────
    const kb = this.input.keyboard!
    this.upKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
    this.wKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.downKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
    this.sKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    this.xKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X)

    // ── restart wiring ────────────────────────
    const onRestart = () => this.scene.restart()
    bus.on('dsa:restart', onRestart)
    this.events.on('shutdown', () => bus.off('dsa:restart', onRestart))

    bus.emit('dsa:operation', { op: 'entered Zone 2 — Stack', zone: 'stack' })
  }

  update() {
    if (this.dead) return
    this.player.update()

    if (this.busy) return
    const JD = Phaser.Input.Keyboard.JustDown
    if (JD(this.upKey) || JD(this.wKey) || JD(this.spaceKey)) this.doPush()
    else if (JD(this.downKey) || JD(this.sKey) || JD(this.xKey)) this.doPop()
  }

  /* ── block helpers ──────────────────────── */

  private blockY(index: number) {
    return FLOOR_Y - index * BLOCK - BLOCK / 2
  }

  private createBlock(index: number, val: number): StackBlock {
    const by = this.blockY(index)
    const sprite = this.add.sprite(STACK_CX, by, 'stone').setDepth(2)
    const valText = this.add.text(STACK_CX, by, String(val), {
      fontFamily: 'monospace', fontSize: '16px', color: '#c8c0a8', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3)
    const label = this.add.text(STACK_CX - BLOCK / 2 - 24, by, `${index}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#444430',
    }).setOrigin(0.5).setDepth(3)
    const block: StackBlock = { sprite, valText, label, value: val }
    this.blocks[index] = block
    return block
  }

  private refreshTopPlatform() {
    this.topPlatform.clear(true, true)
    this.topHighlight.clear()

    if (this.topIndex < 0) return

    const by = this.blockY(this.topIndex)
    const p = this.topPlatform.create(STACK_CX, by, 'stone') as Phaser.Physics.Arcade.Sprite
    p.setAlpha(0).setDepth(1)
    p.refreshBody()

    // highlight
    this.topHighlight.lineStyle(2, 0x00ffcc, 0.6)
    this.topHighlight.strokeRect(
      STACK_CX - BLOCK / 2 - 2, by - BLOCK / 2 - 2,
      BLOCK + 4, BLOCK + 4,
    )
    const ax = STACK_CX + BLOCK / 2 + 12
    this.topHighlight.fillStyle(0x00ffcc, 1)
    this.topHighlight.fillTriangle(ax, by - 6, ax, by + 6, ax + 8, by)
  }

  /* ── PUSH ───────────────────────────────── */

  private doPush() {
    this.busy = true
    const newIdx = this.topIndex + 1
    const newY = this.blockY(newIdx)
    const val = Phaser.Math.Between(1, 99)

    // create block above camera view
    const block = this.createBlock(newIdx, val)
    const startY = newY - 400
    block.sprite.setY(startY)
    block.valText.setY(startY)
    block.label.setY(startY)

    // disable gravity while riding
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setVelocity(0, 0)

    const playerTargetY = newY - BLOCK / 2 - 9

    // tween block down
    this.tweens.add({
      targets: [block.sprite, block.valText],
      y: newY,
      duration: 450,
      ease: 'Bounce.easeOut',
    })
    this.tweens.add({
      targets: block.label,
      y: newY,
      duration: 450,
      ease: 'Bounce.easeOut',
    })

    // tween player up
    this.tweens.add({
      targets: this.player,
      y: playerTargetY,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.topIndex = newIdx
        this.refreshTopPlatform()
        body.setAllowGravity(true)
        body.setVelocity(0, 0)
        this.busy = false
      },
    })

    bus.emit('dsa:operation', { op: `push(${val})`, zone: 'stack' })
    bus.emit('dsa:step', undefined)
  }

  /* ── POP ────────────────────────────────── */

  private doPop() {
    if (this.topIndex < 0) return

    this.busy = true
    const popIdx = this.topIndex
    const block = this.blocks[popIdx]
    const by = this.blockY(popIdx)

    bus.emit('dsa:operation', { op: `pop() → ${block.value}`, zone: 'stack' })
    bus.emit('dsa:step', undefined)

    // particles
    this.burstDebris(STACK_CX, by)

    // fade out block
    this.tweens.add({
      targets: [block.sprite, block.valText, block.label],
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => {
        block.sprite.destroy()
        block.valText.destroy()
        block.label.destroy()
        delete this.blocks[popIdx]

        this.topIndex = popIdx - 1

        if (this.topIndex < 0) {
          // StackUnderflow — no platform left
          this.refreshTopPlatform()
          this.onUnderflow()
          return
        }

        this.refreshTopPlatform()
        this.busy = false
        // player falls via gravity to new top
      },
    })
  }

  /* ── death ──────────────────────────────── */

  private onUnderflow() {
    this.dead = true

    this.time.delayedCall(800, () => {
      this.cameras.main.shake(600, 0.03)
      this.cameras.main.flash(600, 255, 0, 0)

      useGameStore.getState().setDeath(
        'STACK UNDERFLOW',
        'pop() called on empty stack — no platform remains',
      )
      bus.emit('dsa:operation', { op: 'FATAL: StackUnderflow', zone: 'stack' })
    })
  }

  /* ── particles ──────────────────────────── */

  private burstDebris(x: number, y: number) {
    this.add.particles(x, y, 'debris', {
      speed: { min: 40, max: 160 },
      angle: { min: 200, max: 340 },
      scale: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 18,
      gravityY: 200,
      emitting: false,
    }).explode()
  }

  /* ── textures ───────────────────────────── */

  private generateTextures() {
    // stone block
    const sg = this.make.graphics({ x: 0, y: 0 })
    sg.fillStyle(0x3a3530)
    sg.fillRect(0, 0, BLOCK, BLOCK)
    sg.lineStyle(2, 0x252018)
    sg.strokeRect(1, 1, BLOCK - 2, BLOCK - 2)
    sg.fillStyle(0x433d36, 0.5)
    sg.fillRect(3, 3, 28, 14)
    sg.fillRect(34, 3, 27, 14)
    sg.fillRect(3, 20, 20, 14)
    sg.fillRect(26, 20, 35, 14)
    sg.fillRect(3, 37, 32, 23)
    sg.fillRect(38, 37, 23, 23)
    sg.lineStyle(1, 0x4a4440, 0.3)
    sg.moveTo(31, 0); sg.lineTo(31, BLOCK)
    sg.moveTo(0, 17); sg.lineTo(BLOCK, 17)
    sg.moveTo(0, 36); sg.lineTo(BLOCK, 36)
    sg.strokePath()
    sg.generateTexture('stone', BLOCK, BLOCK)
    sg.destroy()

    // debris particle
    const dg = this.make.graphics({ x: 0, y: 0 })
    dg.fillStyle(0x8a7f70)
    dg.fillRect(0, 0, 4, 4)
    dg.generateTexture('debris', 4, 4)
    dg.destroy()
  }

  /* ── dungeon walls ──────────────────────── */

  private drawWalls() {
    const wg = this.add.graphics().setDepth(1)
    this.drawBrickColumn(wg, 0, WALL_L)
    this.drawBrickColumn(wg, WALL_R, WORLD_W)
    wg.fillStyle(0x1a1815)
    wg.fillRect(WALL_L - 6, 0, 6, WORLD_H)
    wg.fillRect(WALL_R, 0, 6, WORLD_H)
  }

  private drawBrickColumn(g: Phaser.GameObjects.Graphics, x0: number, x1: number) {
    const bw = 48, bh = 24
    const cols = Math.ceil((x1 - x0) / bw) + 1
    for (let row = 0; row * bh < WORLD_H; row++) {
      const off = (row % 2) * (bw / 2)
      for (let c = -1; c < cols; c++) {
        const shade = 0x1e1b18 + Phaser.Math.Between(0, 0x060606)
        g.fillStyle(shade)
        g.fillRect(x0 + c * bw + off + 1, row * bh + 1, bw - 2, bh - 2)
      }
    }
    g.lineStyle(1, 0x121010, 0.8)
    for (let row = 0; row * bh < WORLD_H; row++) {
      g.moveTo(x0, row * bh); g.lineTo(x1, row * bh)
    }
    g.strokePath()
  }

  /* ── torches ────────────────────────────── */

  private drawTorches() {
    const tg = this.add.graphics().setDepth(1)
    for (let y = CEILING_Y + 120; y < FLOOR_Y; y += 240) {
      this.drawTorch(tg, WALL_L - 16, y)
      this.drawTorch(tg, WALL_R + 16, y)
    }
  }

  private drawTorch(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0xff7700, 0.04); g.fillCircle(x, y, 60)
    g.fillStyle(0xff8800, 0.08); g.fillCircle(x, y, 36)
    g.fillStyle(0xff9900, 0.15); g.fillCircle(x, y, 18)
    g.fillStyle(0xffcc44, 0.7);  g.fillCircle(x, y, 6)
    g.fillStyle(0x3a3020);       g.fillRect(x - 2, y + 6, 4, 14)
  }
}
