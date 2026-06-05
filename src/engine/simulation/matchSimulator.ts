// ============================================================
// MATCH SIMULATOR
//
// Ponto de entrada da engine. Orquestra os módulos:
//   teamStrength → chanceGenerator → momentum → commentary → playerRating
//
// Contrato:
//   simulateMatch(input) → MatchResult
//
// Determinístico: mesmo seed → mesmo resultado sempre.
// Sem Math.random(). Sem imports de React/Zustand/Dexie.
// ============================================================

import { SeededRandom } from '@/utils/SeededRandom'
import type { MatchInput, MatchResult, SimState, SimEvent, ChanceLogEntry } from './types'
import { calcTeamStrength, mentalityBonus, pressBonus } from './teamStrength'
import { resolveChance } from './chanceGenerator'
import { calcAllRatings } from './playerRating'
import { applyMomentumEvent, applyNaturalDrift, momentumToPossession } from '../momentum/momentum'
import {
  generateGoal, generateMissed, generateSave,
  generatePressure, generateYellow,
  generateHalfTime, generateFullTime,
  type CommentaryCtx,
} from '../commentary/commentary'

// Minutos onde podem ocorrer ações significativas
const EVENT_MINUTES = [
  3, 7, 12, 16, 21, 25, 29, 34, 38, 43,
  48, 52, 56, 61, 65, 70, 74, 78, 82, 87, 90,
]

function pickStarter(
  team: MatchInput['home'],
  position: string | undefined,
  rng: SeededRandom,
) {
  const starters = team.players.filter(p => p.isStarter)
  if (position) {
    const byPos = starters.filter(p => p.position === position)
    if (byPos.length > 0) return rng.pick(byPos)
  }
  return rng.pick(starters)
}

function makeCtx(
  team:      MatchInput['home'],
  state:     SimState,
  rng:       SeededRandom,
  attacker?: string,
  defender?: string,
  assist?:   string,
): CommentaryCtx {
  const keeper = pickStarter(team, 'GK', rng)
  return {
    teamName:      team.name,
    minute:        state.minute,
    scoreHome:     state.scoreHome,
    scoreAway:     state.scoreAway,
    tactics:       team.tactics,
    attackerName:  attacker,
    defenderName:  defender,
    assistName:    assist,
    keeperName:    keeper?.name,
  }
}

function push(state: SimState, event: SimEvent) {
  state.events.push(event)
}

function simulateMinute(
  minute:    number,
  state:     SimState,
  input:     MatchInput,
  homeStr:   ReturnType<typeof calcTeamStrength>,
  awayStr:   ReturnType<typeof calcTeamStrength>,
  rng:       SeededRandom,
  chanceLog: ChanceLogEntry[],
) {
  state.minute = minute

  // Drift do momentum (usa RNG)
  state.momentum = applyNaturalDrift(state.momentum, homeStr, awayStr, rng)

  // Quem ataca neste minuto (influenciado pelo momentum)
  const homeAttackProb  = 0.50 + (state.momentum / 100) * 0.18
  const isHomeAttacking = rng.chance(homeAttackProb)

  const attacking  = isHomeAttacking ? input.home : input.away
  const defending  = isHomeAttacking ? input.away : input.home
  const attStr     = isHomeAttacking ? homeStr : awayStr
  const defStr     = isHomeAttacking ? awayStr : homeStr
  const teamKey    = isHomeAttacking ? 'home' : 'away' as const
  const momentumForTeam = isHomeAttacking ? state.momentum : -state.momentum

  const attacker = pickStarter(attacking, 'ST', rng)
  const defender = pickStarter(defending, 'CB', rng)
  const assister = rng.chance(0.45) ? pickStarter(attacking, 'CAM', rng) : undefined

  const ctx    = makeCtx(attacking, state, rng, attacker?.name, defender?.name, assister?.name)
  const result = resolveChance(attStr, defStr, momentumForTeam, rng)

  // Log para debug
  chanceLog.push({
    minute,
    teamId:      teamKey,
    attackStr:   attStr.attack,
    defenseStr:  defStr.defense,
    momentum:    momentumForTeam,
    chanceProb:  result.chanceProb,
    goalProb:    result.goalProb,
    roll:        result.roll,
    outcome:     result.outcome,
  })

  if (result.outcome === 'blocked') {
    if (rng.chance(0.25)) {
      push(state, {
        minute, type: 'commentary', teamId: teamKey,
        primaryPlayerId: attacker?.id,
        narrative: generatePressure(ctx, rng),
      })
    }
    return
  }

  const sidx = isHomeAttacking ? 0 : 1
  state.shots[sidx]++

  switch (result.outcome) {
    case 'goal': {
      state.shotsOnTarget[sidx]++
      if (isHomeAttacking) state.scoreHome++
      else                 state.scoreAway++

      push(state, {
        minute, type: 'goal', teamId: teamKey,
        primaryPlayerId:   attacker?.id,
        secondaryPlayerId: assister?.id,
        narrative: generateGoal(ctx, rng),
      })
      state.momentum = applyMomentumEvent(state.momentum, isHomeAttacking ? 'goal_home' : 'goal_away')
      break
    }
    case 'on_target': {
      state.shotsOnTarget[sidx]++
      const gkCtx = makeCtx(defending, state, rng)
      push(state, {
        minute, type: 'save', teamId: isHomeAttacking ? 'away' : 'home',
        primaryPlayerId: pickStarter(defending, 'GK', rng)?.id,
        narrative: generateSave({ ...gkCtx, attackerName: attacker?.name }, rng),
      })
      state.momentum = applyMomentumEvent(state.momentum, isHomeAttacking ? 'save_home' : 'save_away')
      break
    }
    case 'off_target': {
      push(state, {
        minute, type: 'missed_chance', teamId: teamKey,
        primaryPlayerId: attacker?.id,
        narrative: generateMissed(ctx, rng),
      })
      state.momentum = applyMomentumEvent(state.momentum, isHomeAttacking ? 'chance_home' : 'chance_away')
      break
    }
  }

  // Cartão amarelo por falta (6% de chance)
  if (rng.chance(0.06)) {
    const foulTeam    = isHomeAttacking ? input.away : input.home
    const foulTeamKey = isHomeAttacking ? 'away' : 'home' as const
    const fouler      = pickStarter(foulTeam, undefined, rng)
    const foulCtx     = makeCtx(foulTeam, state, rng, undefined, fouler?.name)

    push(state, {
      minute, type: 'yellow_card', teamId: foulTeamKey,
      primaryPlayerId: fouler?.id,
      narrative: generateYellow(foulCtx, rng),
    })
    state.yellowCards[foulTeamKey === 'home' ? 0 : 1]++
    state.fouls[foulTeamKey === 'home' ? 0 : 1]++
  }
}

// ── Ponto de entrada público ──────────────────────────────────

export function simulateMatch(input: MatchInput): MatchResult {
  const rng       = new SeededRandom(input.seed)
  const usedSeed  = rng.seed

  // Forças base (determinístico, sem RNG)
  const homeStr = calcTeamStrength(input.home)
  const awayStr = calcTeamStrength(input.away)

  // Vantagem de mando de campo
  homeStr.overall += 0.5
  homeStr.defense += 0.3

  const state: SimState = {
    minute: 0, scoreHome: 0, scoreAway: 0,
    momentum: 5,  // Leve vantagem inicial do mandante
    possession: 'home',
    homeStrength: homeStr.overall,
    awayStrength: awayStr.overall,
    events: [],
    shots: [0, 0], shotsOnTarget: [0, 0],
    corners: [0, 0], fouls: [0, 0],
    yellowCards: [0, 0], redCards: [0, 0],
  }

  const momentumCurve: number[] = []
  const chanceLog: ChanceLogEntry[] = []

  push(state, {
    minute: 0, type: 'commentary', teamId: 'home',
    narrative: `A bola rola! ${input.home.name} recebe ${input.away.name} em casa.`,
  })

  for (let min = 1; min <= 90; min++) {
    if (EVENT_MINUTES.includes(min)) {
      simulateMinute(min, state, input, homeStr, awayStr, rng, chanceLog)
    } else {
      state.momentum = applyNaturalDrift(state.momentum, homeStr, awayStr, rng)
    }

    momentumCurve.push(Math.round(state.momentum))

    if (min === 45) {
      push(state, {
        minute: 45, type: 'commentary', teamId: 'home',
        narrative: generateHalfTime(state.scoreHome, state.scoreAway, input.home.name, input.away.name),
      })
    }
  }

  push(state, {
    minute: 90, type: 'commentary', teamId: 'home',
    narrative: generateFullTime(state.scoreHome, state.scoreAway, input.home.name, input.away.name),
  })

  state.corners = [
    Math.floor(state.shots[0] * 0.4),
    Math.floor(state.shots[1] * 0.4),
  ]

  const avgMomentum   = momentumCurve.reduce((a, b) => a + b, 0) / momentumCurve.length
  const [homePoss, awayPoss] = momentumToPossession(avgMomentum)
  const allPlayers    = [...input.home.players, ...input.away.players]
  const playerRatings = calcAllRatings(allPlayers, state.events, rng)

  // Determine which side the player's club is on
  const playerSide: MatchResult['playerSide'] =
    input.playerClubId === input.home.clubId ? 'home' :
    input.playerClubId === input.away.clubId ? 'away' : null

  return {
    matchId:       input.matchId,
    seed:          usedSeed,
    playerSide,
    scoreHome:     state.scoreHome,
    scoreAway:     state.scoreAway,
    events:        state.events,
    playerRatings,
    momentumCurve,
    stats: {
      possession:    [homePoss, awayPoss],
      shots:         state.shots,
      shotsOnTarget: state.shotsOnTarget,
      corners:       state.corners,
      fouls:         state.fouls,
      yellowCards:   state.yellowCards,
      redCards:      state.redCards,
    },
    debug: {
      seed:         usedSeed,
      homeStrength: homeStr,
      awayStrength: awayStr,
      momentumCurve,
      chanceLog,
      tacticalFactors: {
        homeMentalityBonus:   mentalityBonus(input.home.tactics.mentality),
        awayMentalityBonus:   mentalityBonus(input.away.tactics.mentality),
        homePressBonus:       pressBonus(input.home.tactics.pressIntensity),
        awayPressBonus:       pressBonus(input.away.tactics.pressIntensity),
        homeAdvantageApplied: 0.5,
      },
    },
  }
}
