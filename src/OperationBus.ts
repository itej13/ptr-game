import mitt from 'mitt'

export type DsaOperation = {
  op: string
  zone: string
}

type BusEvents = {
  'dsa:operation': DsaOperation
  'dsa:step': undefined
  'dsa:restart': undefined
  'dsa:nextzone': undefined
}

export const bus = mitt<BusEvents>()
