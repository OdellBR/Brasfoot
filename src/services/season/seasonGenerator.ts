// ============================================================
// SEASON GENERATOR
// ============================================================

import type { Season, Competition, Match, StandingsRow } from '@/types'
import { SeededRandom } from '@/utils/SeededRandom'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function makeRow(clubId: string): StandingsRow {
  return { clubId, played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, goalDiff:0, points:0, form:[] }
}

/**
 * Algoritmo de Berger (round-robin canônico).
 * Mantém times[0] FIXO. Rotaciona times[1..n-1] para a DIREITA a cada rodada.
 * Garante: cada par se encontra exatamente uma vez.
 * Retorna pares [home, away] — metade do campeonato (ida).
 */
function bergerRounds(teams: string[]): Array<Array<[string, string]>> {
  const n      = teams.length % 2 === 0 ? teams.length : teams.length + 1
  const pool   = teams.length % 2 === 0 ? [...teams] : [...teams, 'BYE']
  const rounds: Array<Array<[string, string]>> = []

  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[string, string]> = []
    for (let i = 0; i < n / 2; i++) {
      const home = pool[i]
      const away = pool[n - 1 - i]
      if (home !== 'BYE' && away !== 'BYE') {
        // Alterna quem joga em casa para distribuir melhor
        pairs.push(r % 2 === 0 ? [home, away] : [away, home])
      }
    }
    rounds.push(pairs)

    // Rotação de Berger: fixa pool[0], rotaciona pool[1..n-1] para a DIREITA
    // pool[1..n-1]: [a,b,c,d] → [d,a,b,c]
    const rotating = pool.slice(1)
    rotating.unshift(rotating.pop()!)
    for (let i = 1; i < n; i++) pool[i] = rotating[i - 1]
  }

  return rounds
}

export interface GeneratedSeason {
  season:      Season
  competition: Competition
  matches:     Match[]
}

export function generateSeason(
  saveId:        string,
  year:          number,
  clubIds:       string[],
  playerClubId?: string,
): GeneratedSeason {
  const seasonId      = crypto.randomUUID()
  const competitionId = crypto.randomUUID()
  const startDate     = `${year}-03-01`
  const endDate       = `${year}-11-30`

  // Embaralha a ordem dos clubes para variar quem joga com quem nas primeiras rodadas
  const rng      = new SeededRandom(year ^ saveId.charCodeAt(0))
  const shuffled = rng.shuffle(clubIds)

  const firstLeg  = bergerRounds(shuffled)
  // Volta: inverte home/away de cada jogo, mas mantém a mesma ordem de rodadas
  const secondLeg = firstLeg.map(round =>
    round.map(([h, a]) => [a, h] as [string, string])
  )
  const allRounds = [...firstLeg, ...secondLeg]

  // Verifica integridade: cada clube deve aparecer em cada rodada exatamente uma vez
  // (exceto BYE quando n é ímpar — não aplicável com 12 clubes)

  const matches: Match[] = []
  allRounds.forEach((round, roundIdx) => {
    const roundDate = addDays(startDate, roundIdx * 7)
    round.forEach(([homeId, awayId]) => {
      matches.push({
        id:            crypto.randomUUID(),
        saveId,
        seasonId,
        competitionId,
        round:         roundIdx + 1,
        scheduledAt:   roundDate,
        status:        'scheduled',
        homeClubId:    homeId,
        awayClubId:    awayId,
        score:         { home: 0, away: 0 },
        events:        [],
        isPlayerMatch: playerClubId
          ? homeId === playerClubId || awayId === playerClubId
          : false,
      })
    })
  })

  const season: Season = {
    id: seasonId, saveId, year, isActive: true,
    startDate, endDate, currentDate: startDate,
    currentWeek: 1, competitionIds: [competitionId],
    transferWindowOpen: true,
  }

  const competition: Competition = {
    id: competitionId, saveId, seasonId,
    name: 'Liga Nacional', shortName: 'LN',
    type: 'liga', format: 'league',
    clubIds: shuffled,
    standings: shuffled.map(makeRow),
    currentRound: 1,
    totalRounds: allRounds.length,
    isActive: true,
  }

  return { season, competition, matches }
}

// Utilitário: valida o calendário gerado (usado no debug panel)
export function validateCalendar(matches: Match[], clubIds: string[]): {
  ok: boolean
  errors: string[]
} {
  const errors: string[] = []
  const totalRounds = Math.max(...matches.map(m => m.round))

  for (let r = 1; r <= totalRounds; r++) {
    const roundMatches = matches.filter(m => m.round === r)
    const seen = new Set<string>()
    for (const m of roundMatches) {
      if (seen.has(m.homeClubId)) errors.push(`Rodada ${r}: ${m.homeClubId} aparece 2x`)
      if (seen.has(m.awayClubId)) errors.push(`Rodada ${r}: ${m.awayClubId} aparece 2x`)
      seen.add(m.homeClubId)
      seen.add(m.awayClubId)
    }
    const expected = Math.floor(clubIds.length / 2)
    if (roundMatches.length !== expected) {
      errors.push(`Rodada ${r}: ${roundMatches.length} jogos (esperado ${expected})`)
    }
  }

  // Verifica que cada par se enfrenta exatamente 2 vezes (home e away)
  const pairCount = new Map<string, number>()
  for (const m of matches) {
    const key = [m.homeClubId, m.awayClubId].sort().join('|')
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1)
  }
  for (const [pair, count] of pairCount) {
    if (count !== 2) errors.push(`Par ${pair}: ${count} jogos (esperado 2)`)
  }

  return { ok: errors.length === 0, errors }
}
