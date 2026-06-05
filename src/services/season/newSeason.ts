// ============================================================
// NEW SEASON SERVICE
//
// Cria uma nova temporada mantendo o mesmo save.
// Mobile-safe: transações splitadas (mesmo padrão do createNewCareer).
// ============================================================

import { db }             from '@/database/db'
import { generateSeason } from './seasonGenerator'

export interface NewSeasonResult {
  seasonId:      string
  competitionId: string
}

export async function startNewSeason(
  saveId:       string,
  playerClubId: string,
  currentYear:  number,
): Promise<NewSeasonResult> {
  const nextYear = currentYear + 1

  const clubs     = await db.clubs.where('saveId').equals(saveId).toArray()
  const serieAIds = clubs.filter(c => c.division === 'primeira').map(c => c.id)

  const { season, competition, matches } = generateSeason(
    saveId, nextYear, serieAIds, playerClubId,
  )

  const allPlayers = await db.players.where('saveId').equals(saveId).toArray()

  const resetPlayers = allPlayers.map(p => ({
    ...p,
    age: p.age + 1,
    dynamicState: { morale: 70, stamina: 100, form: 50, injuryWeeksRemaining: 0 },
  }))

  const resetClubs = clubs.map(c => ({
    ...c,
    dynamicState: { morale: 70, boardConfidence: 65, fanMood: 65, currentStreak: 0 },
  }))

  // ── Tx 1: season skeleton (leve) ────────────────────────
  await db.transaction('rw', [db.seasons, db.competitions, db.saves], async () => {
    await db.seasons.put(season)
    await db.competitions.put(competition)
    await db.saves.update(saveId, {
      seasonYear:  nextYear,
      currentDate: season.startDate,
      updatedAt:   new Date().toISOString(),
      snapshot:    { leaguePosition: 1, leaguePoints: 0, matchesPlayed: 0, balance: 0 },
    })
  })

  // ── Tx 2: matches (~132 rows) ────────────────────────────
  await db.transaction('rw', [db.matches], async () => {
    await db.matches.bulkPut(matches)
  })

  // ── Tx 3: clubes reset ───────────────────────────────────
  await db.transaction('rw', [db.clubs], async () => {
    await db.clubs.bulkPut(resetClubs)
  })

  // ── Tx 4: jogadores em chunks de 50 ─────────────────────
  const CHUNK = 50
  for (let i = 0; i < resetPlayers.length; i += CHUNK) {
    await db.transaction('rw', [db.players], async () => {
      await db.players.bulkPut(resetPlayers.slice(i, i + CHUNK))
    })
  }

  return { seasonId: season.id, competitionId: competition.id }
}
