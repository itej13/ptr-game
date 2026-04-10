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

  private rightKey!: Phaser.Input.Keyboard.Key
  private insertKey!: Phaser.Input.Keyboard.Key
  private deleteKey!: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: 'Zone3_LinkedList' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a10')
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
    this.dead = false
    this.busy = false
    this.traversals = 0
    this.nodeList = []
    this.vineMap.clear()
    this.nodeLabels.clear()

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

    for (let i = 0; i < this.nodeList.length - 1; i++) {
      this.drawVine(this.nodeList[i], this.nodeList[i + 1])
    }

    for (const n of this.nodeList) {
      this.addNodeLabel(n)
    }

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

    const onRestart = () => this.scene.restart()
    bus.on('dsa:restart', onRestart)
    this.events.on('shutdown', () => bus.off('dsa:restart', onRestart))

    bus.emit('dsa:operation', {
      op: `Zone 3 — linked list  ptr = head`,
      zone: 'list',
    })
  }

  update() {
    if (this.dead) return
    this.player.update()

    if (this.busy) return
    const JD = Phaser.Input.Keyboard.JustDown
    if (JD(this.rightKey)) this.traverse()
    if (JD(this.insertKey)) this.insertAfterCurrent()
    if (JD(this.deleteKey)) this.deleteNextNode()
  }

  /* ── linked list ────────────────────────── */

  private buildLinkedList() {
    const values = [17, 42, 8, 55, 31, 19, 64, 5]
    let head: LinkedListNode | null = null
    let tail: LinkedListNode | null = null

    for (const val of values) {
      const node: LinkedListNode = {
        value: val,
        next: null,
        platform: undefined as any,
        index: -1,
      }

      if (!head) {
        head = node
        tail = node
      } else if (tail) {
        tail.next = node
        tail = node
      }
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
    glowG.moveTo(x1, y1)
    glowG.lineTo(x2, y2)
    glowG.strokePath()

    const g = this.add.graphics().setDepth(3)
    g.lineStyle(3, 0x00ffaa, 0.9)
    g.moveTo(x1, y1)
    g.lineTo(x2, y2)
    g.strokePath()

    const dx = x2 - x1
    const dy = y2 - y1
    const angle = Math.atan2(dy, dx)
    const headLen = 16
    const headWidth = 12
    const tipX = x2
    const tipY = y2
    const base1X = tipX - headLen * Math.cos(angle) + headWidth * Math.sin(angle)
    const base1Y = tipY - headLen * Math.sin(angle) - headWidth * Math.cos(angle)
    const base2X = tipX - headLen * Math.cos(angle) - headWidth * Math.sin(angle)
    const base2Y = tipY - headLen * Math.sin(angle) + headWidth * Math.cos(angle)

    g.fillStyle(0x00ffaa, 1)
    g.beginPath()
    g.moveTo(tipX, tipY)
    g.lineTo(base1X, base1Y)
    g.lineTo(base2X, base2Y)
    g.closePath()
    g.fillPath()

    this.vineMap.set(fromNode, { main: g, glow: glowG })
  }

  private removeVine(fromNode: LinkedListNode) {
    const entry = this.vineMap.get(fromNode)
    if (!entry) return
    this.tweens.add({
      targets: [entry.main, entry.glow],
      alpha: 0,
      duration: 300,
      onComplete: () => {
        entry.main.destroy()
        entry.glow.destroy()
      },
    })
    this.vineMap.delete(fromNode)
  }

  /* ── node labels ────────────────────────── */

  private addNodeLabel(node: LinkedListNode) {
    const label = this.add.text(node.platform.x, node.platform.y, `${node.value}`, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(8)
    this.nodeLabels.set(node, label)
  }

  /* ── traversal ──────────────────────────── */

  private traverse() {
    if (!this.current.next) {
      bus.emit('dsa:operation', {
        op: `ptr = ptr->next // null (end of list)`,
        zone: 'list',
      })
      return
    }

    this.busy = true
    const next = this.current.next
    const endX = next.platform.x
    const endY = next.platform.y

    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setVelocity(0, 0)

    this.tweens.add({
      targets: this.player,
      x: endX,
      y: endY,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.current = next
        this.traversals++
        body.setAllowGravity(true)
        body.setVelocity(0, 0)
        this.busy = false

        bus.emit('dsa:operation', {
          op: `ptr = ptr->next // node[${next.index}].value=${next.value}`,
          zone: 'list',
        })
        bus.emit('dsa:step', undefined)

        if (!next.next) {
          this.onVictory()
        }
      },
    })
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
    const newNode: LinkedListNode = {
      value: newValue,
      next: oldNext,
      platform: sprite,
      index: this.current.index + 1,
    }

    const label = this.add.text(finalX, startY, `${newValue}`, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(8)
    this.nodeLabels.set(newNode, label)

    bus.emit('dsa:operation', { op: `new_node = Node(${newValue})`, zone: 'list' })

    // Phase 1: slide node down from above
    this.tweens.add({
      targets: [sprite, label],
      y: PLAYER_Y,
      duration: 400,
      ease: 'Bounce.Out',
      onComplete: () => {
        sprite.refreshBody()

        // new_node.next = current.next
        if (oldNext) {
          this.drawVine(newNode, oldNext)
          bus.emit('dsa:operation', { op: `new_node.next = current.next // → ${oldNext.value}`, zone: 'list' })
        }

        // Phase 2: after pause, redirect current.next = new_node
        this.time.delayedCall(600, () => {
          this.removeVine(this.current)
          this.current.next = newNode

          this.time.delayedCall(350, () => {
            this.drawVine(this.current, newNode)
            bus.emit('dsa:operation', { op: `current.next = new_node // inserted ${newValue}`, zone: 'list' })

            const insertIdx = this.current.index + 1
            this.nodeList.splice(insertIdx, 0, newNode)
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

    // Remove vines current→target and target→afterTarget
    this.removeVine(this.current)
    this.removeVine(target)
    this.current.next = afterTarget

    // Draw new bypass vine current → afterTarget
    if (afterTarget) {
      this.time.delayedCall(350, () => {
        this.drawVine(this.current, afterTarget)
        bus.emit('dsa:operation', { op: `current.next = target.next // → ${afterTarget.value}`, zone: 'list' })
      })
    }

    // Float target node upward and fade
    const targetLabel = this.nodeLabels.get(target)
    this.tweens.add({
      targets: targetLabel ? [target.platform, targetLabel] : [target.platform],
      y: PLAYER_Y - 220,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        target.platform.destroy()
        if (targetLabel) {
          targetLabel.destroy()
          this.nodeLabels.delete(target)
        }

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
    bus.emit('dsa:operation', {
      op: `REACHED END — ${this.traversals} traversals`,
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
