import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { GameSave, Manager, Club, Season, Competition } from '@/types'
import type { MatchResult } from '@/engine/simulation/types'

// Tática simplificada — 3 controles com impacto real
export type TacticStyle    = 'defensive' | 'balanced' | 'attacking'
export type TacticRhythm   = 'slow' | 'normal' | 'press'
export type TacticFormation = '4-4-2' | '4-3-3' | '4-2-3-1' | '5-3-2'

export interface SimpleTactics {
  formation: TacticFormation
  style:     TacticStyle
  rhythm:    TacticRhythm
}

export const DEFAULT_TACTICS: SimpleTactics = {
  formation: '4-3-3',
  style:     'balanced',
  rhythm:    'normal',
}

interface GameState {
  activeSave:      GameSave | null
  manager:         Manager | null
  playerClub:      Club | null
  activeSeason:    Season | null
  competition:     Competition | null
  tactics:         SimpleTactics
  lastMatchResult:   MatchResult | null  // Para tela de resultado
  isAdvancing:       boolean             // Lock durante simulação
  pendingSeasonEnd:  boolean             // Última rodada jogada, aguardando ver resultado
}

interface GameActions {
  setActiveSave:      (save: GameSave) => void
  setManager:         (manager: Manager) => void
  setPlayerClub:      (club: Club) => void
  setActiveSeason:    (season: Season) => void
  setCompetition:     (comp: Competition) => void
  setTactics:         (tactics: SimpleTactics) => void
  setLastMatchResult: (result: MatchResult | null) => void
  setIsAdvancing:       (v: boolean) => void
  setPendingSeasonEnd:  (v: boolean) => void
  updatePlayerClub:     (updates: Partial<Club>) => void
  updateSeason:       (updates: Partial<Season>) => void
  updateCompetition:  (updates: Partial<Competition>) => void
  resetGame:          () => void
}

const initialState: GameState = {
  activeSave:      null,
  manager:         null,
  playerClub:      null,
  activeSeason:    null,
  competition:     null,
  tactics:         DEFAULT_TACTICS,
  lastMatchResult:   null,
  isAdvancing:       false,
  pendingSeasonEnd:  false,
}

export const useGameStore = create<GameState & GameActions>()(
  subscribeWithSelector((set) => ({
    ...initialState,
    setActiveSave:      (activeSave)  => set({ activeSave }),
    setManager:         (manager)     => set({ manager }),
    setPlayerClub:      (playerClub)  => set({ playerClub }),
    setActiveSeason:    (activeSeason)=> set({ activeSeason }),
    setCompetition:     (competition) => set({ competition }),
    setTactics:         (tactics)     => set({ tactics }),
    setLastMatchResult: (lastMatchResult) => set({ lastMatchResult }),
    setIsAdvancing:       (isAdvancing)      => set({ isAdvancing }),
    setPendingSeasonEnd:  (pendingSeasonEnd) => set({ pendingSeasonEnd }),
    updatePlayerClub:   (updates) => set(s => ({ playerClub: s.playerClub ? { ...s.playerClub, ...updates } : null })),
    updateSeason:       (updates) => set(s => ({ activeSeason: s.activeSeason ? { ...s.activeSeason, ...updates } : null })),
    updateCompetition:  (updates) => set(s => ({ competition: s.competition ? { ...s.competition, ...updates } : null })),
    resetGame:          () => set(initialState),
  }))
)
