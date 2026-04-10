import { create } from 'zustand'
import type { StateCreator } from 'zustand'

export type SearchMode = 'free' | 'binary' | 'done'
export type Outcome = 'playing' | 'victory' | 'death'

export interface GameState {
  currentZone: string
  setCurrentZone: (zone: string) => void

  target: number
  mode: SearchMode
  freeSteps: number
  binarySteps: number
  outcome: Outcome
  enemyProgress: number
  deathTitle: string
  deathDetail: string

  setTarget: (t: number) => void
  setMode: (m: SearchMode) => void
  incFreeSteps: () => void
  incBinarySteps: () => void
  setOutcome: (o: Outcome) => void
  setEnemyProgress: (n: number) => void
  setDeath: (title: string, detail: string) => void
  resetSearch: () => void
}

const storeCreator: StateCreator<GameState> = (set) => ({
  currentZone: 'boot',
  setCurrentZone: (zone: string) => set({ currentZone: zone }),

  target: 0,
  mode: 'free',
  freeSteps: 0,
  binarySteps: 0,
  outcome: 'playing',
  enemyProgress: 0,
  deathTitle: '',
  deathDetail: '',

  setTarget: (target: number) => set({ target }),
  setMode: (mode: SearchMode) => set({ mode }),
  incFreeSteps: () => set((s: GameState) => ({ freeSteps: s.freeSteps + 1 })),
  incBinarySteps: () => set((s: GameState) => ({ binarySteps: s.binarySteps + 1 })),
  setOutcome: (outcome: Outcome) => set({ outcome }),
  setEnemyProgress: (enemyProgress: number) => set({ enemyProgress }),
  setDeath: (deathTitle: string, deathDetail: string) => set({ deathTitle, deathDetail, outcome: 'death' }),
  resetSearch: () => set({
    mode: 'free', freeSteps: 0, binarySteps: 0,
    target: 0, outcome: 'playing', enemyProgress: 0,
    deathTitle: '', deathDetail: '',
  }),
})

export const useGameStore = create<GameState>(storeCreator)
