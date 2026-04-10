import { useEffect, useState } from 'react'
import { bus, type DsaOperation } from '../OperationBus'
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

export function HUD() {
  const [allOps, setAllOps] = useState<DsaOperation[]>([])
  const target = useGameStore((s: GameState) => s.target)
  const mode = useGameStore((s: GameState) => s.mode)
  const outcome = useGameStore((s: GameState) => s.outcome)
  const freeSteps = useGameStore((s: GameState) => s.freeSteps)
  const binarySteps = useGameStore((s: GameState) => s.binarySteps)
  const enemyProgress = useGameStore((s: GameState) => s.enemyProgress)
  const currentZone = useGameStore((s: GameState) => s.currentZone)
  const survivalTime = useGameStore((s: GameState) => s.survivalTime)
  const pops = useGameStore((s: GameState) => s.pops)

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

  // mode labels
  const isStack = currentZone === 'stack'
  const isList = currentZone === 'list'
  const modeLabel = isStack
    ? 'SURVIVAL — pop to stay alive'
    : isList ? 'TRAVERSAL — RIGHT arrow to move'
    : mode === 'free' ? 'FREE — click any box'
    : mode === 'binary' ? 'BINARY — Space / click mid'
    : 'DONE'
  const modeColor = isStack
    ? 'text-red-400 border-red-800'
    : isList ? 'text-cyan-400 border-cyan-800'
    : mode === 'free' ? 'text-yellow-400 border-yellow-800'
    : mode === 'binary' ? 'text-cyan-400 border-cyan-800'
    : 'text-green-400 border-green-800'

  if (outcome === 'death') return <DeathScreen onRestart={handleRestart} />
  if (outcome === 'victory' && isStack) return <StackVictoryScreen pops={pops} />
  if (outcome === 'victory' && isList) return <ListVictoryScreen traversals={allOps.length} />
  if (outcome === 'victory') return (
    <VictoryScreen
      target={target}
      freeSteps={freeSteps}
      binarySteps={binarySteps}
      enemyProgress={enemyProgress}
      bsOps={bsOps}
    />
  )

  // tempo phase for display
  const elapsed = 30 - survivalTime
  const phase = Math.min(Math.floor(elapsed / 10) + 1, 3)
  const timeColor = survivalTime <= 10 ? 'text-red-400' : survivalTime <= 20 ? 'text-yellow-400' : 'text-green-400'

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

      {/* counters — top right */}
      <div className="absolute top-4 right-4 pointer-events-none font-mono text-sm bg-black/60 border border-cyan-900 rounded px-3 py-1.5 select-none space-y-0.5">
        {isList ? (
          <>
            <div className="text-cyan-400">traversals: {allOps.filter(o => o.op.includes('ptr = ptr->next')).length}</div>
            <div className="text-green-600 text-xs mt-1">→: traverse</div>
            <div className="text-yellow-600 text-xs">Ins: insert after</div>
            <div className="text-red-600 text-xs">Del: delete next</div>
          </>
        ) : isStack ? (
          <>
            <div className="text-orange-400">pops: {pops}</div>
            <div className="text-cyan-400 text-xs">
              tempo: {phase}/3
            </div>
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
    </>
  )
}

/* ═══════════════════════════════════════════ */
/*  DEATH SCREEN                              */
/* ═══════════════════════════════════════════ */

function DeathScreen({ onRestart }: { onRestart: () => void }) {
  const title = useGameStore((s: GameState) => s.deathTitle) || 'CORRUPTED'
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
          <div className="font-mono text-4xl font-bold text-green-400 tracking-widest">
            COMPLETE
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 space-y-4">
            <div className="font-mono text-sm bg-black/60 border border-green-900/60 rounded p-3 space-y-1.5">
              <div className="text-green-600 text-xs mb-2">// stats</div>
              <div className="text-green-300">
                <span className="text-green-600">target:</span> {target}
              </div>
              <div className="text-yellow-400">
                <span className="text-green-600">free search:</span> {freeSteps} steps
              </div>
              <div className="text-cyan-400">
                <span className="text-green-600">binary search:</span> {binarySteps} steps
              </div>
              <div className="text-red-400">
                <span className="text-green-600">enemy scanned:</span> {enemyProgress}/50
              </div>
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
              <pre className="text-green-400/90 whitespace-pre leading-relaxed text-[11px]">
                {BS_PSEUDOCODE}
              </pre>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              useGameStore.getState().resetSearch()
              bus.emit('dsa:nextzone', undefined)
            }}
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
          <div className="font-mono text-4xl font-bold text-green-400 tracking-widest">
            SURVIVED
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 space-y-4">
            <div className="font-mono text-sm bg-black/60 border border-green-900/60 rounded p-3 space-y-1.5">
              <div className="text-green-600 text-xs mb-2">// stats</div>
              <div className="text-green-300">
                <span className="text-green-600">survived:</span> 30 seconds
              </div>
              <div className="text-orange-400">
                <span className="text-green-600">total pops:</span> {pops}
              </div>
              <div className="text-cyan-400">
                <span className="text-green-600">tempo phases:</span> 3/3
              </div>
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
              <pre className="text-orange-400/90 whitespace-pre leading-relaxed text-[11px]">
                {STACK_PSEUDOCODE}
              </pre>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="font-mono text-xs text-green-700 mb-3">more zones coming soon</div>
          <button
            onClick={() => {
              useGameStore.getState().resetSearch()
              bus.emit('dsa:restart', undefined)
            }}
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

/* ═══════════════════════════════════════════ */
/*  ZONE 3 (LINKED LIST) VICTORY SCREEN     */
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
          <div className="font-mono text-4xl font-bold text-green-400 tracking-widest">
            COMPLETE
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 space-y-4">
            <div className="font-mono text-sm bg-black/60 border border-green-900/60 rounded p-3 space-y-1.5">
              <div className="text-green-600 text-xs mb-2">// stats</div>
              <div className="text-cyan-400">
                <span className="text-green-600">traversals:</span> {traversals}
              </div>
              <div className="text-green-300">
                <span className="text-green-600">reached:</span> end of list (null)
              </div>
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
              <pre className="text-cyan-400/90 whitespace-pre leading-relaxed text-[11px]">
                {LIST_PSEUDOCODE}
              </pre>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="font-mono text-xs text-green-700 mb-3">more zones coming soon</div>
          <button
            onClick={() => {
              useGameStore.getState().resetSearch()
              bus.emit('dsa:restart', undefined)
            }}
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
