import { create } from 'zustand'
import type { StateCreator } from 'zustand'

export type SearchMode = 'free' | 'binary' | 'done'
export type Outcome = 'playing' | 'victory' | 'death' | 'defeat'

export interface CodexEntry {
  zone: string
  name: string
  oneLiner: string
  pseudocode: string
  bigO: { op: string; time: string }[]
}

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
  survivalTime: number
  pops: number

  paused: boolean
  togglePause: () => void

  codex: CodexEntry[]
  unlockCodex: (entry: CodexEntry) => void

  setTarget: (t: number) => void
  setMode: (m: SearchMode) => void
  incFreeSteps: () => void
  incBinarySteps: () => void
  setOutcome: (o: Outcome) => void
  setEnemyProgress: (n: number) => void
  setDeath: (title: string, detail: string) => void
  setSurvivalTime: (t: number) => void
  incPops: () => void
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
  survivalTime: 30,
  pops: 0,

  paused: false,
  togglePause: () => set((s) => ({ paused: !s.paused })),

  codex: [],
  unlockCodex: (entry: CodexEntry) =>
    set((s) => ({
      codex: s.codex.some((e) => e.zone === entry.zone)
        ? s.codex
        : [...s.codex, entry],
    })),

  setTarget: (target: number) => set({ target }),
  setMode: (mode: SearchMode) => set({ mode }),
  incFreeSteps: () => set((s: GameState) => ({ freeSteps: s.freeSteps + 1 })),
  incBinarySteps: () => set((s: GameState) => ({ binarySteps: s.binarySteps + 1 })),
  setOutcome: (outcome: Outcome) => set({ outcome }),
  setEnemyProgress: (enemyProgress: number) => set({ enemyProgress }),
  setDeath: (deathTitle: string, deathDetail: string) => set({ deathTitle, deathDetail, outcome: 'death' }),
  setSurvivalTime: (survivalTime: number) => set({ survivalTime }),
  incPops: () => set((s: GameState) => ({ pops: s.pops + 1 })),
  resetSearch: () => set({
    mode: 'free', freeSteps: 0, binarySteps: 0,
    target: 0, outcome: 'playing', enemyProgress: 0,
    deathTitle: '', deathDetail: '',
    survivalTime: 30, pops: 0,
  }),
})

export const useGameStore = create<GameState>(storeCreator)
