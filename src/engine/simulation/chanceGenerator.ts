// ============================================================
// CHANCE GENERATOR — Resolve uma jogada ofensiva
// Função pura: recebe forças + RNG, retorna outcome.
// Sem Math.random() — usa SeededRandom injetado.
// ============================================================

import type { SeededRandom } from '@/utils/SeededRandom'
import type { TeamStrengthSnapshot } from './teamStrength'

export type ChanceOutcome = 'goal' | 'on_target' | 'off_target' | 'blocked'

export interface ChanceResult {
  outcome:    ChanceOutcome
  chanceProb: number   // Prob calculada (para debug)
  goalProb:   number   // Prob calculada (para debug)
  roll:       number   // Valor sorteado (para debug)
}

/** Prob de gerar chance dado ataque vs defesa */
function calcChanceProb(attack: number, defense: number, momentum: number): number {
  const strengthDiff  = (attack - defense) / 20           // -1 a +1
  const momentumBonus = (momentum / 100) * 0.06           // ±6%
  return Math.max(0.15, Math.min(0.55, 0.35 + strengthDiff * 0.15 + momentumBonus))
}

/** Prob de gol dado que houve chute */
function calcGoalProb(attack: number, defense: number, momentum: number): number {
  const strengthDiff  = (attack - defense) / 20
  const momentumBonus = (momentum / 100) * 0.04
  return Math.max(0.08, Math.min(0.38, 0.22 + strengthDiff * 0.12 + momentumBonus))
}

export function resolveChance(
  attacking: TeamStrengthSnapshot,
  defending: TeamStrengthSnapshot,
  momentum:  number,
  rng:       SeededRandom,
): ChanceResult {
  const chanceProb = calcChanceProb(attacking.attack, defending.defense, momentum)
  const roll       = rng.next()

  if (roll >= chanceProb) {
    return { outcome: 'blocked', chanceProb, goalProb: 0, roll }
  }

  const goalProb = calcGoalProb(attacking.attack, defending.defense, momentum)
  const roll2    = rng.next()

  if (roll2 < goalProb) {
    return { outcome: 'goal',      chanceProb, goalProb, roll: roll2 }
  } else if (roll2 < goalProb + 0.35) {
    return { outcome: 'on_target', chanceProb, goalProb, roll: roll2 }
  } else {
    return { outcome: 'off_target',chanceProb, goalProb, roll: roll2 }
  }
}
