// ============================================================
// ADVANCE ROUND
//
// Simula todas as partidas de uma rodada e persiste resultados.
//
// Regra crítica de standings:
//   SEMPRE lê do banco antes de acumular — nunca confia no
//   snapshot do store, que pode estar desatualizado.
// ============================================================

import { db }                  from '@/database/db'
import { playerRepository }    from '@/database/repositories/playerRepository'
import { simulateMatch }       from '@/engine/simulation/matchSimulator'
import type { EngineTeam, MatchResult } from '@/engine/simulation/types'
import type { Match, StandingsRow, MatchEventType, PlayerAttributes } from '@/types'
import type { SimpleTactics }  from '@/store/useGameStore'

// ── Helpers internos ──────────────────────────────────────────

function tacticToEngine(t: SimpleTactics): EngineTeam['tactics'] {
  return {
    formation:     t.formation,
    mentality:     t.style === 'attacking' ? 'attacking' : t.style === 'defensive' ? 'defensive' : 'balanced',
    pressIntensity:t.rhythm === 'press' ? 'high' : t.rhythm === 'slow' ? 'low' : 'medium',
    tempo:         t.rhythm === 'press' ? 'fast' : t.rhythm === 'slow' ? 'slow' : 'normal',
    defensiveLine: t.style === 'defensive' ? 'deep' : t.style === 'attacking' ? 'high' : 'normal',
    attackFocus:   'mixed',
  }
}

const FORMATION_SLOTS: Record<string, string[]> = {
  '4-4-2':   ['GK','CB','CB','LB','RB','LM','CM','CM','RM','ST','ST'],
  '4-3-3':   ['GK','CB','CB','LB','RB','CDM','CM','CM','LW','RW','ST'],
  '4-2-3-1': ['GK','CB','CB','LB','RB','CDM','CDM','LM','CAM','RM','ST'],
  '5-3-2':   ['GK','CB','CB','CB','LB','RB','CM','CM','CM','ST','ST'],
}

function playerOvr(attrs: PlayerAttributes): number {
  const { finishing, passing, speed, marking, physicality, technique, mental } = attrs
  return (finishing + passing + speed + marking + physicality + technique + mental) / 7
}

function autoLineup(
  players: Awaited<ReturnType<typeof playerRepository.getByIds>>,
  tactics: EngineTeam['tactics'],
): EngineTeam['players'] {
  const slots     = FORMATION_SLOTS[tactics.formation] ?? FORMATION_SLOTS['4-3-3']
  const available = players.filter(p => p.dynamicState.injuryWeeksRemaining === 0)
  const used      = new Set<string>()
  const starters: typeof players = []

  for (const slot of slots) {
    const match = available
      .filter(p => !used.has(p.id) && (p.position === slot || p.secondaryPosition === slot))
      .sort((a, b) => playerOvr(b.attributes) - playerOvr(a.attributes))[0]

    const pick = match ?? available
      .filter(p => !used.has(p.id))
      .sort((a, b) => playerOvr(b.attributes) - playerOvr(a.attributes))[0]

    if (pick) { starters.push(pick); used.add(pick.id) }
  }

  return starters.map(p => ({
    id: p.id, name: p.name, position: p.position,
    attributes: p.attributes, dynamicState: p.dynamicState,
    isStarter: true,
  }))
}

// Acumula resultado de UMA partida nos standings existentes
function accumulateResult(
  standings: StandingsRow[],
  homeId:    string,
  awayId:    string,
  gHome:     number,
  gAway:     number,
): StandingsRow[] {
  return standings.map(row => {
    const isH = row.clubId === homeId
    const isA = row.clubId === awayId
    if (!isH && !isA) return row

    const scored   = isH ? gHome : gAway
    const conceded = isH ? gAway : gHome
    const won      = scored > conceded
    const draw     = scored === conceded
    const form     = [...row.form, won ? 'W' : draw ? 'D' : 'L'].slice(-5) as StandingsRow['form']

    return {
      ...row,
      played:       row.played + 1,
      won:          row.won    + (won        ? 1 : 0),
      drawn:        row.drawn  + (draw       ? 1 : 0),
      lost:         row.lost   + (!won&&!draw? 1 : 0),
      goalsFor:     row.goalsFor    + scored,
      goalsAgainst: row.goalsAgainst + conceded,
      goalDiff:     row.goalDiff + scored - conceded,
      points:       row.points + (won ? 3 : draw ? 1 : 0),
      form,
    }
  })
}

function sortStandings(rows: StandingsRow[]): StandingsRow[] {
  return [...rows].sort((a, b) =>
    b.points    - a.points    ||
    b.goalDiff  - a.goalDiff  ||
    b.goalsFor  - a.goalsFor
  )
}

// ── Export principal ──────────────────────────────────────────

export interface AdvanceRoundResult {
  playerMatchResult: MatchResult | null
  roundSimulated:    number
  matchesPlayed:     number
  isSeasonOver:      boolean
}

export async function advanceRound(
  saveId:       string,
  playerClubId: string,
  tactics:      SimpleTactics,
): Promise<AdvanceRoundResult> {

  // 1. Lê competition E season SEMPRE do banco — nunca do store
  const competition = await db.competitions
    .where('saveId').equals(saveId)
    .filter(c => c.isActive)
    .first()

  const season = await db.seasons
    .where('saveId').equals(saveId)
    .filter(s => s.isActive)
    .first()

  if (!competition || !season) throw new Error('Competição ou temporada não encontrada')

  const round = competition.currentRound

  // Temporada encerrada?
  if (round > competition.totalRounds) {
    return { playerMatchResult: null, roundSimulated: round, matchesPlayed: 0, isSeasonOver: true }
  }

  // 2. Busca partidas desta rodada
  const roundMatches = await db.matches
    .where('saveId').equals(saveId)
    .filter(m => m.round === round && m.status === 'scheduled')
    .toArray()

  if (roundMatches.length === 0) {
    return { playerMatchResult: null, roundSimulated: round, matchesPlayed: 0, isSeasonOver: false }
  }

  // 3. Pré-carrega clubes e jogadores
  const allClubs   = await db.clubs.where('saveId').equals(saveId).toArray()
  const clubMap    = new Map(allClubs.map(c => [c.id, c]))
  const allPlayers = await playerRepository.getByIds(allClubs.flatMap(c => c.squadIds))

  const playersByClub = new Map<string, typeof allPlayers>()
  for (const p of allPlayers) {
    const arr = playersByClub.get(p.contract.clubId) ?? []
    arr.push(p)
    playersByClub.set(p.contract.clubId, arr)
  }

  const engineTactics = tacticToEngine(tactics)
  const neutralTactics: EngineTeam['tactics'] = { ...engineTactics, mentality: 'balanced', pressIntensity: 'medium' }

  // 4. Simula cada partida acumulando standings em memória
  // standings começa do banco (frescos), não do store
  let standings = competition.standings ?? []

  let playerMatchResult: MatchResult | null = null
  const updatedMatches: Match[] = []

  for (const match of roundMatches) {
    const homeIsPlayer = match.homeClubId === playerClubId
    const awayIsPlayer = match.awayClubId === playerClubId
    const isPlayerMatch = homeIsPlayer || awayIsPlayer

    const homeTactics = homeIsPlayer ? engineTactics : neutralTactics
    const awayTactics = awayIsPlayer ? engineTactics : neutralTactics

    const homeTeam: EngineTeam = {
      clubId:  match.homeClubId,
      name:    clubMap.get(match.homeClubId)?.name ?? 'Home',
      players: autoLineup(playersByClub.get(match.homeClubId) ?? [], homeTactics),
      tactics: homeTactics,
      isHome:  true,
    }
    const awayTeam: EngineTeam = {
      clubId:  match.awayClubId,
      name:    clubMap.get(match.awayClubId)?.name ?? 'Away',
      players: autoLineup(playersByClub.get(match.awayClubId) ?? [], awayTactics),
      tactics: awayTactics,
      isHome:  false,
    }

    const result = simulateMatch({ matchId: match.id, home: homeTeam, away: awayTeam, playerClubId })

    if (isPlayerMatch) playerMatchResult = result

    // Acumula em memória (sem write por partida — tudo numa transação só no final)
    standings = accumulateResult(standings, match.homeClubId, match.awayClubId, result.scoreHome, result.scoreAway)

    updatedMatches.push({
      ...match,
      status:        'completed',
      isPlayerMatch,
      score:         { home: result.scoreHome, away: result.scoreAway },
      events:        result.events.map((e, i) => ({
        id:                String(i),
        minute:            e.minute,
        type:              e.type as MatchEventType,
        primaryPlayerId:   e.primaryPlayerId,
        secondaryPlayerId: e.secondaryPlayerId,
        clubId:            e.teamId === 'home' ? match.homeClubId : match.awayClubId,
        narrative:         e.narrative,
      })),
      stats:         result.stats,
      playerRatings: result.playerRatings,
      momentumCurve: result.momentumCurve,
    })
  }

  // 5. Persiste tudo numa única transação
  const sortedStandings = sortStandings(standings)
  const nextRound       = round + 1
  const nextDate        = addDays(roundMatches[0].scheduledAt, 7)
  const isSeasonOver    = nextRound > competition.totalRounds

  const playerRow = sortedStandings.findIndex(r => r.clubId === playerClubId)
  const playerSt  = sortedStandings[playerRow]

  await db.transaction('rw', [db.matches, db.competitions, db.seasons, db.saves], async () => {
    await db.matches.bulkPut(updatedMatches)
    await db.competitions.update(competition.id, {
      standings:    sortedStandings,
      currentRound: nextRound,
      isActive:     !isSeasonOver,
    })
    await db.seasons.update(season.id, {
      currentDate:  nextDate,
      currentWeek:  season.currentWeek + 1,
      isActive:     !isSeasonOver,
    })
    await db.saves.update(saveId, {
      updatedAt:    new Date().toISOString(),
      currentDate:  nextDate,
      snapshot: {
        leaguePosition: playerRow + 1,
        leaguePoints:   playerSt?.points ?? 0,
        matchesPlayed:  playerSt?.played ?? 0,
        balance:        0,
      },
    })
  })

  return { playerMatchResult, roundSimulated: round, matchesPlayed: updatedMatches.length, isSeasonOver }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
