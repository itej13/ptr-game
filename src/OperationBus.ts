import mitt from 'mitt'

export type DsaOperation = {
  op: string
  zone: string
}

export type MapNode = { id: number; label: string; player: boolean; severed?: boolean }
export type MapEdge = { from: number; to: number; kind: 'fwd' | 'cycle' | 'broken' }
export type MapState = { zone: string; nodes: MapNode[]; edges: MapEdge[] }

type BusEvents = {
  'dsa:operation': DsaOperation
  'dsa:step': undefined
  'dsa:restart': undefined
  'dsa:nextzone': undefined
  'dsa:mapstate': MapState
}

export const bus = mitt<BusEvents>()
