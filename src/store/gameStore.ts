import { create } from 'zustand'
import type { StateCreator } from 'zustand'

export interface GameState {
  currentZone: string
  setCurrentZone: (zone: string) => void
}

const storeCreator: StateCreator<GameState> = (set) => ({
  currentZone: 'boot',
  setCurrentZone: (zone: string) => set({ currentZone: zone }),
})

export const useGameStore = create<GameState>(storeCreator)
