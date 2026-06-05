// ============================================================
// MATCH & COMPETITION TYPES
// ============================================================

import type { Position } from './player'

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'postponed'

export type MatchEventType =
  | 'kick_off'
  | 'goal'
  | 'missed_chance'
  | 'save'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'
  | 'injury'
  | 'corner'
  | 'foul'
  | 'pressure'
  | 'counter_attack'
  | 'half_time'
  | 'full_time'
  | 'commentary'

/** Evento narrativo gerado pela match engine */
export interface MatchEvent {
  id:                  string
  minute:              number
  type:                MatchEventType
  primaryPlayerId?:    string
  secondaryPlayerId?:  string
  clubId:              string
  narrative:           string
  data?:               Record<string, unknown>
}

export interface MatchStats {
  possession:    [number, number]  // [home%, away%]
  shots:         [number, number]
  shotsOnTarget: [number, number]
  corners:       [number, number]
  fouls:         [number, number]
  yellowCards:   [number, number]
  redCards:      [number, number]
}

export type Formation =
  | '4-4-2' | '4-3-3' | '4-2-3-1' | '4-5-1'
  | '3-5-2' | '3-4-3'
  | '5-3-2' | '5-4-1'

export type Mentality       = 'very_defensive' | 'defensive' | 'balanced' | 'attacking' | 'very_attacking'
export type PressIntensity  = 'low' | 'medium' | 'high' | 'very_high'
export type Tempo           = 'slow' | 'normal' | 'fast'
export type DefensiveLine   = 'deep' | 'normal' | 'high'
export type AttackFocus     = 'left' | 'center' | 'right' | 'mixed'

/** Configuração tática completa */
export interface Tactics {
  formation:      Formation
  mentality:      Mentality
  pressIntensity: PressIntensity
  tempo:          Tempo
  defensiveLine:  DefensiveLine
  attackFocus:    AttackFocus
}

export interface LineupSlot {
  playerId: string
  position: Position
  x:        number   // 0–100
  y:        number   // 0–100
}

export interface Lineup {
  tactics:     Tactics
  starters:    LineupSlot[]   // 11 slots
  substitutes: string[]       // IDs (max 7)
}

/** Entidade Partida */
export interface Match {
  id:            string
  saveId:        string
  seasonId:      string
  competitionId: string
  round:         number
  scheduledAt:   string
  status:        MatchStatus
  homeClubId:    string
  awayClubId:    string
  score: {
    home: number
    away: number
  }
  homeLineup?:     Lineup
  awayLineup?:     Lineup
  events:          MatchEvent[]
  stats?:          MatchStats
  playerRatings?:  Record<string, number>   // playerId → 0–10
  momentumCurve?:  number[]                  // 90 valores, -100 a +100
  isPlayerMatch:   boolean
}

// ── Competition ──────────────────────────────────────────────

export type CompetitionFormat = 'league' | 'cup_knockout' | 'groups_knockout'

export interface StandingsRow {
  clubId:       string
  played:       number
  won:          number
  drawn:        number
  lost:         number
  goalsFor:     number
  goalsAgainst: number
  goalDiff:     number
  points:       number
  form:         Array<'W' | 'D' | 'L'>
}

export interface Competition {
  id:           string
  saveId:       string
  seasonId:     string
  name:         string
  shortName:    string
  type:         'estadual' | 'copa' | 'liga'
  format:       CompetitionFormat
  clubIds:      string[]
  standings?:   StandingsRow[]
  currentRound: number
  totalRounds:  number
  isActive:     boolean
  groups?: Array<{
    name:       string
    clubIds:    string[]
    standings:  StandingsRow[]
  }>
}
