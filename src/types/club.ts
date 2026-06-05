// ============================================================
// CLUB TYPES
// ============================================================

export type Division = 'primeira' | 'segunda'

/**
 * Finanças do clube — snapshot semanal
 */
export interface ClubFinances {
  balance:        number   // Saldo atual em R$
  transferBudget: number   // Orçamento de contratações
  wageBudget:     number   // Teto semanal de salários
  weeklyWages:    number   // Folha atual (calculado da soma dos contratos)
  sponsorIncome:  number   // Receita de patrocinadores por semana
  matchdayIncome: number   // Receita média de bilheteria por jogo em casa
  debt:           number   // Dívida total
}

/**
 * Reputação e infraestrutura do clube
 */
export interface ClubReputation {
  national:    number   // 1–20
  regional:    number   // 1–20
  fanbase:     number   // Torcida estimada (em milhares)
  stadiumSize: number   // Capacidade do estádio
}

/**
 * Estado dinâmico do clube — muda ao longo da temporada.
 * Nomeado 'dynamicState' para evitar colisão com 'uf' (sigla do estado brasileiro).
 */
export interface ClubDynamicState {
  morale:          number   // 0–100
  boardConfidence: number   // 0–100
  fanMood:         number   // 0–100
  currentStreak:   number   // >0 = invicto, <0 = sequência de derrotas
}

/**
 * Objetivo da diretoria para a temporada
 */
export interface BoardObjective {
  type:            'finish_position' | 'avoid_relegation' | 'win_cup' | 'qualify_copa'
  description:     string
  targetPosition?: number
  competitionId?:  string
  isAchieved:      boolean
  isCritical:      boolean   // Se não cumprir = demissão imediata
}

/**
 * Entidade Clube.
 * 'uf' para a sigla do estado brasileiro (SP, RJ…),
 * 'dynamicState' para o estado mutável em jogo.
 */
export interface Club {
  id:           string
  saveId:       string
  name:         string
  shortName:    string
  fullName:     string
  city:         string
  uf:           string           // Sigla do estado: SP, RJ, MG...
  colors: {
    primary:    string
    secondary:  string
  }
  division:     Division
  reputation:   ClubReputation
  finances:     ClubFinances
  dynamicState: ClubDynamicState
  boardObjectives: BoardObjective[]
  managerId:    string | null
  squadIds:     string[]
  youthIds:     string[]
}
