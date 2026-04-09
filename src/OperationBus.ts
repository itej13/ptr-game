import mitt from 'mitt'

export type DsaOperation = {
  op: string
  zone: string
}

type BusEvents = {
  'dsa:operation': DsaOperation
}

export const bus = mitt<BusEvents>()
