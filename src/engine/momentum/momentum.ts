// ============================================================
// MOMENTUM — Puro, sem RNG
// Determina o fluxo da partida. Afeta probabilidades de chance.
// ============================================================

import { clamp } from '@/utils'
import type { SeededRandom } from '@/utils/SeededRandom'
import type { TeamStrengthSnapshot } from '@/engine/simulation/teamStrength'

export type MomentumEvent =
  | 'goal_home' | 'goal_away'
  | 'chance_home' | 'chance_away'
  | 'save_home' | 'save_away'

const SWING: Record<MomentumEvent, number> = {
  goal_home:   +25,
  goal_away:   -25,
  chance_home: +5,
  chance_away: -5,
  save_home:   -8,   // Goleiro do home salvou = away estava pressionando
  save_away:   +8,
}

/** Aplica impacto de um evento no momentum */
export function applyMomentumEvent(current: number, event: MomentumEvent): number {
  return clamp(current + SWING[event], -100, 100)
}

/**
 * Drift natural: puxão suave em direção à vantagem de força,
 * mais ruído controlado via RNG.
 */
export function applyNaturalDrift(
  current:  number,
  home:     TeamStrengthSnapshot,
  away:     TeamStrengthSnapshot,
  rng:      SeededRandom,
): number {
  const bias  = (home.overall - away.overall) * 0.4   // -8 a +8 tipicamente
  const pull  = (bias - current) * 0.05               // Gradual, não instantâneo
  const noise = (rng.next() - 0.5) * 10               // ±5 de ruído
  return clamp(current + pull + noise, -100, 100)
}

/** Converte momentum médio para percentual de posse */
export function momentumToPossession(avgMomentum: number): [number, number] {
  const home = clamp(50 + avgMomentum * 0.15, 30, 70)
  return [Math.round(home), Math.round(100 - home)]
}
