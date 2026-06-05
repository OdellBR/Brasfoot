// ============================================================
// SEASON, MANAGER, SAVE e outros tipos de domínio
// ============================================================

/** Uma temporada no save */
export interface Season {
  id:                  string
  saveId:              string
  year:                number
  isActive:            boolean
  startDate:           string  // ISO date
  endDate:             string  // ISO date
  currentDate:         string  // ISO date — data atual no jogo
  currentWeek:         number  // 1–52
  competitionIds:      string[]
  transferWindowOpen:  boolean
}

/** O técnico controlado pelo jogador */
export interface Manager {
  id:         string
  saveId:     string
  name:       string
  clubId:     string
  reputation: number  // 1–100
  career: Array<{
    clubId:   string
    from:     string
    to?:      string
    seasons:  number
    trophies: string[]
  }>
}

/** Slot de save visível na tela inicial */
export interface GameSave {
  id:          string
  slotIndex:   number   // 0, 1 ou 2
  name:        string
  clubId:      string
  clubName:    string
  managerId:   string
  seasonYear:  number
  currentDate: string
  createdAt:   string
  updatedAt:   string
  snapshot: {
    leaguePosition: number
    leaguePoints:   number
    matchesPlayed:  number
    balance:        number
  }
}

// ── Press ────────────────────────────────────────────────────

export type PressEventType =
  | 'win_streak'
  | 'loss_streak'
  | 'board_warning'
  | 'fan_protest'
  | 'player_unhappy'
  | 'youth_breakthrough'
  | 'trophy_won'
  | 'cup_eliminated'
  | 'contract_expiring'
  | 'transfer_rumor'
  | 'injury_crisis'

export interface PressEvent {
  id:       string
  saveId:   string
  seasonId: string
  date:     string
  type:     PressEventType
  headline: string
  body:     string
  isRead:   boolean
  impact?: {
    moraleChange?:          number
    boardConfidenceChange?: number
    fanMoodChange?:         number
  }
}

// ── Transfers ────────────────────────────────────────────────

export type TransferType = 'buy' | 'sell' | 'loan_in' | 'loan_out' | 'free'

export interface Transfer {
  id:         string
  saveId:     string
  seasonId:   string
  date:       string
  type:       TransferType
  playerId:   string
  fromClubId: string
  toClubId:   string
  fee:        number
  salary:     number
}

// ── Scouting ─────────────────────────────────────────────────

export type ScoutRegion =
  | 'sudeste' | 'sul' | 'nordeste' | 'centro_oeste' | 'norte'

export interface ScoutReport {
  id:         string
  saveId:     string
  playerId:   string
  scoutedAt:  string
  region:     ScoutRegion
  reportedAttributes: Partial<import('./player').PlayerAttributes>
  potentialRange?: [number, number]
  notes:      string
  accuracy:   number  // 0–100
}

// ── Training ─────────────────────────────────────────────────

export type TrainingFocus =
  | 'collective'
  | 'attacking'
  | 'defensive'
  | 'physical'
  | 'possession'
  | 'set_pieces'
  | 'recovery'

export interface TrainingSession {
  id:        string
  saveId:    string
  seasonId:  string
  week:      number
  focus:     TrainingFocus
  intensity: 'light' | 'normal' | 'intense'
  effects: Array<{
    playerId:        string
    staminaChange:   number
    formChange:      number
    attributeGain?:  { attribute: keyof import('./player').PlayerAttributes; gain: number }
  }>
}
