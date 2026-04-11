import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { bus } from '../OperationBus'
import { useGameStore } from '../store/gameStore'
import { CODEX_ZONE1 } from '../store/codexEntries'
import { soundManager } from '../audio/soundManager'
import { virtualInput } from '../input/virtualInput'

const BOX_SIZE = 64
const BOX_GAP = 40
const BOX_STEP = BOX_SIZE + BOX_GAP
const BOX_COUNT = 50
const FIRST_X = 160
const BOX_TOP_Y = 500
const WORLD_W = FIRST_X * 2 + (BOX_COUNT - 1) * BOX_STEP + BOX_SIZE
const ENEMY_TICK_MS = 1500

export class Zone1_Array extends Phaser.Scene {
  private player!: Player
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private values: number[] = []
  private boxes: Phaser.Physics.Arcade.Sprite[] = []
  private target = 0
  private targetIndex = 0
  private mode: 'free' | 'binary' | 'done' = 'free'
  private outcome: 'playing' | 'victory' | 'death' = 'playing'
  private droneHandle?: { stop: () => void }

  // binary search
  private bsLeft = 0
  private bsRight = BOX_COUNT - 1
  private rangeBrackets!: Phaser.GameObjects.Graphics
  private midMarker!: Phaser.GameObjects.Graphics
  private spaceKey!: Phaser.Input.Keyboard.Key

  // enemy
  private enemy!: Phaser.GameObjects.Sprite
  private enemyIndex = 0
  private enemyCheckedUpTo = -1
  private enemyTimer?: Phaser.Time.TimerEvent
  private enemyTween?: Phaser.Tweens.Tween

  constructor() {
    super({ key: 'Zone1_Array' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d0d0d')
    this.physics.world.setBounds(0, 0, WORLD_W, 720)
    this.outcome = 'playing'

    this.drawGrid(WORLD_W, 720)
    this.generateTextures()

    // sorted values
    this.values = []
    let v = Phaser.Math.Between(1, 6)
    for (let i = 0; i < BOX_COUNT; i++) {
      this.values.push(v)
      v += Phaser.Math.Between(1, 7)
    }

    // target at index 15-45 so enemy has >=22s to reach it
    this.targetIndex = Phaser.Math.Between(15, BOX_COUNT - 5)
    this.target = this.values[this.targetIndex]
    const store = useGameStore.getState()
    store.resetSearch()
    store.setCurrentZone('array')
    store.setTarget(this.target)
    store.setMode('free')
    this.mode = 'free'

    this.platforms = this.physics.add.staticGroup()
    this.boxes = []

    for (let i = 0; i < BOX_COUNT; i++) {
      const cx = this.boxCx(i)
      const cy = BOX_TOP_Y + BOX_SIZE / 2

      const box = this.platforms.create(cx, cy, 'box64') as Phaser.Physics.Arcade.Sprite
      box.refreshBody()
      box.setInteractive({ useHandCursor: true })
      box.on('pointerdown', () => this.handleBoxClick(i))
      this.boxes.push(box)

      this.add.text(cx, BOX_TOP_Y - 14, `[${i}]`, {
        fontFamily: 'monospace', fontSize: '11px', color: '#555577',
      }).setOrigin(0.5, 1)

      this.drawOrb(cx, cy, this.values[i])
    }

    // player on box [0]
    this.player = new Player(this, this.boxCx(0), BOX_TOP_Y - 9)
    this.player.setDepth(10)
    this.physics.add.collider(this.player, this.platforms)

    this.cameras.main.setBounds(0, 0, WORLD_W, 720)
    this.cameras.main.startFollow(this.player, false, 0.08, 0)

    this.rangeBrackets = this.add.graphics().setDepth(5)
    this.midMarker = this.add.graphics().setDepth(5)

    // keys
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      const n = parseInt(e.key)
      if (!isNaN(n) && n >= 0 && n <= 9) this.handleBoxClick(n)
    })
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    bus.emit('dsa:operation', { op: `find ${this.target} — free mode`, zone: 'array' })

    // ambient drone
    this.droneHandle = soundManager.droneStart()

    // restart / next zone wiring
    const onRestart = () => this.scene.restart()
    const onNext = () => this.scene.start('Zone2_Stack')
    bus.on('dsa:restart', onRestart)
    bus.on('dsa:nextzone', onNext)
    this.events.on('shutdown', () => {
      this.droneHandle?.stop()
      bus.off('dsa:restart', onRestart)
      bus.off('dsa:nextzone', onNext)
    })
  }

  update() {
    if (useGameStore.getState().paused) return
    if (this.outcome !== 'playing') return
    this.player.update()

    if (this.mode === 'binary' && (Phaser.Input.Keyboard.JustDown(this.spaceKey) || virtualInput.consumeSpace())) {
      this.doBinaryStep()
    }
  }

  /* ── helpers ─────────────────────────────── */

  private boxCx(i: number) {
    return FIRST_X + i * BOX_STEP + BOX_SIZE / 2
  }

  /* ── click / teleport ────────────────────── */

  private handleBoxClick(index: number) {
    if (index < 0 || index >= BOX_COUNT) return
    if (this.outcome !== 'playing') return

    if (this.mode === 'binary') {
      const mid = Math.floor((this.bsLeft + this.bsRight) / 2)
      if (index !== mid) return
      this.doBinaryStep()
      return
    }

    // free mode
    this.teleportTo(index)
    soundManager.click()
    useGameStore.getState().incFreeSteps()
    bus.emit('dsa:operation', { op: `arr[${index}] = ${this.values[index]}`, zone: 'array' })
    bus.emit('dsa:step', undefined)

    if (this.values[index] === this.target) {
      this.onFreeFound()
    }
  }

  private teleportTo(index: number) {
    const cx = this.boxCx(index)
    const destY = BOX_TOP_Y - 9
    this.burstParticles(this.player.x, this.player.y)
    this.player.setPosition(cx, destY);
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0)
    this.burstParticles(cx, destY)
  }

  /* ── free → binary ──────────────────────── */

  private onFreeFound() {
    soundManager.ping()
    bus.emit('dsa:operation', {
      op: `found in ${useGameStore.getState().freeSteps} free steps`,
      zone: 'array',
    })

    this.time.delayedCall(1200, () => {
      this.mode = 'binary'
      useGameStore.getState().setMode('binary')
      this.bsLeft = 0
      this.bsRight = BOX_COUNT - 1
      bus.emit('dsa:operation', { op: `binary search — enemy incoming`, zone: 'array' })

      const mid = Math.floor((this.bsLeft + this.bsRight) / 2)
      this.teleportTo(mid)
      this.updateRangeVisuals()

      this.spawnEnemy()
    })
  }

  /* ── binary search ──────────────────────── */

  private doBinaryStep() {
    if (this.outcome !== 'playing') return
    const mid = Math.floor((this.bsLeft + this.bsRight) / 2)
    this.teleportTo(mid)
    useGameStore.getState().incBinarySteps()
    bus.emit('dsa:step', undefined)

    const midVal = this.values[mid]
    if (midVal === this.target) {
      bus.emit('dsa:operation', { op: `bs: arr[${mid}]=${midVal} == ${this.target}`, zone: 'array' })
      this.onVictory()
      return
    }
    let cmp: string
    if (midVal < this.target) {
      cmp = `arr[${mid}]=${midVal} < ${this.target} → right`
      this.bsLeft = mid + 1
    } else {
      cmp = `arr[${mid}]=${midVal} > ${this.target} → left`
      this.bsRight = mid - 1
    }
    bus.emit('dsa:operation', { op: `bs: ${cmp}`, zone: 'array' })
    this.updateRangeVisuals()
  }

  /* ── enemy ──────────────────────────────── */

  private spawnEnemy() {
    this.enemyIndex = 0
    this.enemyCheckedUpTo = -1
    this.enemy = this.add.sprite(this.boxCx(0), BOX_TOP_Y - 9, 'enemy').setDepth(8)

    // glitch shake
    this.time.addEvent({
      delay: 80, loop: true,
      callback: () => {
        if (!this.enemy?.active || this.outcome !== 'playing') return
        const base = this.boxCx(this.enemyIndex)
        this.enemy.setPosition(
          base + Phaser.Math.Between(-2, 2),
          BOX_TOP_Y - 9 + Phaser.Math.Between(-1, 1),
        )
        this.enemy.setAlpha(Phaser.Math.FloatBetween(0.7, 1))
      },
    })

    // advance timer — first tick after ENEMY_TICK_MS
    this.enemyTimer = this.time.addEvent({
      delay: ENEMY_TICK_MS, loop: true,
      callback: () => this.enemyTick(),
    })
  }

  private enemyTick() {
    if (this.outcome !== 'playing') return

    // check current box
    const idx = this.enemyIndex
    this.enemyCheckedUpTo = idx
    useGameStore.getState().setEnemyProgress(idx + 1)

    bus.emit('dsa:operation', {
      op: `lin: arr[${idx}]=${this.values[idx]}`,
      zone: 'array',
    })

    // flash red then leave dim-red trail
    this.boxes[idx].setTint(0xff2244)
    this.time.delayedCall(350, () => {
      if (this.boxes[idx]) this.boxes[idx].setTint(0x441111)
    })

    if (this.values[idx] === this.target) {
      this.onDeath()
      return
    }

    // advance
    this.enemyIndex++
    if (this.enemyIndex >= BOX_COUNT) return

    this.enemyTween = this.tweens.add({
      targets: this.enemy,
      x: this.boxCx(this.enemyIndex),
      duration: 350,
      ease: 'Power2',
    })
  }

  /* ── outcomes ───────────────────────────── */

  private onVictory() {
    soundManager.victory()
    this.outcome = 'victory'
    this.mode = 'done'
    this.stopEnemy()

    const s = useGameStore.getState()
    s.setMode('done')
    s.setOutcome('victory')
    s.unlockCodex(CODEX_ZONE1)

    this.cameras.main.flash(500, 0, 255, 100)
    bus.emit('dsa:operation', {
      op: `ZONE CLEAR — free:${s.freeSteps} bs:${s.binarySteps} enemy:${s.enemyProgress}`,
      zone: 'array',
    })
  }

  private onDeath() {
    soundManager.buzz()
    this.outcome = 'death'
    this.stopEnemy()

    const s = useGameStore.getState()
    s.setDeath(
      'CORRUPTED',
      `enemy.linearScan() reached target at arr[${s.enemyProgress - 1}]`,
    )

    this.cameras.main.shake(600, 0.025)
    this.cameras.main.flash(600, 255, 0, 0)
    bus.emit('dsa:operation', { op: 'CORRUPTED — enemy reached target', zone: 'array' })
  }

  private stopEnemy() {
    this.enemyTimer?.remove()
    this.enemyTween?.stop()
  }

  /* ── range visuals ──────────────────────── */

  private updateRangeVisuals() {
    for (let i = 0; i < BOX_COUNT; i++) {
      if (i <= this.enemyCheckedUpTo) {
        this.boxes[i].setTint(0x441111)
      } else if (this.mode === 'binary' && (i < this.bsLeft || i > this.bsRight)) {
        this.boxes[i].setTint(0x333333)
      } else {
        this.boxes[i].clearTint()
      }
    }

    this.rangeBrackets.clear()
    this.midMarker.clear()
    if (this.mode !== 'binary' || this.outcome !== 'playing') return

    const mid = Math.floor((this.bsLeft + this.bsRight) / 2)

    const lx = this.boxCx(this.bsLeft) - BOX_SIZE / 2 - 4
    const rx = this.boxCx(this.bsRight) + BOX_SIZE / 2 + 4
    const top = BOX_TOP_Y - 4
    const bot = BOX_TOP_Y + BOX_SIZE + 4
    this.rangeBrackets.lineStyle(2, 0x00ffcc, 0.6)
    this.rangeBrackets.moveTo(lx + 8, top); this.rangeBrackets.lineTo(lx, top)
    this.rangeBrackets.lineTo(lx, bot); this.rangeBrackets.lineTo(lx + 8, bot)
    this.rangeBrackets.moveTo(rx - 8, top); this.rangeBrackets.lineTo(rx, top)
    this.rangeBrackets.lineTo(rx, bot); this.rangeBrackets.lineTo(rx - 8, bot)
    this.rangeBrackets.strokePath()

    const mcx = this.boxCx(mid)
    this.midMarker.lineStyle(2, 0x00ffcc, 0.9)
    this.midMarker.strokeRect(mcx - BOX_SIZE / 2 - 2, BOX_TOP_Y - 2, BOX_SIZE + 4, BOX_SIZE + 4)
  }

  /* ── particles ──────────────────────────── */

  private burstParticles(x: number, y: number) {
    this.add.particles(x, y, 'spark', {
      speed: { min: 60, max: 180 },
      scale: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 14,
      emitting: false,
    }).explode()
  }

  /* ── textures ───────────────────────────── */

  private generateTextures() {
    // box
    const bg = this.make.graphics({ x: 0, y: 0 })
    bg.fillStyle(0x1a1a2e)
    bg.fillRect(0, 0, BOX_SIZE, BOX_SIZE)
    bg.lineStyle(1, 0x3a3a5e)
    bg.strokeRect(0, 0, BOX_SIZE, BOX_SIZE)
    bg.generateTexture('box64', BOX_SIZE, BOX_SIZE)
    bg.destroy()

    // spark
    const sg = this.make.graphics({ x: 0, y: 0 })
    sg.fillStyle(0x00ffcc)
    sg.fillCircle(3, 3, 3)
    sg.generateTexture('spark', 6, 6)
    sg.destroy()

    // enemy — red glitch square with scanlines
    const eg = this.make.graphics({ x: 0, y: 0 })
    eg.fillStyle(0xff2244)
    eg.fillRect(0, 0, 18, 18)
    eg.fillStyle(0xcc0022)
    eg.fillRect(0, 4, 18, 2)
    eg.fillRect(0, 10, 18, 2)
    eg.fillRect(0, 16, 18, 1)
    eg.generateTexture('enemy', 18, 18)
    eg.destroy()
  }

  private drawGrid(w: number, h: number) {
    const g = this.add.graphics()
    g.lineStyle(1, 0x1a1a1a, 0.6)
    const step = 32
    for (let x = 0; x <= w; x += step) { g.moveTo(x, 0); g.lineTo(x, h) }
    for (let y = 0; y <= h; y += step) { g.moveTo(0, y); g.lineTo(w, y) }
    g.strokePath()
  }

  private drawOrb(cx: number, cy: number, value: number) {
    const g = this.add.graphics()
    g.fillStyle(0x00ffaa, 0.08); g.fillCircle(cx, cy, 24)
    g.fillStyle(0x00ffaa, 0.15); g.fillCircle(cx, cy, 18)
    g.fillStyle(0x00ffaa, 0.9);  g.fillCircle(cx, cy, 12)
    this.add.text(cx, cy, String(value), {
      fontFamily: 'monospace', fontSize: '13px', color: '#0d0d0d', fontStyle: 'bold',
    }).setOrigin(0.5)
  }
}
