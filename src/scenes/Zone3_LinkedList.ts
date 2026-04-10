import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { bus } from '../OperationBus'
import { useGameStore } from '../store/gameStore'

const NODE_RADIUS = 48
const NODE_SPACING = 280
const WORLD_W = 300 + 8 * NODE_SPACING
const WORLD_H = 1800
const FIRST_X = 220
const PLAYER_Y = 400

interface LinkedListNode {
  value: number
  next: LinkedListNode | null
  platform: Phaser.Physics.Arcade.Sprite
  index: number
}

export class Zone3_LinkedList extends Phaser.Scene {
  private player!: Player
  private head!: LinkedListNode
  private current!: LinkedListNode
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private vineMap = new Map<LinkedListNode, { main: Phaser.GameObjects.Graphics; glow: Phaser.GameObjects.Graphics }>()
  private nodeLabels = new Map<LinkedListNode, Phaser.GameObjects.Text>()
  private nodeList: LinkedListNode[] = []
  private traversals = 0
  private busy = false
  private dead = false

  // ── cycle / Floyd's state ────────────────────────────
  private loopMode: 'none' | 'looping' | 'ghost' | 'caught' = 'none'
  private loopCount = 0
  private cycleEntryNode!: LinkedListNode   // node[4] value=31 — target of back-edge
  private cycleTailNode!: LinkedListNode    // node[7] value=5  — source of back-edge
  private cycleVineGfx: { main: Phaser.GameObjects.Graphics; glow: Phaser.GameObjects.Graphics } | null = null
  private slowNode: LinkedListNode | null = null
  private ghostNode: LinkedListNode | null = null
  private ghostSprite: Phaser.GameObjects.Image | null = null
  private ghostLabelGfx: Phaser.GameObjects.Text | null = null
  private caughtHint: Phaser.GameObjects.Text | null = null

  private rightKey!: Phaser.Input.Keyboard.Key
  private insertKey!: Phaser.Input.Keyboard.Key
  private deleteKey!: Phaser.Input.Keyboard.Key
  private cutKey!: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: 'Zone3_LinkedList' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a10')
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
    this.dead = false
    this.busy = false
    this.traversals = 0
    this.loopMode = 'none'
    this.loopCount = 0
    this.nodeList = []
    this.vineMap.clear()
    this.nodeLabels.clear()
    this.slowNode = null
    this.ghostNode = null
    this.ghostSprite = null
    this.ghostLabelGfx = null
    this.cycleVineGfx = null
    this.caughtHint = null

    const store = useGameStore.getState()
    store.resetSearch()
    store.setCurrentZone('list')

    this.generateTextures()
    this.drawStarfield()
    this.buildLinkedList()

    this.platforms = this.physics.add.staticGroup()

    let node: LinkedListNode | null = this.head
    let x = FIRST_X
    let index = 0
    while (node) {
      node.index = index
      const sprite = this.platforms.create(x, PLAYER_Y, 'node') as Phaser.Physics.Arcade.Sprite
      node.platform = sprite
      this.nodeList.push(node)
      x += NODE_SPACING
      index++
      node = node.next
    }

    // forward vines
    for (let i = 0; i < this.nodeList.length - 1; i++) {
      this.drawVine(this.nodeList[i], this.nodeList[i + 1])
    }

    // value labels
    for (const n of this.nodeList) {
      this.addNodeLabel(n)
    }

    // cycle: node[7](5) → node[4](31)
    this.cycleTailNode = this.nodeList[7]
    this.cycleEntryNode = this.nodeList[4]
    this.cycleTailNode.next = this.cycleEntryNode
    this.drawCycleVine(0x9900ff)

    this.current = this.head
    this.player = new Player(this, this.head.platform.x, PLAYER_Y)
    this.player.setDepth(10)
    this.player.canJump = false
    this.player.canMove = false

    this.physics.add.collider(this.player, this.platforms)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.startFollow(this.player, false, 0.08, 0)

    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    this.insertKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.INSERT)
    this.deleteKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE)
    this.cutKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    const onRestart = () => this.scene.restart()
    bus.on('dsa:restart', onRestart)
    this.events.on('shutdown', () => bus.off('dsa:restart', onRestart))

    bus.emit('dsa:operation', { op: `Zone 3 — linked list  ptr = head`, zone: 'list' })
  }

  update() {
    if (this.dead) return
    this.player.update()
    if (this.busy) return

    const JD = Phaser.Input.Keyboard.JustDown

    if (this.loopMode === 'caught') {
      if (JD(this.cutKey)) this.cutCycle()
      return
    }

    if (this.loopMode === 'ghost') {
      if (JD(this.rightKey)) this.ghostStep()
      return
    }

    if (JD(this.rightKey)) this.traverse()
    if (this.loopMode === 'none') {
      if (JD(this.insertKey)) this.insertAfterCurrent()
      if (JD(this.deleteKey)) this.deleteNextNode()
    }
  }

  /* ── linked list ────────────────────────── */

  private buildLinkedList() {
    const values = [17, 42, 8, 55, 31, 19, 64, 5]
    let head: LinkedListNode | null = null
    let tail: LinkedListNode | null = null

    for (const val of values) {
      const node: LinkedListNode = { value: val, next: null, platform: undefined as any, index: -1 }
      if (!head) { head = node; tail = node }
      else if (tail) { tail.next = node; tail = node }
    }

    this.head = head!
  }

  /* ── vine drawing ────────────────────────── */

  private drawVine(fromNode: LinkedListNode, toNode: LinkedListNode) {
    const x1 = fromNode.platform.x + NODE_RADIUS
    const y1 = fromNode.platform.y
    const x2 = toNode.platform.x - NODE_RADIUS
    const y2 = toNode.platform.y

    const glowG = this.add.graphics().setDepth(2)
    glowG.lineStyle(12, 0x00ffaa, 0.15)
    glowG.moveTo(x1, y1).lineTo(x2, y2).strokePath()

    const g = this.add.graphics().setDepth(3)
    g.lineStyle(3, 0x00ffaa, 0.9)
    g.moveTo(x1, y1).lineTo(x2, y2).strokePath()

    const angle = Math.atan2(y2 - y1, x2 - x1)
    const hl = 16, hw = 12
    g.fillStyle(0x00ffaa, 1)
    g.beginPath()
    g.moveTo(x2, y2)
    g.lineTo(x2 - hl * Math.cos(angle) + hw * Math.sin(angle), y2 - hl * Math.sin(angle) - hw * Math.cos(angle))
    g.lineTo(x2 - hl * Math.cos(angle) - hw * Math.sin(angle), y2 - hl * Math.sin(angle) + hw * Math.cos(angle))
    g.closePath().fillPath()

    this.vineMap.set(fromNode, { main: g, glow: glowG })
  }

  private removeVine(fromNode: LinkedListNode) {
    const entry = this.vineMap.get(fromNode)
    if (!entry) return
    this.tweens.add({
      targets: [entry.main, entry.glow],
      alpha: 0,
      duration: 300,
      onComplete: () => { entry.main.destroy(); entry.glow.destroy() },
    })
    this.vineMap.delete(fromNode)
  }

  // U-shaped vine drawn below the node row to show the back-edge cycle
  private drawCycleVine(color: number) {
    const fx = this.cycleTailNode.platform.x
    const fy = this.cycleTailNode.platform.y + NODE_RADIUS
    const tx = this.cycleEntryNode.platform.x
    const ty = this.cycleEntryNode.platform.y + NODE_RADIUS
    const ly = PLAYER_Y + 180

    const glowG = this.add.graphics().setDepth(1)
    glowG.lineStyle(14, color, 0.18)
    glowG.beginPath()
    glowG.moveTo(fx, fy).lineTo(fx, ly).lineTo(tx, ly).lineTo(tx, ty)
    glowG.strokePath()

    const g = this.add.graphics().setDepth(2)
    g.lineStyle(3, color, 0.85)
    g.beginPath()
    g.moveTo(fx, fy).lineTo(fx, ly).lineTo(tx, ly).lineTo(tx, ty)
    g.strokePath()

    // arrowhead pointing up into cycle entry
    g.fillStyle(color, 1)
    g.beginPath()
    g.moveTo(tx, ty)
    g.lineTo(tx - 10, ty + 20)
    g.lineTo(tx + 10, ty + 20)
    g.closePath().fillPath()

    this.cycleVineGfx = { main: g, glow: glowG }
  }

  /* ── node labels ────────────────────────── */

  private addNodeLabel(node: LinkedListNode) {
    const label = this.add.text(node.platform.x, node.platform.y, `${node.value}`, {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(8)
    this.nodeLabels.set(node, label)
  }

  /* ── traversal ──────────────────────────── */

  private traverse() {
    if (!this.current.next) {
      bus.emit('dsa:operation', { op: `ptr->next == null (end of list)`, zone: 'list' })
      return
    }

    this.busy = true
    const next = this.current.next
    const isBackEdge = this.current === this.cycleTailNode

    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setVelocity(0, 0)

    this.tweens.add({
      targets: this.player,
      x: next.platform.x,
      y: PLAYER_Y,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.current = next
        this.traversals++
        body.setAllowGravity(true)
        body.setVelocity(0, 0)
        this.busy = false

        if (isBackEdge) {
          if (this.loopMode === 'none') this.loopMode = 'looping'
          this.loopCount++
          bus.emit('dsa:operation', {
            op: `cycle: ${this.cycleTailNode.value}→${this.cycleEntryNode.value} (loop #${this.loopCount})`,
            zone: 'list',
          })
          if (this.loopCount >= 3) {
            this.time.delayedCall(300, () => this.activateGhostMode())
          }
        } else {
          bus.emit('dsa:operation', {
            op: `ptr = ptr->next // [${next.index}].value=${next.value}`,
            zone: 'list',
          })
          bus.emit('dsa:step', undefined)
        }
      },
    })
  }

  /* ── Floyd's cycle detection ────────────── */

  private activateGhostMode() {
    this.loopMode = 'ghost'
    this.slowNode = this.head
    this.ghostNode = this.head

    // Camera-fixed banner (scrollFactor=0 keeps it on screen)
    const cam = this.cameras.main
    const banner = this.add.text(cam.width / 2, 170,
      'Ghost Mode unlocked\nFloyd\'s Cycle Detection — press → to step',
      { fontSize: '24px', color: '#00ffff', align: 'center', stroke: '#000033', strokeThickness: 4 }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(20)
    this.time.delayedCall(2500, () => banner.destroy())

    // Teleport player (slow pointer) back to head
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setVelocity(0, 0)
    this.tweens.add({
      targets: this.player,
      x: this.head.platform.x,
      y: PLAYER_Y,
      duration: 350,
      ease: 'Power2',
      onComplete: () => {
        this.current = this.head
        body.setAllowGravity(true)
        body.setVelocity(0, 0)
      },
    })

    // Ghost sprite = fast pointer, floats above nodes
    this.ghostSprite = this.add.image(this.head.platform.x, PLAYER_Y - 72, 'ghost').setDepth(9)
    this.ghostLabelGfx = this.add.text(this.head.platform.x, PLAYER_Y - 112, 'fast', {
      fontSize: '14px', color: '#ffff00', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9)

    bus.emit('dsa:operation', { op: `Floyd's: slow=head, fast=head`, zone: 'list' })
    bus.emit('dsa:operation', { op: `→ to step: slow+1, fast+2`, zone: 'list' })
  }

  private ghostStep() {
    if (!this.slowNode || !this.ghostNode || !this.ghostSprite || !this.ghostLabelGfx) return
    if (this.busy) return

    const newSlow = this.slowNode.next
    const nf1 = this.ghostNode.next
    const newFast = nf1 ? nf1.next : null
    if (!newSlow || !newFast) return

    this.busy = true

    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setVelocity(0, 0)

    // slow pointer: player moves 1 step
    this.tweens.add({
      targets: this.player,
      x: newSlow.platform.x,
      y: PLAYER_Y,
      duration: 400,
      ease: 'Power2',
    })

    // fast pointer: ghost moves 2 steps
    this.tweens.add({
      targets: this.ghostSprite,
      x: newFast.platform.x,
      y: PLAYER_Y - 72,
      duration: 400,
      ease: 'Power2',
    })

    this.tweens.add({
      targets: this.ghostLabelGfx,
      x: newFast.platform.x,
      y: PLAYER_Y - 112,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.slowNode = newSlow
        this.ghostNode = newFast
        this.current = newSlow
        body.setAllowGravity(true)
        body.setVelocity(0, 0)
        this.busy = false

        bus.emit('dsa:operation', {
          op: `slow→[${newSlow.index}](${newSlow.value}), fast→[${newFast.index}](${newFast.value})`,
          zone: 'list',
        })

        if (newSlow === newFast) this.onCycleDetected()
      },
    })
  }

  private onCycleDetected() {
    this.loopMode = 'caught'

    bus.emit('dsa:operation', {
      op: `CYCLE DETECTED: slow==fast at [${this.slowNode!.index}](${this.slowNode!.value})`,
      zone: 'list',
    })

    // Flash ghost to celebrate detection
    this.tweens.add({ targets: this.ghostSprite, alpha: 0, duration: 140, yoyo: true, repeat: 5 })

    // Replace purple cycle vine with red
    if (this.cycleVineGfx) {
      this.cycleVineGfx.main.destroy()
      this.cycleVineGfx.glow.destroy()
      this.cycleVineGfx = null
    }
    this.drawCycleVine(0xff2200)

    // Camera-fixed cut instruction
    const cam = this.cameras.main
    this.caughtHint = this.add.text(cam.width / 2, cam.height - 52,
      'SPACE — cut the offending vine',
      { fontSize: '20px', color: '#ff6600', stroke: '#000000', strokeThickness: 3 }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(20)
  }

  private cutCycle() {
    if (this.loopMode !== 'caught') return

    this.caughtHint?.destroy()
    this.caughtHint = null

    // Fade and destroy red cycle vine
    if (this.cycleVineGfx) {
      const { main, glow } = this.cycleVineGfx
      this.tweens.add({
        targets: [main, glow],
        alpha: 0,
        duration: 400,
        onComplete: () => { main.destroy(); glow.destroy() },
      })
      this.cycleVineGfx = null
    }

    // Break the linked list cycle
    this.cycleTailNode.next = null

    // Remove ghost
    this.ghostSprite?.destroy()
    this.ghostSprite = null
    this.ghostLabelGfx?.destroy()
    this.ghostLabelGfx = null

    bus.emit('dsa:operation', {
      op: `cycle cut — node[${this.cycleTailNode.index}](${this.cycleTailNode.value}).next = null`,
      zone: 'list',
    })

    this.time.delayedCall(500, () => this.onVictory())
  }

  /* ── insertion ──────────────────────────── */

  private insertAfterCurrent() {
    if (this.busy) return
    this.busy = true

    const oldNext = this.current.next
    const newValue = Phaser.Math.Between(1, 99)
    const fromX = this.current.platform.x
    const toX = oldNext ? oldNext.platform.x : fromX + NODE_SPACING
    const finalX = (fromX + toX) / 2
    const startY = PLAYER_Y - 220

    const sprite = this.platforms.create(finalX, startY, 'node') as Phaser.Physics.Arcade.Sprite
    const newNode: LinkedListNode = { value: newValue, next: oldNext, platform: sprite, index: this.current.index + 1 }

    const label = this.add.text(finalX, startY, `${newValue}`, {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(8)
    this.nodeLabels.set(newNode, label)

    bus.emit('dsa:operation', { op: `new_node = Node(${newValue})`, zone: 'list' })

    this.tweens.add({
      targets: [sprite, label],
      y: PLAYER_Y,
      duration: 400,
      ease: 'Bounce.Out',
      onComplete: () => {
        sprite.refreshBody()
        if (oldNext) {
          this.drawVine(newNode, oldNext)
          bus.emit('dsa:operation', { op: `new_node.next = current.next // → ${oldNext.value}`, zone: 'list' })
        }
        this.time.delayedCall(600, () => {
          this.removeVine(this.current)
          this.current.next = newNode
          this.time.delayedCall(350, () => {
            this.drawVine(this.current, newNode)
            bus.emit('dsa:operation', { op: `current.next = new_node // inserted ${newValue}`, zone: 'list' })
            this.nodeList.splice(this.current.index + 1, 0, newNode)
            this.nodeList.forEach((n, i) => (n.index = i))
            this.busy = false
          })
        })
      },
    })
  }

  /* ── deletion ──────────────────────────── */

  private deleteNextNode() {
    if (this.busy) return
    if (!this.current.next) {
      bus.emit('dsa:operation', { op: `delete: current.next is null`, zone: 'list' })
      return
    }

    this.busy = true
    const target = this.current.next
    const afterTarget = target.next

    bus.emit('dsa:operation', { op: `delete current.next // removing ${target.value}`, zone: 'list' })

    this.removeVine(this.current)
    this.removeVine(target)
    this.current.next = afterTarget

    if (afterTarget) {
      this.time.delayedCall(350, () => {
        this.drawVine(this.current, afterTarget)
        bus.emit('dsa:operation', { op: `current.next = target.next // → ${afterTarget.value}`, zone: 'list' })
      })
    }

    const targetLabel = this.nodeLabels.get(target)
    this.tweens.add({
      targets: targetLabel ? [target.platform, targetLabel] : [target.platform],
      y: PLAYER_Y - 220,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        target.platform.destroy()
        if (targetLabel) { targetLabel.destroy(); this.nodeLabels.delete(target) }
        const idx = this.nodeList.indexOf(target)
        if (idx !== -1) this.nodeList.splice(idx, 1)
        this.nodeList.forEach((n, i) => (n.index = i))
        this.busy = false
      },
    })
  }

  /* ── victory ────────────────────────────── */

  private onVictory() {
    this.dead = true
    const s = useGameStore.getState()
    s.setMode('done')
    s.setOutcome('victory')
    this.cameras.main.flash(500, 100, 200, 255)
    bus.emit('dsa:operation', { op: `CYCLE RESOLVED — Floyd's algorithm complete`, zone: 'list' })
  }

  /* ── textures ──────────────────────────── */

  private generateTextures() {
    // node: cyan glowing orb
    const ng = this.make.graphics({ x: 0, y: 0 })
    const size = NODE_RADIUS * 2
    ng.fillStyle(0x0088ff, 0.2)
    ng.fillCircle(NODE_RADIUS, NODE_RADIUS, NODE_RADIUS + 8)
    ng.fillStyle(0x0088ff, 0.5)
    ng.fillCircle(NODE_RADIUS, NODE_RADIUS, NODE_RADIUS + 2)
    ng.fillStyle(0x00ddff)
    ng.fillCircle(NODE_RADIUS, NODE_RADIUS, NODE_RADIUS - 4)
    ng.fillStyle(0xffffff, 0.3)
    ng.fillCircle(NODE_RADIUS - 8, NODE_RADIUS - 8, 6)
    ng.generateTexture('node', size, size)
    ng.destroy()

    // ghost: yellow fast-pointer orb
    const gg = this.make.graphics({ x: 0, y: 0 })
    const gr = 24
    gg.fillStyle(0xffff00, 0.25)
    gg.fillCircle(gr, gr, gr + 6)
    gg.fillStyle(0xffdd00, 0.7)
    gg.fillCircle(gr, gr, gr)
    gg.fillStyle(0xffffff, 0.4)
    gg.fillCircle(gr - 5, gr - 5, 5)
    gg.generateTexture('ghost', gr * 2, gr * 2)
    gg.destroy()
  }

  /* ── starfield ──────────────────────────── */

  private drawStarfield() {
    const bg = this.add.graphics().setDepth(0)
    for (let i = 0; i < 150; i++) {
      const x = Phaser.Math.Between(0, WORLD_W)
      const y = Phaser.Math.Between(0, WORLD_H)
      const brightness = Phaser.Math.FloatBetween(0.3, 1)
      const size = Phaser.Math.Between(1, 3)
      bg.fillStyle(0xffffff, brightness * 0.8)
      bg.fillCircle(x, y, size)
    }
  }
}
