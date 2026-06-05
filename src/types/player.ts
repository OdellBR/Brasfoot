// ============================================================
// PLAYER TYPES
// ============================================================

export type Position =
  | 'GK'
  | 'CB' | 'LB' | 'RB'
  | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM'
  | 'LW' | 'RW'
  | 'ST' | 'CF'

export type Foot = 'right' | 'left' | 'both'

export type PersonalityTrait =
  | 'leader'
  | 'professional'
  | 'temperamental'
  | 'ambitious'
  | 'loyal'
  | 'mercenary'

/** Atributos visíveis (1–20) */
export interface PlayerAttributes {
  finishing:   number
  passing:     number
  speed:       number
  marking:     number
  physicality: number
  technique:   number
  mental:      number
}

/** Atributos ocultos — revelados via scouting */
export interface PlayerHiddenAttributes {
  potential:   number
  consistency: number
  personality: PersonalityTrait
}

/** Estado dinâmico semanal */
export interface PlayerDynamicState {
  morale:               number  // 0–100
  stamina:              number  // 0–100
  form:                 number  // 0–100
  injuryWeeksRemaining: number  // 0 = saudável
}

/** Contrato vigente */
export interface PlayerContract {
  clubId:    string
  salary:    number  // Semanal em R$
  expiresAt: string  // ISO date
  signedAt:  string  // ISO date
}

/** Progresso de revelação via scouting (0–100 por campo) */
export interface ScoutingReveal {
  potential:   number
  consistency: number
  personality: number
}

/** Entidade Jogador */
export interface Player {
  id:                 string
  saveId:             string
  name:               string
  age:                number
  nationality:        'BR'
  position:           Position
  secondaryPosition?: Position
  foot:               Foot
  number:             number
  attributes:         PlayerAttributes
  hidden:             PlayerHiddenAttributes
  dynamicState:       PlayerDynamicState
  contract:           PlayerContract
  scoutingReveal:     ScoutingReveal
}

/**
 * Estatísticas por temporada — tabela separada.
 * Desacoplada do Player para suportar histórico infinito.
 */
export interface PlayerSeasonStats {
  id:            string
  playerId:      string
  seasonId:      string
  clubId:        string
  matches:       number
  goals:         number
  assists:       number
  yellowCards:   number
  redCards:      number
  avgRating:     number
  minutesPlayed: number
}
