import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { bus } from '../OperationBus'
import type { MapNode, MapEdge } from '../OperationBus'
import { useGameStore } from '../store/gameStore'
import { CODEX_ZONE3 } from '../store/codexEntries'
import { soundManager } from '../audio/soundManager'
import { virtualInput } from '../input/virtualInput'
import { ConceptPauseManager } from '../systems/ConceptPauseManager'

const NODE_RADIUS = 48
const NODE_SPACING = 280
const WORLD_W = 300 + 8 * NODE_SPACING
const WORLD_H = 1800
const FIRST_X = 220
const NODE_BASE_Y = 340
const PLAYER_NODE_OFFSET = 45
const GHOST_NODE_OFFSET = 72
const GHOST_LABEL_OFFSET = 112
const CORRUPTOR_OFFSET = 90
const WORLD_PADDING_RIGHT = 360

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
  private cycleEntryNode!: LinkedListNode
  private cycleTailNode!: LinkedListNode
  private cycleVineGfx: { main: Phaser.GameObjects.Graphics; glow: Phaser.GameObjects.Graphics } | null = null
  private slowNode: LinkedListNode | null = null
  private ghostNode: LinkedListNode | null = null
  private ghostSprite: Phaser.GameObjects.Image | null = null
  private ghostLabelGfx: Phaser.GameObjects.Text | null = null
  private caughtHint: Phaser.GameObjects.Text | null = null
  private cycleVineColor = 0x9900ff
  private nullText: Phaser.GameObjects.Text | null = null

  // ── corruption enemy state ───────────────────────────
  private corruptionActive = false
  private severedOriginals = new Map<LinkedListNode, LinkedListNode>()
  private brokenVineMap = new Map<LinkedListNode, { main: Phaser.GameObjects.Graphics; glow: Phaser.GameObjects.Graphics }>()
  private corruptionTimer: Phaser.Time.TimerEvent | null = null
  private corruptionWavesTotal = 0
  private corruptionWavesRepaired = 0
  private corruptionFinished = false
  private readonly MAX_CORRUPTION_WAVES = 5
  private corruptorGfx: Phaser.GameObjects.Graphics | null = null
  private droneHandle?: { stop: () => void }
  private corruptionCounterText: Phaser.GameObjects.Text | null = null
  private corruptionHintText: Phaser.GameObjects.Text | null = null

  private rightKey!: Phaser.Input.Keyboard.Key
  private leftKey!: Phaser.Input.Keyboard.Key
  private insertKey!: Phaser.Input.Keyboard.Key
  private deleteKey!: Phaser.Input.Keyboard.Key
  private cutKey!: Phaser.Input.Keyboard.Key
  private repairKey!: Phaser.Input.Keyboard.Key
  private insertLessonShown = false
  private deleteLessonShown = false

  constructor() {
    super({ key: 'Zone3_LinkedList' })
  }

  create() {
    ConceptPauseManager.resetForZone()
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
    this.cycleVineColor = 0x9900ff
    this.nullText = null
    this.corruptionActive = false
    this.corruptionFinished = false
    this.severedOriginals.clear()
    this.brokenVineMap.clear()
    this.corruptionTimer = null
    this.corruptionWavesTotal = 0
    this.corruptionWavesRepaired = 0
    this.corruptorGfx = null
    this.corruptionCounterText = null
    this.corruptionHintText = null
    this.insertLessonShown = false
    this.deleteLessonShown = false

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
      const sprite = this.platforms.create(x, NODE_BASE_Y, 'node') as Phaser.Physics.Arcade.Sprite
      node.platform = sprite
      this.nodeList.push(node)
      x += NODE_SPACING
      index++
      node = node.next
    }

    for (let i = 0; i < this.nodeList.length - 1; i++) {
      this.drawVine(this.nodeList[i], this.nodeList[i + 1])
    }

    for (const n of this.nodeList) {
      this.addNodeLabel(n)
    }

    this.cycleTailNode = this.nodeList[7]
    this.cycleEntryNode = this.nodeList[4]
    this.cycleTailNode.next = this.cycleEntryNode

    this.current = this.head
    this.player = new Player(this, this.head.platform.x, this.playerYFor(this.head))
    this.player.setDepth(10)
    this.player.canJump = false
    this.player.canMove = false

    this.physics.add.collider(this.player, this.platforms)
    // Zone 3 has no jumping — permanently kill gravity so the player
    // never drifts off nodes between traversal tweens.
    ;(this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.refreshListLayout({ syncPlayer: true })
    this.cameras.main.startFollow(this.player, false, 0.08, 0)

    this.rightKey  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    this.leftKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
    this.insertKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.INSERT)
    this.deleteKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE)
    this.cutKey    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.repairKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R)

    const onRestart = () => this.scene.restart()
    bus.on('dsa:restart', onRestart)

    // ambient drone
    this.droneHandle = soundManager.droneStart()

    this.events.on('shutdown', () => {
      this.droneHandle?.stop()
      bus.off('dsa:restart', onRestart)
    })

    bus.emit('dsa:operation', {
      op: 'Zone 3 — linked list  ptr = head. You are standing on the HEAD: the one entry point into the whole chain. Unlike the Array Plains, there is no index table and no teleport target list here. Every other node lives somewhere else in memory, so the only way forward is to follow pointers through the jungle.',
      zone: 'list',
    })
    this.time.delayedCall(200, () => this.emitMapState())
  }

  update() {
    if (useGameStore.getState().paused) return
    if (this.dead) return
    this.player.update()
    if (this.busy) return

    const JD = Phaser.Input.Keyboard.JustDown
    const vR = virtualInput.consumeRight()
    const vL = virtualInput.consumeLeft()

    if (this.corruptionActive) {
      if (JD(this.repairKey) || virtualInput.consumeR()) this.tryRepair()
      if (JD(this.rightKey)  || vR) this.corruptionTraverse(1)
      if (JD(this.leftKey)   || vL) this.corruptionTraverse(-1)
      return
    }

    if (this.loopMode === 'caught') {
      if (JD(this.cutKey) || virtualInput.consumeSpace()) this.cutCycle()
      return
    }

    if (this.loopMode === 'ghost') {
      if (JD(this.rightKey) || vR) this.ghostStep()
      return
    }

    if (JD(this.rightKey) || vR) this.traverse()
    if (this.loopMode === 'none') {
      if (JD(this.insertKey)) this.insertAfterCurrent()
      if (JD(this.deleteKey)) this.deleteNextNode()
    }
  }

  /* ── map state emission ─────────────────── */

  private playerYFor(node: LinkedListNode) {
    return node.platform.y - PLAYER_NODE_OFFSET
  }

  private ghostYFor(node: LinkedListNode) {
    return node.platform.y - GHOST_NODE_OFFSET
  }

  private ghostLabelYFor(node: LinkedListNode) {
    return node.platform.y - GHOST_LABEL_OFFSET
  }

  private layoutNodes() {
    this.nodeList.forEach((node, index) => {
      node.index = index
      const x = FIRST_X + index * NODE_SPACING
      node.platform.setPosition(x, NODE_BASE_Y)
      node.platform.refreshBody()

      const label = this.nodeLabels.get(node)
      label?.setPosition(x, NODE_BASE_Y)
    })
  }

  private syncPlayerToCurrent() {
    if (!this.player || !this.current) return
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.reset(this.current.platform.x, this.playerYFor(this.current))
    body.setVelocity(0, 0)
  }

  private updateWorldBounds() {
    const rightmostX = this.nodeList.length
      ? Math.max(...this.nodeList.map((node) => node.platform.x))
      : FIRST_X
    const width = Math.max(WORLD_W, rightmostX + WORLD_PADDING_RIGHT)
    this.physics.world.setBounds(0, 0, width, WORLD_H)
    this.cameras.main.setBounds(0, 0, width, WORLD_H)
  }

  private clearLinkVisuals() {
    this.vineMap.forEach(({ main, glow }) => {
      this.tweens.killTweensOf([main, glow])
      main.destroy()
      glow.destroy()
    })
    this.vineMap.clear()

    this.brokenVineMap.forEach(({ main, glow }) => {
      this.tweens.killTweensOf([main, glow])
      main.destroy()
      glow.destroy()
    })
    this.brokenVineMap.clear()

    if (this.cycleVineGfx) {
      this.cycleVineGfx.main.destroy()
      this.cycleVineGfx.glow.destroy()
      this.cycleVineGfx = null
    }

    this.nullText?.destroy()
    this.nullText = null
  }

  private drawNullMarker() {
    const tail = this.nodeList[this.nodeList.length - 1]
    if (!tail) return
    if (this.severedOriginals.has(tail) || tail.next !== null) return

    this.nullText = this.add.text(
      tail.platform.x + 120,
      tail.platform.y - 8,
      'NULL',
      {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ff7799',
        stroke: '#220011',
        strokeThickness: 3,
      },
    ).setOrigin(0.5).setDepth(8)
  }

  private redrawConnections() {
    this.clearLinkVisuals()

    for (const node of this.nodeList) {
      if (this.severedOriginals.has(node)) {
        this.drawBrokenVine(node)
        continue
      }

      if (node.next === null) continue

      const isCycle = node === this.cycleTailNode && node.next === this.cycleEntryNode
      if (!isCycle) this.drawVine(node, node.next)
    }

    const cycleIsActive =
      this.nodeList.includes(this.cycleTailNode) &&
      this.nodeList.includes(this.cycleEntryNode) &&
      this.cycleTailNode.next === this.cycleEntryNode

    if (cycleIsActive) this.drawCycleVine(this.cycleVineColor)
    this.drawNullMarker()
  }

  private refreshListLayout({ syncPlayer = false, refreshCorruptor = false }: {
    syncPlayer?: boolean
    refreshCorruptor?: boolean
  } = {}) {
    this.layoutNodes()
    this.redrawConnections()
    this.updateWorldBounds()

    if (syncPlayer) this.syncPlayerToCurrent()

    if (refreshCorruptor && this.corruptorGfx && this.nodeList.length > 0) {
      const tail = this.nodeList[this.nodeList.length - 1]
      this.redrawCorruptor(tail.platform.x, tail.platform.y - CORRUPTOR_OFFSET)
    }

    this.emitMapState()
  }

  private emitMapState() {
    const nodes: MapNode[] = this.nodeList.map(n => ({
      id: n.index,
      label: String(n.value),
      player: n === this.current,
      severed: this.severedOriginals.has(n),
    }))

    const edges: MapEdge[] = []
    for (const n of this.nodeList) {
      if (this.severedOriginals.has(n)) {
        const orig = this.severedOriginals.get(n)!
        edges.push({ from: n.index, to: orig.index, kind: 'broken' })
      } else if (n.next !== null) {
        const isCycle = n === this.cycleTailNode && n.next === this.cycleEntryNode
        edges.push({ from: n.index, to: n.next.index, kind: isCycle ? 'cycle' : 'fwd' })
      }
    }

    bus.emit('dsa:mapstate', { zone: 'list', nodes, edges })
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

  private drawCycleVine(color: number) {
    const fx = this.cycleTailNode.platform.x
    const fy = this.cycleTailNode.platform.y + NODE_RADIUS
    const tx = this.cycleEntryNode.platform.x
    const ty = this.cycleEntryNode.platform.y + NODE_RADIUS
    const ly = NODE_BASE_Y + 180

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

    g.fillStyle(color, 1)
    g.beginPath()
    g.moveTo(tx, ty)
    g.lineTo(tx - 10, ty + 20)
    g.lineTo(tx + 10, ty + 20)
    g.closePath().fillPath()

    this.cycleVineGfx = { main: g, glow: glowG }
  }

  /* ── broken vine ────────────────────────── */

  private drawBrokenVine(fromNode: LinkedListNode) {
    const originalNext = this.severedOriginals.get(fromNode)
    if (!originalNext) return

    const x1 = fromNode.platform.x + NODE_RADIUS
    const y1 = fromNode.platform.y
    const x2 = originalNext.platform.x - NODE_RADIUS
    const midX = (x1 + x2) / 2

    const glowG = this.add.graphics().setDepth(2)
    glowG.lineStyle(12, 0xff2200, 0.18)
    glowG.beginPath().moveTo(x1, y1).lineTo(midX - 18, y1).strokePath()
    glowG.beginPath().moveTo(midX + 18, y1).lineTo(x2, y1).strokePath()

    const g = this.add.graphics().setDepth(3)
    g.lineStyle(3, 0xff2200, 0.85)
    g.beginPath().moveTo(x1, y1).lineTo(midX - 18, y1).strokePath()
    g.beginPath().moveTo(midX + 18, y1).lineTo(x2, y1).strokePath()
    g.lineStyle(2, 0xff8800, 1)
    g.beginPath()
    g.moveTo(midX - 18, y1)
    g.lineTo(midX - 6, y1 - 10)
    g.lineTo(midX + 4, y1 + 10)
    g.lineTo(midX + 18, y1)
    g.strokePath()
    g.fillStyle(0xff6600, 1)
    for (let i = 0; i < 5; i++) {
      g.fillCircle(midX + Phaser.Math.Between(-22, 22), y1 + Phaser.Math.Between(-14, 14), 2)
    }

    this.brokenVineMap.set(fromNode, { main: g, glow: glowG })
    this.tweens.add({ targets: [g, glowG], alpha: { from: 1, to: 0.25 }, duration: 500, yoyo: true, repeat: -1 })
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
      bus.emit('dsa:operation', {
        op: "ptr->next == null — NULL means the chain ends here. Following NULL is like trying to open a door that doesn't exist. In C this would crash your program, and in Java you'd meet a NullPointerException. Arrays give you index numbers; linked lists give you one pointer at a time, so NULL is the hard stop.",
        zone: 'list',
      })
      return
    }

    soundManager.click()
    this.busy = true
    const next = this.current.next
    const isBackEdge = this.current === this.cycleTailNode

    this.tweens.add({
      targets: this.player,
      x: next.platform.x,
      y: this.playerYFor(next),
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.current = next
        this.traversals++
        this.syncPlayerToCurrent()
        this.busy = false
        this.emitMapState()

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
            op: `ptr = ptr->next — You're following the chain: each node only knows where the NEXT one is. Unlike the Array Plains where you teleported with arr[index], every node here lives at its own memory address, like a treasure hunt where each clue only reveals the next clue. Step count: ${this.traversals}. It took ${this.traversals} hop${this.traversals === 1 ? '' : 's'} to reach value ${next.value}. Linked lists give up random access so insertion and deletion can be almost effortless.`,
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

    const cam = this.cameras.main
    const banner = this.add.text(cam.width / 2, 170,
      "Ghost Mode unlocked\nFloyd's Cycle Detection: one pointer walks, one pointer sprints.\nIf they ever collide, the list contains a loop. Press → to step.",
      { fontSize: '24px', color: '#00ffff', align: 'center', stroke: '#000033', strokeThickness: 4 }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(20)
    this.time.delayedCall(2500, () => banner.destroy())

    this.tweens.add({
      targets: this.player,
      x: this.head.platform.x,
      y: this.playerYFor(this.head),
      duration: 350,
      ease: 'Power2',
      onComplete: () => {
        this.current = this.head
        this.syncPlayerToCurrent()
        this.emitMapState()
      },
    })

    this.ghostSprite = this.add.image(this.head.platform.x, this.ghostYFor(this.head), 'ghost').setDepth(9)
    this.ghostLabelGfx = this.add.text(this.head.platform.x, this.ghostLabelYFor(this.head), 'fast', {
      fontSize: '14px', color: '#ffff00', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9)

    bus.emit('dsa:operation', {
      op: "Floyd's: slow=head, fast=head — arrays would let you jump by index, but in pointer-land both runners must follow the couplers. One pointer moves 1 step, the other 2.",
      zone: 'list',
    })
    bus.emit('dsa:operation', {
      op: '→ to step: slow+1, fast+2. If the fast runner ever catches the slow runner, you are trapped in a cycle.',
      zone: 'list',
    })
  }

  private ghostStep() {
    if (!this.slowNode || !this.ghostNode || !this.ghostSprite || !this.ghostLabelGfx) return
    if (this.busy) return

    const newSlow = this.slowNode.next
    const nf1 = this.ghostNode.next
    const newFast = nf1 ? nf1.next : null
    if (!newSlow || !newFast) return

    this.busy = true

    this.tweens.add({
      targets: this.player,
      x: newSlow.platform.x,
      y: this.playerYFor(newSlow),
      duration: 400,
      ease: 'Power2',
    })

    this.tweens.add({
      targets: this.ghostSprite,
      x: newFast.platform.x,
      y: this.ghostYFor(newFast),
      duration: 400,
      ease: 'Power2',
    })

    this.tweens.add({
      targets: this.ghostLabelGfx,
      x: newFast.platform.x,
      y: this.ghostLabelYFor(newFast),
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.slowNode = newSlow
        this.ghostNode = newFast
        this.current = newSlow
        this.syncPlayerToCurrent()
        this.busy = false
        this.emitMapState()

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
    this.cycleVineColor = 0xff2200

    bus.emit('dsa:operation', {
      op: `CYCLE DETECTED: slow==fast at [${this.slowNode!.index}](${this.slowNode!.value}). Two runners meeting means the chain loops back on itself instead of ending in NULL.`,
      zone: 'list',
    })

    this.tweens.add({ targets: this.ghostSprite, alpha: 0, duration: 140, yoyo: true, repeat: 5 })
    this.redrawConnections()

    const cam = this.cameras.main
    this.caughtHint = this.add.text(cam.width / 2, cam.height - 52,
      'SPACE — cut the offending vine and turn the loop back into a proper list',
      { fontSize: '20px', color: '#ff6600', stroke: '#000000', strokeThickness: 3 }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(20)

    this.emitMapState()
  }

  private cutCycle() {
    if (this.loopMode !== 'caught') return

    soundManager.click()
    this.caughtHint?.destroy()
    this.caughtHint = null

    this.cycleTailNode.next = null
    this.redrawConnections()
    this.emitMapState()

    this.ghostSprite?.destroy()
    this.ghostSprite = null
    this.ghostLabelGfx?.destroy()
    this.ghostLabelGfx = null

    bus.emit('dsa:operation', {
      op: `cycle cut — node[${this.cycleTailNode.index}](${this.cycleTailNode.value}).next = null. The tail no longer points backward, so traversal can finally terminate at NULL instead of looping forever.`,
      zone: 'list',
    })

    this.time.delayedCall(600, () => this.startCorruptionPhase())
  }

  /* ── corruption enemy ───────────────────────────────── */

  private startCorruptionPhase() {
    this.corruptionActive = true
    this.loopMode = 'none'

    this.tweens.add({
      targets: this.player,
      x: this.head.platform.x,
      y: this.playerYFor(this.head),
      duration: 450,
      ease: 'Power2',
      onComplete: () => {
        this.current = this.head
        this.syncPlayerToCurrent()
        this.emitMapState()
      },
    })

    this.corruptorGfx = this.add.graphics().setDepth(15)
    this.redrawCorruptor(this.nodeList[this.nodeList.length - 1].platform.x, this.nodeList[this.nodeList.length - 1].platform.y - CORRUPTOR_OFFSET)
    this.tweens.add({
      targets: this.corruptorGfx,
      alpha: { from: 1, to: 0.35 },
      duration: 450,
      yoyo: true,
      repeat: -1,
    })

    const cam = this.cameras.main
    const banner = this.add.text(cam.width / 2, 170,
      "CORRUPTION ENTITY DETECTED\nIt's severing next pointers — the couplers between train cars.\nNavigate (← →) and press R to repair the chain before the list becomes unreachable.",
      { fontSize: '20px', color: '#ff4400', align: 'center', stroke: '#000000', strokeThickness: 4 }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(20)
    this.time.delayedCall(3500, () => banner.destroy())

    this.corruptionCounterText = this.add.text(cam.width / 2, 38,
      `Severed: 0  |  Repaired: 0 / ${this.MAX_CORRUPTION_WAVES}`,
      { fontSize: '16px', color: '#ff8800', stroke: '#000000', strokeThickness: 2 }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(20)

    this.corruptionHintText = this.add.text(cam.width / 2, cam.height - 50,
      '← → navigate  |  R repair a broken pointer  |  if HEAD.next = null the whole list becomes unreachable',
      { fontSize: '15px', color: '#ff6600', stroke: '#000000', strokeThickness: 3 }
    ).setScrollFactor(0).setOrigin(0.5).setDepth(20)

    bus.emit('dsa:operation', {
      op: 'CORRUPTION — it is severing node.next at random. In a linked list, breaking one pointer is enough to lose everything beyond it.',
      zone: 'list',
    })
    bus.emit('dsa:operation', {
      op: 'Navigate ← → then R to repair. You are reconnecting memory addresses, not moving elements like an array.',
      zone: 'list',
    })

    this.corruptionTimer = this.time.addEvent({
      delay: 2800,
      callback: this.corruptRandomVine,
      callbackScope: this,
      repeat: this.MAX_CORRUPTION_WAVES - 1,
    })

    this.emitMapState()
  }

  private redrawCorruptor(x: number, y: number) {
    if (!this.corruptorGfx) return
    this.corruptorGfx.clear()
    this.corruptorGfx.fillStyle(0xff0000, 0.2)
    this.corruptorGfx.fillCircle(x, y, 34)
    this.corruptorGfx.fillStyle(0xff1100, 0.92)
    this.corruptorGfx.fillCircle(x, y, 22)
    this.corruptorGfx.fillStyle(0x000000, 1)
    this.corruptorGfx.fillCircle(x - 7, y - 3, 5)
    this.corruptorGfx.fillCircle(x + 7, y - 3, 5)
    this.corruptorGfx.fillStyle(0xff6600, 1)
    this.corruptorGfx.fillCircle(x - 7, y - 3, 2)
    this.corruptorGfx.fillCircle(x + 7, y - 3, 2)
    this.corruptorGfx.fillStyle(0xffffff, 0.3)
    this.corruptorGfx.fillCircle(x - 7, y - 9, 5)
  }

  private corruptRandomVine() {
    if (this.dead || !this.corruptionActive) return

    const candidates = this.nodeList.filter(n =>
      n.next !== null &&
      !this.severedOriginals.has(n) &&
      n !== this.cycleTailNode
    )

    this.corruptionWavesTotal++
    if (this.corruptionWavesTotal >= this.MAX_CORRUPTION_WAVES) {
      this.corruptionFinished = true
    }

    if (candidates.length === 0) {
      this.updateCorruptionCounter()
      this.checkCorruptionVictory()
      return
    }

    const target = Phaser.Math.RND.pick(candidates)

    this.severedOriginals.set(target, target.next!)
    target.next = null
    this.redrawConnections()

    this.redrawCorruptor(target.platform.x, target.platform.y - CORRUPTOR_OFFSET)

    this.cameras.main.flash(180, 255, 0, 0, false)
    this.cameras.main.shake(150, 0.008)

    bus.emit('dsa:operation', {
      op: `CORRUPTION severs [${target.index}](${target.value}).next = null. The chain now breaks here, like a treasure map whose next clue was torn off.`,
      zone: 'list',
    })

    this.updateCorruptionCounter()
    this.emitMapState()

    if (target === this.head && this.nodeList.length > 1) {
      this.time.delayedCall(300, () => this.onCorruptionDeath())
    }
  }

  private tryRepair() {
    if (!this.corruptionActive || this.busy) return

    if (!this.severedOriginals.has(this.current)) {
      bus.emit('dsa:operation', {
        op: `no severed vine at [${this.current.index}](${this.current.value}). This node still knows its next address, so there is nothing to rewire here.`,
        zone: 'list',
      })
      return
    }

    soundManager.click()
    this.busy = true
    const originalNext = this.severedOriginals.get(this.current)!

    this.current.next = originalNext
    this.severedOriginals.delete(this.current)
    this.corruptionWavesRepaired++

    this.time.delayedCall(300, () => {
      this.refreshListLayout({ syncPlayer: true, refreshCorruptor: true })
      bus.emit('dsa:operation', {
        op: `REPAIRED: [${this.current.index}](${this.current.value}).next → [${originalNext.index}](${originalNext.value}). The coupler is back in place, so the rest of the list is reachable again.`,
        zone: 'list',
      })
      this.cameras.main.flash(200, 0, 255, 100, false)
      this.updateCorruptionCounter()
      this.busy = false
      this.emitMapState()
      this.checkCorruptionVictory()
    })
  }

  private corruptionTraverse(direction: number) {
    if (this.busy) return

    const targetIdx = this.current.index + direction
    if (targetIdx < 0 || targetIdx >= this.nodeList.length) return

    const targetNode = this.nodeList[targetIdx]
    this.busy = true

    this.tweens.add({
      targets: this.player,
      x: targetNode.platform.x,
      y: this.playerYFor(targetNode),
      duration: 380,
      ease: 'Power2',
      onComplete: () => {
        this.current = targetNode
        this.syncPlayerToCurrent()
        this.busy = false
        this.emitMapState()

        const severed = this.severedOriginals.has(this.current)
        bus.emit('dsa:operation', {
          op: `at [${this.current.index}](${this.current.value})${severed ? ' ⚡ SEVERED — press R to reconnect the broken pointer' : ' — pointer intact'}`,
          zone: 'list',
        })
      },
    })
  }

  private updateCorruptionCounter() {
    if (!this.corruptionCounterText) return
    this.corruptionCounterText.setText(
      `Severed: ${this.severedOriginals.size}  |  Repaired: ${this.corruptionWavesRepaired} / ${this.MAX_CORRUPTION_WAVES}`
    )
  }

  private checkCorruptionVictory() {
    if (this.corruptionFinished && this.severedOriginals.size === 0) {
      this.corruptionTimer?.remove()
      this.corruptionActive = false
      this.corruptionHintText?.destroy()
      this.corruptionCounterText?.destroy()
      this.corruptorGfx?.destroy()
      this.time.delayedCall(500, () => this.onVictory())
    }
  }

  /* ── corruption death ───────────────────── */

  private onCorruptionDeath() {
    if (this.dead) return
    soundManager.buzz()
    this.dead = true
    this.corruptionTimer?.remove()

    this.cameras.main.flash(500, 255, 0, 0)
    this.cameras.main.shake(600, 0.025)

    bus.emit('dsa:operation', {
      op: 'HEAD.next = null — LIST DISSOLVES. If the head loses its next pointer, the rest of the chain becomes unreachable. Arrays still have indexes; linked lists only have links, so a broken head means the jungle past it effectively disappears.',
      zone: 'list',
    })

    for (const n of this.nodeList) {
      const label = this.nodeLabels.get(n)
      const targets: Phaser.GameObjects.GameObject[] = [n.platform]
      if (label) targets.push(label)
      this.tweens.add({
        targets,
        alpha: 0,
        scaleX: 2.5,
        scaleY: 2.5,
        duration: 900,
        ease: 'Power2',
        delay: n.index * 70,
        onComplete: () => { n.platform.destroy(); label?.destroy() },
      })
    }

    this.vineMap.forEach(({ main, glow }) => {
      this.tweens.add({ targets: [main, glow], alpha: 0, duration: 600 })
    })
    this.brokenVineMap.forEach(({ main, glow }) => {
      this.tweens.killTweensOf([main, glow])
      this.tweens.add({ targets: [main, glow], alpha: 0, duration: 600 })
    })
    this.corruptorGfx?.destroy()

    const s = useGameStore.getState()
    s.setMode('done')
    s.setOutcome('defeat')

    this.time.delayedCall(1400, () => {
      bus.emit('dsa:operation', {
        op: 'linked list destroyed — restart to try again. Pointer structures are powerful, but one bad link can orphan an entire region of memory.',
        zone: 'list',
      })
    })
  }

  /* ── insertion ──────────────────────────── */

  private insertAfterCurrent() {
    if (this.busy) return

    if (!this.insertLessonShown) {
      this.insertLessonShown = true
      bus.emit('dsa:operation', {
        op: "Insertion lesson — Now you'll see the linked list's superpower. In an array, inserting in the middle means shifting every element after it, like squeezing a new person into a packed line. Here you only rewire two pointers. Watch.",
        zone: 'list',
      })
    }

    this.busy = true

    const oldNext = this.current.next
    const newValue = Phaser.Math.Between(1, 99)
    const fromX = this.current.platform.x
    const toX = oldNext ? oldNext.platform.x : fromX + NODE_SPACING
    const finalX = (fromX + toX) / 2
    const startY = NODE_BASE_Y - 220

    const sprite = this.platforms.create(finalX, startY, 'node') as Phaser.Physics.Arcade.Sprite
    const newNode: LinkedListNode = { value: newValue, next: oldNext, platform: sprite, index: this.current.index + 1 }

    const label = this.add.text(finalX, startY, `${newValue}`, {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(8)
    this.nodeLabels.set(newNode, label)

    bus.emit('dsa:operation', {
      op: `new_node = Node(${newValue}) — A fresh node appears in memory. Arrays need a contiguous block; linked lists can allocate the newcomer anywhere and stitch it in later.`,
      zone: 'list',
    })

    this.tweens.add({
      targets: [sprite, label],
      y: NODE_BASE_Y,
      duration: 400,
      ease: 'Bounce.Out',
      onComplete: () => {
        sprite.refreshBody()
        this.nodeList.splice(this.current.index + 1, 0, newNode)
        this.refreshListLayout({ syncPlayer: true })

        if (oldNext) {
          bus.emit('dsa:operation', {
            op: `new_node.next = current.next — The new node now points to what USED to come after you. Think of it like a train car grabbing the next coupler before the old car lets go.`,
            zone: 'list',
          })
        }

        this.time.delayedCall(600, () => {
          this.current.next = newNode
          this.time.delayedCall(350, () => {
            const remaining = Math.max(0, this.nodeList.length - (newNode.index + 1))
            this.refreshListLayout({ syncPlayer: true })
            bus.emit('dsa:operation', {
              op: `current.next = new_node — Done. The current node now points to the new node, and the new node points to the rest of the chain. Two pointer changes: O(1). In an array, inserting here would have shifted ${remaining} element${remaining === 1 ? '' : 's'}.`,
              zone: 'list',
            })
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
      bus.emit('dsa:operation', {
        op: 'delete: current.next is null. There is no next node to skip, because the chain already ends here at NULL.',
        zone: 'list',
      })
      return
    }

    const target = this.current.next
    if (target === this.cycleEntryNode || target === this.cycleTailNode) {
      bus.emit('dsa:operation', {
        op: `delete current.next blocked at ${target.value}. This node anchors the scripted cycle puzzle, so the jungle refuses to remove it yet.`,
        zone: 'list',
      })
      return
    }

    if (!this.deleteLessonShown) {
      this.deleteLessonShown = true
      bus.emit('dsa:operation', {
        op: "Deletion lesson — Deletion in a linked list is surgical. You don't shift anything; you make the previous node skip over the deleted one. The removed node becomes unreachable, floating in freed memory.",
        zone: 'list',
      })
    }

    this.busy = true
    const afterTarget = target.next

    bus.emit('dsa:operation', {
      op: `delete current.next // removing ${target.value}. Arrays would slide every later element left; linked lists only need one pointer change.`,
      zone: 'list',
    })

    this.current.next = afterTarget
    const shifted = Math.max(0, this.nodeList.length - (this.current.index + 2))
    const idx = this.nodeList.indexOf(target)
    if (idx !== -1) this.nodeList.splice(idx, 1)
    this.refreshListLayout({ syncPlayer: true })
    bus.emit('dsa:operation', {
      op: `current.next = target.next — Node ${target.value} is gone. Its predecessor now points past it. In an array, deleting from the middle would have shifted ${shifted} element${shifted === 1 ? '' : 's'}. Here it is O(1). The removed node may still exist in memory briefly; that is what garbage collection cleans up.`,
      zone: 'list',
    })

    const targetLabel = this.nodeLabels.get(target)
    this.tweens.add({
      targets: targetLabel ? [target.platform, targetLabel] : [target.platform],
      y: NODE_BASE_Y - 220,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        target.platform.destroy()
        if (targetLabel) { targetLabel.destroy(); this.nodeLabels.delete(target) }
        this.syncPlayerToCurrent()
        this.emitMapState()
        this.busy = false
      },
    })
  }

  /* ── victory ────────────────────────────── */

  private onVictory() {
    soundManager.victory()
    this.dead = true
    const s = useGameStore.getState()
    s.setMode('done')
    s.setOutcome('victory')
    s.unlockCodex(CODEX_ZONE3)
    this.cameras.main.flash(500, 100, 200, 255)
    bus.emit('dsa:operation', {
      op: 'ALL VINES RESTORED — corruption defeated. Arrays still win when you need instant indexing, but linked lists shine when the structure keeps changing and pointer rewiring beats shifting a whole block of memory.',
      zone: 'list',
    })
  }

  /* ── textures ──────────────────────────── */

  private generateTextures() {
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
