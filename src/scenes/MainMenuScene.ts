import Phaser from 'phaser'

const W = 1280
const H = 720
const FONT = '"JetBrains Mono", "Courier New", monospace'

interface BootLine {
  text: string
  color: string
  ms: number
}

const BOOT_LINES: BootLine[] = [
  { text: 'PTR DIAGNOSTICS — v0.3.0', color: '#009944', ms: 8 },
  { text: '─'.repeat(46), color: '#003322', ms: 3 },
  { text: 'SYSTEM INTEGRITY: 12%', color: '#00cc55', ms: 18 },
  { text: '[WARN]  heap corruption detected at 0x4F2A8C', color: '#ffaa00', ms: 15 },
  { text: '[ERR]   dangling pointer: ptr → NULL', color: '#ff4422', ms: 15 },
  { text: '[ERR]   cycle detected in heap segment', color: '#ff4422', ms: 15 },
  { text: '[WARN]  stack depth: 19 / 20  (CRITICAL)', color: '#ffaa00', ms: 15 },
  { text: '[ERR]   linked list corruption: ACTIVE', color: '#ff4422', ms: 15 },
  { text: '─'.repeat(46), color: '#003322', ms: 3 },
  { text: 'RECOVERY PROTOCOL: ACTIVE', color: '#009944', ms: 10 },
  { text: '> loading pointer_runner.exe...', color: '#00cc55', ms: 22 },
  { text: '> SYSTEM READY', color: '#00ffaa', ms: 38 },
]

export class MainMenuScene extends Phaser.Scene {
  // glitch fx
  private glitchGfx!: Phaser.GameObjects.Graphics
  private scanLine!: Phaser.GameObjects.Graphics

  // title
  private titleMain!: Phaser.GameObjects.Text
  private titleR!: Phaser.GameObjects.Text
  private titleB!: Phaser.GameObjects.Text

  // button
  private btnBg!: Phaser.GameObjects.Graphics
  private btnText!: Phaser.GameObjects.Text

  // state
  private booting = false
  private menuObjs: Phaser.GameObjects.GameObject[] = []
  private enterKey!: Phaser.Input.Keyboard.Key

  // boot typewriter
  private bootLineIdx = 0
  private bootCharIdx = 0
  private currentBootText: Phaser.GameObjects.Text | null = null
  private bootOriginX = 0
  private bootOriginY = 0

  constructor() { super({ key: 'MainMenuScene' }) }

  create() {
    this.cameras.main.setBackgroundColor('#020308')
    this.cameras.main.fadeIn(700, 0, 0, 0)
    this.booting = false
    this.menuObjs = []

    this.drawGrid()
    this.drawStaticScanlines()
    this.buildMenu()
    this.spawnGlitchTimer()
    this.spawnScrollScanline()
    this.scheduleTitleGlitch()

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  update() {
    if (this.booting) return
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) this.startBoot()
  }

  /* ── static background ───────────────────── */

  private drawGrid() {
    const g = this.add.graphics().setDepth(0)
    g.lineStyle(1, 0x0b1c10, 0.8)
    const S = 40
    for (let x = 0; x <= W; x += S) { g.moveTo(x, 0).lineTo(x, H) }
    for (let y = 0; y <= H; y += S) { g.moveTo(0, y).lineTo(W, y) }
    g.strokePath()
  }

  private drawStaticScanlines() {
    const g = this.add.graphics().setDepth(5)
    g.fillStyle(0x000000, 0.14)
    for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2)
  }

  /* ── menu UI ─────────────────────────────── */

  private buildMenu() {
    const cx = W / 2

    /* chromatic aberration ghost copies, normally invisible */
    this.titleR = this.add.text(cx - 4, 218, '★ PTR', {
      fontFamily: FONT, fontSize: '92px', fontStyle: 'bold', color: '#ff0033',
    }).setOrigin(0.5).setAlpha(0).setDepth(6)

    this.titleB = this.add.text(cx + 4, 218, '★ PTR', {
      fontFamily: FONT, fontSize: '92px', fontStyle: 'bold', color: '#0044ff',
    }).setOrigin(0.5).setAlpha(0).setDepth(6)

    /* main title */
    this.titleMain = this.add.text(cx, 218, '★ PTR', {
      fontFamily: FONT, fontSize: '92px', fontStyle: 'bold', color: '#eeffee',
    }).setOrigin(0.5).setDepth(7)

    this.tweens.add({
      targets: this.titleMain,
      alpha: { from: 0.88, to: 1 },
      duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    })

    /* tagline */
    const tagline = this.add.text(cx, 326, '// memory is not free. neither is time.', {
      fontFamily: FONT, fontSize: '16px', color: '#2b5040',
    }).setOrigin(0.5).setDepth(7)

    const version = this.add.text(cx, 350, 'v0.3.0 — alpha', {
      fontFamily: FONT, fontSize: '11px', color: '#1a3326',
    }).setOrigin(0.5).setDepth(7)

    /* button */
    this.btnBg = this.add.graphics().setDepth(7)
    this.paintBtn(false)

    this.btnText = this.add.text(cx, 432, '[ START ]', {
      fontFamily: FONT, fontSize: '24px', color: '#00bb77',
    }).setOrigin(0.5).setDepth(8)

    const hint = this.add.text(cx, 468, 'or press ENTER', {
      fontFamily: FONT, fontSize: '12px', color: '#1a3326',
    }).setOrigin(0.5).setDepth(7)

    const hit = this.add.zone(cx, 432, 220, 52).setInteractive().setDepth(9)
    hit.on('pointerover', () => {
      if (this.booting) return
      this.paintBtn(true); this.btnText.setColor('#00ffaa')
      this.input.setDefaultCursor('pointer')
    })
    hit.on('pointerout', () => {
      this.paintBtn(false); this.btnText.setColor('#00bb77')
      this.input.setDefaultCursor('default')
    })
    hit.on('pointerdown', () => { if (!this.booting) this.startBoot() })

    this.menuObjs.push(
      this.titleMain, this.titleR, this.titleB,
      tagline, version, this.btnBg, this.btnText, hint, hit,
    )
  }

  private paintBtn(hover: boolean) {
    const cx = W / 2, by = 432, bw = 200, bh = 44
    this.btnBg.clear()
    this.btnBg.fillStyle(0x020e07, 1)
    this.btnBg.fillRect(cx - bw / 2, by - bh / 2, bw, bh)
    this.btnBg.lineStyle(hover ? 2 : 1.5, hover ? 0x00ff88 : 0x006633, 1)
    this.btnBg.strokeRect(cx - bw / 2, by - bh / 2, bw, bh)
    if (hover) {
      this.btnBg.fillStyle(0x00ff88, 0.05)
      this.btnBg.fillRect(cx - bw / 2, by - bh / 2, bw, bh)
    }
  }

  /* ── glitch animations ───────────────────── */

  private spawnGlitchTimer() {
    this.glitchGfx = this.add.graphics().setDepth(4)
    this.time.addEvent({ delay: 85, loop: true, callback: this.tickGlitch, callbackScope: this })
  }

  private tickGlitch() {
    this.glitchGfx.clear()
    if (Math.random() > 0.44) return

    const palette = [0x00ffaa, 0xffffff, 0xff2200, 0x00aaff, 0x33ff44]
    const n = Phaser.Math.Between(1, 3)
    for (let i = 0; i < n; i++) {
      this.glitchGfx.fillStyle(Phaser.Math.RND.pick(palette), Phaser.Math.FloatBetween(0.03, 0.14))
      this.glitchGfx.fillRect(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.Between(20, 210), Phaser.Math.Between(2, 13),
      )
    }

    /* rare vertical glitch strip */
    if (Math.random() < 0.07) {
      this.glitchGfx.fillStyle(0x00ffaa, 0.05)
      this.glitchGfx.fillRect(Phaser.Math.Between(0, W - 5), 0, Phaser.Math.Between(2, 5), H)
    }
  }

  private spawnScrollScanline() {
    this.scanLine = this.add.graphics().setDepth(5)
    this.scanLine.fillStyle(0x44ff88, 0.06)
    this.scanLine.fillRect(0, 0, W, 4)

    const sweep = () => {
      this.scanLine.y = -4
      this.tweens.add({ targets: this.scanLine, y: H + 4, duration: 2700, ease: 'Linear' })
    }
    this.time.addEvent({ delay: 4000, loop: true, callback: sweep })
    sweep()
  }

  private scheduleTitleGlitch() {
    const fire = () => {
      if (this.booting) return
      /* brief chromatic split */
      this.titleR.setAlpha(0.42)
      this.titleB.setAlpha(0.42)
      const origX = W / 2
      this.titleMain.setX(origX + Phaser.Math.Between(-4, 4))

      this.time.delayedCall(65, () => {
        this.titleR.setAlpha(0)
        this.titleB.setAlpha(0)
        this.titleMain.setX(origX)
        /* also briefly flicker tagline opacity */
        this.time.delayedCall(Phaser.Math.Between(1500, 4000), fire)
      })
    }
    this.time.delayedCall(Phaser.Math.Between(1000, 2600), fire)
  }

  /* ── boot sequence ───────────────────────── */

  private startBoot() {
    if (this.booting) return
    this.booting = true
    this.input.setDefaultCursor('default')

    this.cameras.main.flash(100, 255, 255, 255)
    this.tweens.add({
      targets: this.menuObjs,
      alpha: 0,
      duration: 220,
      onComplete: () => this.showBootPanel(),
    })
  }

  private showBootPanel() {
    const PW = 920, PH = 370
    const px = (W - PW) / 2
    const py = (H - PH) / 2

    this.bootOriginX = px + 26
    this.bootOriginY = py + 24

    const g = this.add.graphics().setDepth(10)
    g.fillStyle(0x020b06, 0.97)
    g.fillRect(px, py, PW, PH)
    g.lineStyle(1, 0x005533, 1)
    g.strokeRect(px, py, PW, PH)
    g.lineStyle(1, 0x002a1a, 1)
    g.strokeRect(px + 4, py + 4, PW - 8, PH - 8)

    this.bootLineIdx = 0
    this.bootCharIdx = 0
    this.currentBootText = null

    this.time.delayedCall(180, () => this.typeNext())
  }

  private typeNext() {
    if (this.bootLineIdx >= BOOT_LINES.length) {
      this.time.delayedCall(500, () => this.launch())
      return
    }

    const line = BOOT_LINES[this.bootLineIdx]

    if (!this.currentBootText) {
      this.currentBootText = this.add.text(
        this.bootOriginX,
        this.bootOriginY + this.bootLineIdx * 28,
        '',
        { fontFamily: FONT, fontSize: '14px', color: line.color },
      ).setDepth(11)
    }

    if (this.bootCharIdx < line.text.length) {
      this.currentBootText.setText(line.text.slice(0, this.bootCharIdx + 1) + '_')
      this.bootCharIdx++
      this.time.delayedCall(line.ms, () => this.typeNext())
    } else {
      this.currentBootText.setText(line.text)
      this.bootLineIdx++
      this.bootCharIdx = 0
      this.currentBootText = null
      const pause = line.text.startsWith('─') ? 50
        : line.text.includes('READY') ? 900
        : 95
      this.time.delayedCall(pause, () => this.typeNext())
    }
  }

  private launch() {
    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Zone1_Array')
    })
  }
}
