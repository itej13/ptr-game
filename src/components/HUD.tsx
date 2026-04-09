import { useEffect, useState } from 'react'
import { bus, type DsaOperation } from '../OperationBus'

export function HUD() {
  const [ops, setOps] = useState<DsaOperation[]>([])

  useEffect(() => {
    const handler = (op: DsaOperation) => {
      setOps((prev) => [...prev.slice(-4), op])
    }
    bus.on('dsa:operation', handler)
    return () => bus.off('dsa:operation', handler)
  }, [])

  return (
    <div className="absolute bottom-4 right-4 pointer-events-none font-mono text-xs text-green-400 bg-black/70 border border-green-900 rounded p-2 w-64 space-y-0.5">
      <div className="text-green-600 mb-1 select-none">// ops log</div>
      {ops.length === 0
        ? <div className="text-green-900">— idle —</div>
        : ops.map((o, i) => (
            <div key={i}>
              <span className="text-green-600">&gt;</span>{' '}
              <span className="text-green-300">{o.op}</span>
              <span className="text-green-700"> [{o.zone}]</span>
            </div>
          ))
      }
    </div>
  )
}
