// ============================================================
// TEAM STRENGTH CALCULATOR
//
// Função pura — sem side effects, sem RNG.
// Calcula a força de um time a partir de jogadores + tática.
// Retorna um breakdown detalhado usado pela engine e pelo debug.
// ============================================================

import type { EngineTeam, TeamStrengthSnapshot } from './types'
import { playerOverall, average, clamp } from '@/utils'

export type { TeamStrengthSnapshot }

/** Bônus de mentalidade (puro — sem RNG) */
export function mentalityBonus(
  mentality: EngineTeam['tactics']['mentality']
): { attack: number; defense: number } {
  const map: Record<string, { attack: number; defense: number }> = {
    very_defensive: { attack: -1.5, defense: +1.5 },
    defensive:      { attack: -0.8, defense: +0.8 },
    balanced:       { attack:  0.0, defense:  0.0 },
    attacking:      { attack: +0.8, defense: -0.8 },
    very_attacking: { attack: +1.5, defense: -1.5 },
  }
  return map[mentality] ?? { attack: 0, defense: 0 }
}

/** Bônus de pressão (puro — sem RNG) */
export function pressBonus(
  press: EngineTeam['tactics']['pressIntensity']
): number {
  const map: Record<string, number> = {
    very_high: 0.8,
    high:      0.5,
    medium:    0.2,
    low:       0.0,
  }
  return map[press] ?? 0
}

/** Média de overall dos jogadores titulares de certas posições */
function avgOverallByPositions(
  team:      EngineTeam,
  positions: string[]
): number {
  const starters = team.players.filter(
    p => p.isStarter && positions.some(pos => p.position === pos)
  )
  if (starters.length === 0) return 10

  const overalls = starters.map(p => {
    const base              = playerOverall(p.attributes, p.position)
    const moraleMultiplier  = 0.90 + (p.dynamicState.morale  / 100) * 0.20
    const staminaMultiplier = 0.85 + (p.dynamicState.stamina / 100) * 0.15
    return base * moraleMultiplier * staminaMultiplier
  })

  return average(overalls)
}

const ATTACK_POSITIONS   = ['ST', 'CF', 'LW', 'RW', 'CAM']
const MIDFIELD_POSITIONS = ['CM', 'CDM', 'LM', 'RM']
const DEFENSE_POSITIONS  = ['CB', 'LB', 'RB', 'GK']

/**
 * Calcula o breakdown de força de um time.
 * Determinístico — sem RNG.
 */
export function calcTeamStrength(team: EngineTeam): TeamStrengthSnapshot {
  const rawAttack   = avgOverallByPositions(team, ATTACK_POSITIONS)
  const rawMidfield = avgOverallByPositions(team, MIDFIELD_POSITIONS)
  const rawDefense  = avgOverallByPositions(team, DEFENSE_POSITIONS)

  const mBonus  = mentalityBonus(team.tactics.mentality)
  const pBonus  = pressBonus(team.tactics.pressIntensity)

  const attack   = clamp(rawAttack   + mBonus.attack,  1, 20)
  const midfield = clamp(rawMidfield + pBonus,          1, 20)
  const defense  = clamp(rawDefense  + mBonus.defense,  1, 20)
  const overall  = attack * 0.35 + midfield * 0.35 + defense * 0.30

  return { attack, midfield, defense, overall }
}
