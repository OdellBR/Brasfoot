// ============================================================
// ENGINE TYPES — Input/Output da Match Engine
//
// Regra de ouro: a engine é uma função pura.
//   simulateMatch(input: MatchInput) → MatchResult
//
// Tudo que a engine precisa está em MatchInput.
// Tudo que ela produz está em MatchResult.
// Nenhuma dependência externa (React, Zustand, Dexie).
// ============================================================

import type { PlayerAttributes, PlayerDynamicState, Position, Tactics } from '@/types'

/** Snapshot mínimo de um jogador para a engine */
export interface EnginePlayer {
  id:           string
  name:         string
  position:     Position
  attributes:   PlayerAttributes
  dynamicState: PlayerDynamicState
  isStarter:    boolean
}

/** Snapshot de um time para a engine */
export interface EngineTeam {
  clubId:  string
  name:    string
  players: EnginePlayer[]
  tactics: Tactics
  isHome:  boolean
}

/** Input completo — tudo que a engine precisa */
export interface MatchInput {
  matchId:       string
  home:          EngineTeam
  away:          EngineTeam
  seed?:         number       // Se omitido, gera automaticamente
  playerClubId?: string       // ID do clube do jogador para playerSide
}

/** Tipo de evento interno da simulação */
export type SimEventType =
  | 'goal'
  | 'missed_chance'
  | 'save'
  | 'yellow_card'
  | 'red_card'
  | 'commentary'

/** Evento interno (antes de serializar para banco) */
export interface SimEvent {
  minute:              number
  type:                SimEventType
  teamId:              'home' | 'away'
  primaryPlayerId?:    string
  secondaryPlayerId?:  string
  narrative:           string
}

/** Output completo — tudo que a engine produz */
export interface MatchResult {
  matchId:       string
  seed:          number      // Seed usado — reproduz a mesma partida
  playerSide:    'home' | 'away' | null  // Qual lado é o clube do jogador
  scoreHome:     number
  scoreAway:     number
  events:        SimEvent[]
  playerRatings: Record<string, number>
  momentumCurve: number[]
  stats: {
    possession:    [number, number]
    shots:         [number, number]
    shotsOnTarget: [number, number]
    corners:       [number, number]
    fouls:         [number, number]
    yellowCards:   [number, number]
    redCards:      [number, number]
  }
  // Dados de debug — úteis para balancing, sempre incluídos
  debug: MatchDebugData
}

/** Estado interno minuto a minuto da simulação */
export interface SimState {
  minute:        number
  scoreHome:     number
  scoreAway:     number
  momentum:      number        // -100 a +100 (positivo = home)
  possession:    'home' | 'away'
  homeStrength:  number
  awayStrength:  number
  events:        SimEvent[]
  shots:         [number, number]
  shotsOnTarget: [number, number]
  corners:       [number, number]
  fouls:         [number, number]
  yellowCards:   [number, number]
  redCards:      [number, number]
}

/** Dados de debug — para o painel de inspeção */
export interface MatchDebugData {
  seed:             number
  homeStrength:     TeamStrengthSnapshot
  awayStrength:     TeamStrengthSnapshot
  momentumCurve:    number[]
  chanceLog:        ChanceLogEntry[]
  tacticalFactors: {
    homeMentalityBonus:  { attack: number; defense: number }
    awayMentalityBonus:  { attack: number; defense: number }
    homePressBonus:      number
    awayPressBonus:      number
    homeAdvantageApplied:number
  }
}

export interface TeamStrengthSnapshot {
  attack:   number
  midfield: number
  defense:  number
  overall:  number
}

export interface ChanceLogEntry {
  minute:      number
  teamId:      'home' | 'away'
  attackStr:   number
  defenseStr:  number
  momentum:    number
  chanceProb:  number
  goalProb:    number
  roll:        number
  outcome:     'goal' | 'on_target' | 'off_target' | 'blocked' | 'no_chance'
}

// Compile-time guard: SimEventType must remain a subset of MatchEventType.
// If this line errors, a new SimEventType value was added that isn't in MatchEventType.
import type { MatchEventType as _ME } from '@/types'
export type _AssertSimSubset = SimEventType extends _ME ? true : never
