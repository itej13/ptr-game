import { useEffect, useRef, useState } from 'react'
import { bus, type DsaOperation, type MapState, type MapNode, type MapEdge } from '../OperationBus'
import { useGameStore } from '../store/gameStore'
import type { GameState } from '../store/gameStore'

const BS_PSEUDOCODE = `function binarySearch(arr, target):
  lo = 0
  hi = arr.length - 1

  while lo <= hi:
    mid = floor((lo + hi) / 2)

    if arr[mid] == target:
      return mid          // found

    if arr[mid] < target:
      lo = mid + 1        // go right
    else:
      hi = mid - 1        // go left

  return -1               // not found`

const STACK_PSEUDOCODE = `// stack overflow prevention
while timer > 0:
  stack.push(block)   // auto, faster each phase

  if player.input():
    stack.pop()       // manual — keep height down!

  if stack.height > MAX:
    OVERFLOW!         // game over

// LIFO: Last In, First Out
// pop() always removes the top element
// push() always adds to the top`

/* ═══════════════════════════════════════════ */
/*  COMPLEXITY METER                          */
/* ═══════════════════════════════════════════ */

type ComplexityInfo = { label: string; sublabel: string; tier: 0 | 1 | 2 }

function classifyOp(op: string): ComplexityInfo {
  const o = op.toLowerCase()
  // O(log n) — binary search
  if (
    o.startsWith('bs:') ||
    o.includes('binary search') ||
    (o.includes('arr[') && (o.includes('lo=') || o.includes('hi=')))
  ) return { label: 'O(log n)', sublabel: 'binary search', tier: 1 }

  // O(1) — direct pointer / stack ops
  if (
    o.includes('push(') || o.includes('pop() →') ||
    o.includes('new_node') || o.includes('current.next =') ||
    o.includes('repaired:') || o.includes('cycle cut') ||
    o.includes('delete current') || o.includes('target.next') ||
    o.includes('all vines restored') || o.includes('ptr->next == null') ||
    o.includes('no severed vine') || o.includes('new_node.next =')
  ) return { label: 'O(1)', sublabel: 'pointer op', tier: 0 }

  // O(n) — traversal / scan
  if (
    o.includes('ptr = ptr->next') || o.includes("floyd") ||
    o.includes('slow→') || o.includes('fast→') || o.includes('slow=') ||
    o.includes('cycle detected') || o.includes('cycle:') ||
    o.includes('corruption') || o.includes('navigate') ||
    o.includes('at [') || o.includes('dissolve') ||
    o.includes('arr[') || o.includes('free mode') || o.includes('traversal')
  ) return { label: 'O(n)', sublabel: 'linear scan', tier: 2 }

  return { label: 'O(1)', sublabel: 'constant', tier: 0 }
}

function ComplexityMeter() {
  const [info, setInfo] = useState<ComplexityInfo>({ label: 'O(1)', sublabel: 'idle', tier: 0 })
  const [bumped, setBumped] = useState(false)
  const tierRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onOp = (op: DsaOperation) => {
      const next = classifyOp(op.op)
      if (next.tier !== tierRef.current) {
        tierRef.current = next.tier
        setBumped(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setBumped(false), 280)
      }
      setInfo(next)
    }
    bus.on('dsa:operation', onOp)
    return () => {
      bus.off('dsa:operation', onOp)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const palette = [
    { wrap: 'border-green-700/70 bg-green-950/75', main: 'text-green-300', sub: 'text-green-700' },
    { wrap: 'border-yellow-600/70 bg-yellow-950/75', main: 'text-yellow-300', sub: 'text-yellow-700' },
    { wrap: 'border-red-700/70 bg-red-950/75',    main: 'text-red-300',   sub: 'text-red-700'   },
  ]
  const p = palette[info.tier]

  return (
    <div
      className={`absolute bottom-4 left-4 pointer-events-none font-mono border rounded-md px-3 py-2 select-none
        transition-[transform,background-color,border-color] duration-200
        ${p.wrap} ${bumped ? 'scale-[1.06]' : 'scale-100'}`}
    >
      <div className="text-gray-600 text-[9px] leading-none mb-1 tracking-widest uppercase">complexity</div>
      <div className={`text-[22px] font-bold leading-none tracking-wide ${p.main}`}>{info.label}</div>
      <div className={`text-[10px] mt-1 leading-none ${p.sub}`}>{info.sublabel}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  MEMORY MAP                                */
/* ═══════════════════════════════════════════ */

function ListMiniMap({ nodes, edges }: { nodes: MapNode[]; edges: MapEdge[] }) {
  if (nodes.length === 0) return <div className="text-gray-700 text-[10px] py-2">building…</div>

  const W = 186, nodeY = 30, H = 70
  const n = nodes.length
  const gap = (W - 16) / Math.max(n - 1, 1)
  const cx = (id: number) => 8 + id * gap

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* edges */}
      {edges.map((e, i) => {
        const x1 = cx(e.from), x2 = cx(e.to)
        if (e.kind === 'cycle') {
          const loopY = nodeY + 24
          return (
            <polyline key={i}
              points={`${x1},${nodeY + 7} ${x1},${loopY} ${x2},${loopY} ${x2},${nodeY + 7}`}
              fill="none" stroke="#9900ff" strokeWidth={1.5} opacity={0.65}
            />
          )
        }
        if (e.kind === 'broken') {
          const midX = (x1 + x2) / 2
          return (
            <g key={i}>
              <line x1={x1 + 7} y1={nodeY} x2={midX - 5} y2={nodeY}
                stroke="#ff2200" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.9} />
              <line x1={midX + 5} y1={nodeY} x2={x2 - 7} y2={nodeY}
                stroke="#ff2200" strokeWidth={1.5} strokeDasharray="3,2" opacity={0.9} />
              <text x={midX} y={nodeY + 4} fill="#ff4400" fontSize={9} textAnchor="middle">✕</text>
            </g>
          )
        }
        // forward arrow
        return (
          <g key={i}>
            <line x1={x1 + 7} y1={nodeY} x2={x2 - 10} y2={nodeY}
              stroke="#00ffaa" strokeWidth={1.5} opacity={0.5} />
            <polygon
              points={`${x2 - 7},${nodeY} ${x2 - 12},${nodeY - 3} ${x2 - 12},${nodeY + 3}`}
              fill="#00ffaa" opacity={0.5}
            />
          </g>
        )
      })}
      {/* nodes */}
      {nodes.map(nd => {
        const x = cx(nd.id)
        const fill   = nd.player ? '#00ccff' : nd.severed ? '#cc1100' : '#002244'
        const stroke = nd.player ? '#00ffff' : nd.severed ? '#ff3300' : '#005599'
        return (
          <g key={nd.id}>
            {nd.player && <circle cx={x} cy={nodeY} r={11} fill="#00ffff" opacity={0.1} />}
            <circle cx={x} cy={nodeY} r={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
            <text x={x} y={nodeY + 17} fill={nd.player ? '#00ccff' : nd.severed ? '#ff4400' : '#224466'}
              fontSize={7} textAnchor="middle" fontFamily="monospace">{nd.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function ArrayMiniMap({ freeSteps, binarySteps, mode }: {
  freeSteps: number; binarySteps: number; mode: string
}) {
  const W = 186, H = 46, n = 50
  const bw = (W - 4) / n

  const bsRange = (mode === 'binary' || mode === 'done')
    ? Math.max(1, Math.ceil(n / Math.pow(2, binarySteps)))
    : n
  const bsStart = Math.max(0, Math.floor((n - bsRange) / 2))

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <text x={2} y={9} fill="#334455" fontSize={7} fontFamily="monospace">arr[50] sorted</text>
      {Array.from({ length: n }, (_, i) => {
        const x = 2 + i * bw
        const lit = mode === 'binary' || mode === 'done'
          ? (i >= bsStart && i < bsStart + bsRange)
          : i < freeSteps
        return (
          <rect key={i} x={x} y={13} width={bw - 0.4} height={11}
            fill={lit ? (mode === 'free' ? '#554400' : '#003366') : '#111122'}
            stroke="#1a1a33" strokeWidth={0.3} />
        )
      })}
      <text x={2} y={40} fill="#334455" fontSize={7} fontFamily="monospace">
        {mode === 'free'
          ? `O(n): scanned ${freeSteps}/50`
          : (mode === 'binary' || mode === 'done')
            ? `O(log n): ~${bsRange} remain`
            : 'O(n)'}
      </text>
    </svg>
  )
}

function StackMiniMap({ pops }: { pops: number }) {
  const W = 186, H = 54, blockH = 7, blockW = 104, bx = (W - blockW) / 2, visible = 5

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <text x={2} y={9} fill="#442200" fontSize={7} fontFamily="monospace">stack (LIFO)</text>
      {/* container */}
      <rect x={bx - 2} y={11} width={blockW + 4} height={visible * (blockH + 1) + 3}
        fill="none" stroke="#331100" strokeWidth={1} />
      {/* blocks */}
      {Array.from({ length: visible }, (_, i) => (
        <rect key={i} x={bx} y={12 + i * (blockH + 1)} width={blockW} height={blockH}
          fill={i === 0 ? '#7a3d00' : '#2e1500'} stroke="#4a2200" strokeWidth={0.5} />
      ))}
      <text x={bx - 4} y={17} fill="#886633" fontSize={7} fontFamily="monospace" textAnchor="end">top→</text>
      <text x={W - 2} y={H - 2} fill="#553300" fontSize={7} fontFamily="monospace" textAnchor="end">
        pops: {pops}
      </text>
    </svg>
  )
}

function MemoryMap() {
  const [mapState, setMapState] = useState<MapState | null>(null)
  const currentZone = useGameStore((s: GameState) => s.currentZone)
  const mode        = useGameStore((s: GameState) => s.mode)
  const freeSteps   = useGameStore((s: GameState) => s.freeSteps)
  const binarySteps = useGameStore((s: GameState) => s.binarySteps)
  const pops        = useGameStore((s: GameState) => s.pops)

  // reset list map when zone changes away from list
  useEffect(() => {
    if (currentZone !== 'list') setMapState(null)
  }, [currentZone])

  useEffect(() => {
    const onMap = (state: MapState) => setMapState(state)
    bus.on('dsa:mapstate', onMap)
    return () => { bus.off('dsa:mapstate', onMap) }
  }, [])

  return (
    <div className="font-mono bg-black/60 border border-cyan-900/50 rounded p-1.5 select-none">
      <div className="text-cyan-900 text-[9px] tracking-widest uppercase mb-1 px-0.5">memory map</div>
      {currentZone === 'list' && mapState?.zone === 'list' ? (
        <ListMiniMap nodes={mapState.nodes} edges={mapState.edges} />
      ) : currentZone === 'array' ? (
        <ArrayMiniMap freeSteps={freeSteps} binarySteps={binarySteps} mode={mode} />
      ) : currentZone === 'stack' ? (
        <StackMiniMap pops={pops} />
      ) : (
        <div className="text-gray-800 text-[10px] py-3 px-2">— boot —</div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  MAIN HUD                                  */
/* ═══════════════════════════════════════════ */

export function HUD() {
  const [allOps, setAllOps] = useState<DsaOperation[]>([])
  const target      = useGameStore((s: GameState) => s.target)
  const mode        = useGameStore((s: GameState) => s.mode)
  const outcome     = useGameStore((s: GameState) => s.outcome)
  const freeSteps   = useGameStore((s: GameState) => s.freeSteps)
  const binarySteps = useGameStore((s: GameState) => s.binarySteps)
  const enemyProgress = useGameStore((s: GameState) => s.enemyProgress)
  const currentZone = useGameStore((s: GameState) => s.currentZone)
  const survivalTime = useGameStore((s: GameState) => s.survivalTime)
  const pops        = useGameStore((s: GameState) => s.pops)

  useEffect(() => {
    const onOp = (op: DsaOperation) =>
      setAllOps((prev) => [...prev, op])
    bus.on('dsa:operation', onOp)
    return () => { bus.off('dsa:operation', onOp) }
  }, [])

  const recentOps = allOps.slice(-5)
  const bsOps = allOps.filter((o) => o.op.startsWith('bs:'))

  const handleRestart = () => {
    useGameStore.getState().resetSearch()
    setAllOps([])
    bus.emit('dsa:restart', undefined)
  }

  const isStack = currentZone === 'stack'
  const isList  = currentZone === 'list'
  const modeLabel = isStack
    ? 'SURVIVAL — pop to stay alive'
    : isList ? 'TRAVERSAL — RIGHT arrow to move'
    : mode === 'free'   ? 'FREE — click any box'
    : mode === 'binary' ? 'BINARY — Space / click mid'
    : 'DONE'
  const modeColor = isStack
    ? 'text-red-400 border-red-800'
    : isList ? 'text-cyan-400 border-cyan-800'
    : mode === 'free'   ? 'text-yellow-400 border-yellow-800'
    : mode === 'binary' ? 'text-cyan-400 border-cyan-800'
    : 'text-green-400 border-green-800'

  if (outcome === 'death')   return <DeathScreen onRestart={handleRestart} />
  if (outcome === 'victory' && isStack) return <StackVictoryScreen pops={pops} />
  if (outcome === 'victory' && isList)  return <ListVictoryScreen traversals={allOps.length} />
  if (outcome === 'victory') return (
    <VictoryScreen
      target={target}
      freeSteps={freeSteps}
      binarySteps={binarySteps}
      enemyProgress={enemyProgress}
      bsOps={bsOps}
    />
  )

  const elapsed    = 30 - survivalTime
  const phase      = Math.min(Math.floor(elapsed / 10) + 1, 3)
  const timeColor  = survivalTime <= 10 ? 'text-red-400' : survivalTime <= 20 ? 'text-yellow-400' : 'text-green-400'

  return (
    <>
      {/* target / mode — top center */}
      {(target > 0 || isStack) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none flex gap-3 items-center select-none">
          {isStack ? (
            <div className={`font-mono text-lg bg-black/70 border border-red-800 px-4 py-1 rounded tabular-nums ${timeColor}`}>
              {survivalTime}s
            </div>
          ) : (
            <div className="font-mono text-sm bg-black/70 border border-pink-800 text-pink-400 px-3 py-1 rounded">
              find: {target}
            </div>
          )}
          <div className={`font-mono text-xs bg-black/70 border px-3 py-1 rounded ${modeColor}`}>
            {modeLabel}
          </div>
        </div>
      )}

      {/* top-right column: memory map + counters */}
      <div className="absolute top-4 right-4 pointer-events-none flex flex-col gap-2 items-end select-none">
        <MemoryMap />

        {/* counters panel */}
        <div className="font-mono text-sm bg-black/60 border border-cyan-900 rounded px-3 py-1.5 space-y-0.5">
          {isList ? (
            <>
              <div className="text-cyan-400">traversals: {allOps.filter(o => o.op.includes('ptr = ptr->next')).length}</div>
              <div className="text-green-600 text-xs mt-1">→: traverse  ←→: navigate</div>
              <div className="text-yellow-600 text-xs">Ins: insert after</div>
              <div className="text-red-600 text-xs">Del: delete next</div>
              <div className="text-orange-500 text-xs">R: repair vine</div>
            </>
          ) : isStack ? (
            <>
              <div className="text-orange-400">pops: {pops}</div>
              <div className="text-cyan-400 text-xs">tempo: {phase}/3</div>
              <div className="text-green-600 text-xs mt-1">Space / ↓ / S / X: POP</div>
            </>
          ) : (
            <>
              <div className="text-yellow-400">free: {freeSteps}</div>
              {mode !== 'free' && (
                <>
                  <div className="text-cyan-400">binary: {binarySteps}</div>
                  <div className="text-red-400">enemy: {enemyProgress}/50</div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ops log — bottom right */}
      <div className="absolute bottom-4 right-4 pointer-events-none font-mono text-xs text-green-400 bg-black/70 border border-green-900 rounded p-2 w-72 space-y-0.5">
        <div className="text-green-600 mb-1 select-none">// ops log</div>
        {recentOps.length === 0
          ? <div className="text-green-900">— idle —</div>
          : recentOps.map((o, i) => (
              <div key={i}>
                <span className="text-green-600">&gt;</span>{' '}
                <span className="text-green-300">{o.op}</span>
                <span className="text-green-700"> [{o.zone}]</span>
              </div>
            ))
        }
      </div>

      {/* complexity meter — bottom left */}
      <ComplexityMeter />
    </>
  )
}

/* ═══════════════════════════════════════════ */
/*  DEATH SCREEN                              */
/* ═══════════════════════════════════════════ */

function DeathScreen({ onRestart }: { onRestart: () => void }) {
  const title  = useGameStore((s: GameState) => s.deathTitle) || 'CORRUPTED'
  const detail = useGameStore((s: GameState) => s.deathDetail)

  return (
    <div className="absolute inset-0 death-overlay flex items-center justify-center z-50">
      <div className="absolute inset-0 death-scanlines pointer-events-none" />

      <div className="death-shake relative z-10 text-center px-8 max-w-lg">
        <div className="font-mono text-xs text-red-700 tracking-[0.3em] mb-4 death-flicker">
          ERR_0x{Math.abs(title.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) * 0x1f).toString(16).toUpperCase().slice(0, 4)}_FAULT
        </div>

        <div className="font-mono text-5xl font-bold text-red-500 tracking-widest mb-6">
          {title}
        </div>

        <div className="font-mono text-sm text-red-300/80 text-left bg-black/40 border border-red-900/50 rounded p-4 mb-6 space-y-1.5">
          <div className="text-red-500">&gt; process terminated</div>
          <div>
            <span className="text-red-600">  cause:</span>{' '}
            <span className="text-red-300">{detail}</span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="font-mono text-sm text-red-400 border border-red-700 bg-red-950/50 px-6 py-2 rounded
                     hover:bg-red-900/60 hover:text-red-300 hover:border-red-500
                     transition-colors cursor-pointer tracking-wider"
        >
          [ RESTART ]
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  ZONE 1 VICTORY SCREEN                    */
/* ═══════════════════════════════════════════ */

function VictoryScreen({ target, freeSteps, binarySteps, enemyProgress, bsOps }: {
  target: number
  freeSteps: number
  binarySteps: number
  enemyProgress: number
  bsOps: DsaOperation[]
}) {
  const logN = Math.ceil(Math.log2(50))

  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="max-w-2xl w-full px-6">
        <div className="text-center mb-6">
          <div className="font-mono text-xs text-green-700 tracking-[0.4em] mb-2">ZONE 1</div>
          <div className="font-mono text-4xl font-bold text-green-400 tracking-widest">COMPLETE</div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 space-y-4">
            <div className="font-mono text-sm bg-black/60 border border-green-900/60 rounded p-3 space-y-1.5">
              <div className="text-green-600 text-xs mb-2">// stats</div>
              <div className="text-green-300"><span className="text-green-600">target:</span> {target}</div>
              <div className="text-yellow-400"><span className="text-green-600">free search:</span> {freeSteps} steps</div>
              <div className="text-cyan-400"><span className="text-green-600">binary search:</span> {binarySteps} steps</div>
              <div className="text-red-400"><span className="text-green-600">enemy scanned:</span> {enemyProgress}/50</div>
              <div className="border-t border-green-900/40 pt-1.5 mt-1.5 text-green-300">
                <span className="text-green-600">complexity:</span>{' '}
                <span className="text-cyan-400">O(log n)</span>
                <span className="text-green-700"> = O(log 50) = </span>
                <span className="text-white">{logN}</span>
                <span className="text-green-700"> vs O(n) = </span>
                <span className="text-red-400">50</span>
              </div>
            </div>

            <div className="font-mono text-xs bg-black/60 border border-green-900/60 rounded p-3">
              <div className="text-green-600 mb-1.5">// binary search ops ({bsOps.length})</div>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {bsOps.map((o, i) => (
                  <div key={i}>
                    <span className="text-green-700">{i + 1}.</span>{' '}
                    <span className="text-green-300">{o.op.replace('bs: ', '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="font-mono text-xs bg-black/60 border border-green-900/60 rounded p-3 h-full">
              <div className="text-green-600 mb-2">// algorithm</div>
              <pre className="text-green-400/90 whitespace-pre leading-relaxed text-[11px]">{BS_PSEUDOCODE}</pre>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => { useGameStore.getState().resetSearch(); bus.emit('dsa:nextzone', undefined) }}
            className="font-mono text-sm text-green-400 border border-green-700 bg-green-950/40 px-8 py-2.5 rounded
                       hover:bg-green-900/50 hover:text-green-300 hover:border-green-400
                       transition-colors cursor-pointer tracking-wider"
          >
            NEXT ZONE →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  ZONE 2 (STACK) VICTORY SCREEN            */
/* ═══════════════════════════════════════════ */

function StackVictoryScreen({ pops }: { pops: number }) {
  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="max-w-2xl w-full px-6">
        <div className="text-center mb-6">
          <div className="font-mono text-xs text-green-700 tracking-[0.4em] mb-2">ZONE 2</div>
          <div className="font-mono text-4xl font-bold text-green-400 tracking-widest">SURVIVED</div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 space-y-4">
            <div className="font-mono text-sm bg-black/60 border border-green-900/60 rounded p-3 space-y-1.5">
              <div className="text-green-600 text-xs mb-2">// stats</div>
              <div className="text-green-300"><span className="text-green-600">survived:</span> 30 seconds</div>
              <div className="text-orange-400"><span className="text-green-600">total pops:</span> {pops}</div>
              <div className="text-cyan-400"><span className="text-green-600">tempo phases:</span> 3/3</div>
              <div className="border-t border-green-900/40 pt-1.5 mt-1.5 text-green-300">
                <span className="text-green-600">data structure:</span>{' '}
                <span className="text-orange-400">Stack (LIFO)</span>
              </div>
              <div className="text-green-300">
                <span className="text-green-600">lesson:</span>{' '}
                <span className="text-green-700">push/pop are O(1) but overflow is O(n) danger</span>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="font-mono text-xs bg-black/60 border border-green-900/60 rounded p-3 h-full">
              <div className="text-green-600 mb-2">// algorithm</div>
              <pre className="text-orange-400/90 whitespace-pre leading-relaxed text-[11px]">{STACK_PSEUDOCODE}</pre>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => { useGameStore.getState().resetSearch(); bus.emit('dsa:nextzone', undefined) }}
            className="font-mono text-sm text-green-400 border border-green-700 bg-green-950/40 px-8 py-2.5 rounded
                       hover:bg-green-900/50 hover:text-green-300 hover:border-green-400
                       transition-colors cursor-pointer tracking-wider"
          >
            NEXT ZONE →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  ZONE 3 (LINKED LIST) VICTORY SCREEN      */
/* ═══════════════════════════════════════════ */

function ListVictoryScreen({ traversals }: { traversals: number }) {
  const LIST_PSEUDOCODE = `// linked list traversal
ptr = head

while ptr != null:
  visit(ptr->value)
  ptr = ptr->next    // follow the arrow

// properties:
// - singly linked
// - each node → next
// - access: O(n) sequential
// - insert/delete: O(1) if ptr known`

  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="max-w-2xl w-full px-6">
        <div className="text-center mb-6">
          <div className="font-mono text-xs text-green-700 tracking-[0.4em] mb-2">ZONE 3</div>
          <div className="font-mono text-4xl font-bold text-green-400 tracking-widest">COMPLETE</div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 space-y-4">
            <div className="font-mono text-sm bg-black/60 border border-green-900/60 rounded p-3 space-y-1.5">
              <div className="text-green-600 text-xs mb-2">// stats</div>
              <div className="text-cyan-400"><span className="text-green-600">traversals:</span> {traversals}</div>
              <div className="text-green-300"><span className="text-green-600">reached:</span> end of list (null)</div>
              <div className="border-t border-green-900/40 pt-1.5 mt-1.5 text-green-300">
                <span className="text-green-600">data structure:</span>{' '}
                <span className="text-cyan-400">Linked List (Singly)</span>
              </div>
              <div className="text-green-300">
                <span className="text-green-600">traversal:</span>{' '}
                <span className="text-green-700">O(n) — must follow chain</span>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="font-mono text-xs bg-black/60 border border-green-900/60 rounded p-3 h-full">
              <div className="text-green-600 mb-2">// algorithm</div>
              <pre className="text-cyan-400/90 whitespace-pre leading-relaxed text-[11px]">{LIST_PSEUDOCODE}</pre>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="font-mono text-xs text-green-700 mb-3">more zones coming soon</div>
          <button
            onClick={() => { useGameStore.getState().resetSearch(); bus.emit('dsa:restart', undefined) }}
            className="font-mono text-sm text-green-400 border border-green-700 bg-green-950/40 px-8 py-2.5 rounded
                       hover:bg-green-900/50 hover:text-green-300 hover:border-green-400
                       transition-colors cursor-pointer tracking-wider"
          >
            REPLAY ZONE
          </button>
        </div>
      </div>
    </div>
  )
}
