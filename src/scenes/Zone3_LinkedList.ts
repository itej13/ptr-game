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
  private vines: Phaser.GameObjects.Graphics[] = []
  private vineGlows: Phaser.GameObjects.Graphics[] = []
  private traversals = 0
  private busy = false
  private dead = false

  private rightKey!: Phaser.Input.Keyboard.Key

  constructor() {
    super({ key: 'Zone3_LinkedList' })
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a10')
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
    this.dead = false
    this.busy = false
    this.traversals = 0

    const store = useGameStore.getState()
    store.resetSearch()
    store.setCurrentZone('list')

    this.generateTextures()
    this.drawStarfield()

    // build linked list
    this.buildLinkedList()

    // platform group
    this.platforms = this.physics.add.staticGroup()

    // position nodes and draw vines
    let node: LinkedListNode | null = this.head
    let x = FIRST_X
    let index = 0
    const nodeList: LinkedListNode[] = []

    while (node) {
      node.index = index
      const sprite = this.platforms.create(x, PLAYER_Y, 'node') as Phaser.Physics.Arcade.Sprite
      node.platform = sprite
      nodeList.push(node)
      x += NODE_SPACING
      index++
      node = node.next
    }

    // draw vines between nodes
    for (let i = 0; i < nodeList.length - 1; i++) {
      this.drawVine(nodeList[i], nodeList[i + 1])
    }

    // player on head
    this.current = this.head
    this.player = new Player(this, this.head.platform.x, PLAYER_Y)
    this.player.setDepth(10)
    this.player.canJump = false
    this.player.canMove = false

    this.physics.add.collider(this.player, this.platforms)

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.startFollow(this.player, false, 0.08, 0)

    // keys
    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)

    // restart wiring
    const onRestart = () => this.scene.restart()
    bus.on('dsa:restart', onRestart)
    this.events.on('shutdown', () => bus.off('dsa:restart', onRestart))

    bus.emit('dsa:operation', {
      op: `Zone 3 — linked list traversal ptr = head`,
      zone: 'list',
    })
  }

  update() {
    if (this.dead) return
    this.player.update()

    if (this.busy) return
    const JD = Phaser.Input.Keyboard.JustDown
    if (JD(this.rightKey)) {
      this.traverse()
    }
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

    // glow (back layer)
    const glowG = this.add.graphics().setDepth(2)
    glowG.lineStyle(12, 0x00ffaa, 0.15)
    glowG.moveTo(x1, y1)
    glowG.lineTo(x2, y2)
    glowG.strokePath()
    this.vineGlows.push(glowG)

    // main line
    const g = this.add.graphics().setDepth(3)
    g.lineStyle(3, 0x00ffaa, 0.9)
    g.moveTo(x1, y1)
    g.lineTo(x2, y2)
    g.strokePath()

    // arrowhead
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

    this.vines.push(g)
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

        // check win: reached end
        if (!next.next) {
          this.onVictory()
        }
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
    // node: glowing orb
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
