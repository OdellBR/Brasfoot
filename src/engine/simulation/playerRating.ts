// ============================================================
// PLAYER RATING — Calcula rating pós-jogo (0–10)
// Função pura: eventos + jogador → número.
// RNG para pequena variação — sem Math.random().
// ============================================================

import { clamp } from '@/utils'
import type { SeededRandom } from '@/utils/SeededRandom'
import type { SimEvent, EnginePlayer } from './types'

function countEvents(playerId: string, events: SimEvent[]) {
  let goals = 0, assists = 0, saves = 0, yellows = 0, reds = 0
  for (const e of events) {
    if (e.primaryPlayerId === playerId) {
      if (e.type === 'goal')        goals++
      if (e.type === 'save')        saves++
      if (e.type === 'yellow_card') yellows++
      if (e.type === 'red_card')    reds++
    }
    if (e.secondaryPlayerId === playerId && e.type === 'goal') assists++
  }
  return { goals, assists, saves, yellows, reds }
}

export function calcPlayerRating(
  player: EnginePlayer,
  events: SimEvent[],
  rng:    SeededRandom,
): number {
  // Base: 5.5–7.0 dependendo do mental e form
  const base   = 5.5 + (player.attributes.mental / 20) * 0.8
                     + (player.dynamicState.form   / 100) * 0.7
  const counts = countEvents(player.id, events)

  let rating = base
  rating += counts.goals   * 1.2
  rating += counts.assists * 0.7
  rating += counts.saves   * 0.8
  rating -= counts.yellows * 0.5
  rating -= counts.reds    * 2.5

  // Variação pequena (±0.3)
  rating += (rng.next() - 0.5) * 0.6

  return Math.round(clamp(rating, 3.0, 10.0) * 10) / 10
}

export function calcAllRatings(
  players: EnginePlayer[],
  events:  SimEvent[],
  rng:     SeededRandom,
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const p of players) {
    if (p.isStarter) result[p.id] = calcPlayerRating(p, events, rng)
  }
  return result
}
