// ============================================================
// GAME SERVICE
// ============================================================

import { db }              from '@/database/db'
import { clubRepository }  from '@/database/repositories/clubRepository'
import { playerRepository } from '@/database/repositories/playerRepository'
import { saveRepository }   from '@/database/repositories/saveRepository'
import { generateWorld }    from './generator/worldGenerator'
import { generateSeason }   from './season/seasonGenerator'
import type { ClubTemplate } from '@/data/clubs'
import type { GameSave, Manager } from '@/types'

const SEASON_YEAR = 2025

export interface CreateCareerResult {
  saveId:    string
  clubId:    string
  managerId: string
}

/**
 * Cria uma nova carreira.
 *
 * Mobile-safe: a transação monolítica original (~500 writes) trava o
 * JS thread por >500ms no Android, o que faz o OS cancelar o touch event
 * e o usuário não vê nenhum feedback. Solução:
 *
 *   1. Gerar todos os dados em memória (puro JS, rápido)
 *   2. Gravar em 3 transações menores sequenciais:
 *      - Tx1: save + manager + clubes (pequeno, ~22 rows)
 *      - Tx2: jogadores em chunks de 50 (440 rows, nunca > 50 por vez)
 *      - Tx3: temporada + competição + partidas (~140 rows)
 *
 *   Cada transação individual fica abaixo de 100ms no Android.
 */
export async function createNewCareer(
  template:    ClubTemplate,
  managerName: string,
): Promise<CreateCareerResult> {

  const saveId    = crypto.randomUUID()
  const managerId = crypto.randomUUID()

  // ── Geração em memória (sem IO) ───────────────────────────
  const { clubs, players } = generateWorld(saveId, SEASON_YEAR)

  const playerClub = clubs.find(c => c.name === template.name)
  if (!playerClub) throw new Error(`Clube "${template.name}" não encontrado`)

  playerClub.managerId = managerId

  const serieAIds = clubs.filter(c => c.division === 'primeira').map(c => c.id)
  const { season, competition, matches } = generateSeason(saveId, SEASON_YEAR, serieAIds, playerClub.id)

  const manager: Manager = {
    id: managerId, saveId, name: managerName,
    clubId: playerClub.id, reputation: 30, career: [],
  }

  const slotIndex = await getNextSlotIndex()

  const gameSave: GameSave = {
    id:          saveId,
    slotIndex,
    name:        `${template.name} ${SEASON_YEAR}`,
    clubId:      playerClub.id,
    clubName:    playerClub.name,
    managerId,
    seasonYear:  SEASON_YEAR,
    currentDate: season.startDate,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
    snapshot: {
      leaguePosition: 1,
      leaguePoints:   0,
      matchesPlayed:  0,
      balance:        playerClub.finances.balance,
    },
  }

  // ── Tx 1: metadados leves ────────────────────────────────
  await db.transaction('rw', [db.saves, db.managers, db.clubs], async () => {
    await db.saves.put(gameSave)
    await db.managers.put(manager)
    await clubRepository.bulkPut(clubs)
  })

  // ── Tx 2: jogadores em chunks de 50 ──────────────────────
  // Cada chunk é uma transação independente — nunca bloqueia > ~80ms no Android
  const CHUNK = 50
  for (let i = 0; i < players.length; i += CHUNK) {
    const chunk = players.slice(i, i + CHUNK)
    await db.transaction('rw', [db.players], async () => {
      await playerRepository.bulkPut(chunk)
    })
  }

  // ── Tx 3: temporada + calendário ─────────────────────────
  await db.transaction('rw', [db.seasons, db.competitions, db.matches], async () => {
    await db.seasons.put(season)
    await db.competitions.put(competition)
    await db.matches.bulkPut(matches)
  })

  return { saveId, clubId: playerClub.id, managerId }
}

export async function loadSave(saveId: string): Promise<{ save: GameSave; manager: Manager; clubId: string }> {
  const save = await saveRepository.getById(saveId)
  if (!save) throw new Error(`Save ${saveId} não encontrado`)
  const manager = await db.managers.where('saveId').equals(saveId).first()
  if (!manager) throw new Error(`Manager não encontrado`)
  return { save, manager, clubId: save.clubId }
}

async function getNextSlotIndex(): Promise<number> {
  const saves = await saveRepository.list()
  const used  = new Set(saves.map(s => s.slotIndex))
  for (let i = 0; i < 3; i++) {
    if (!used.has(i)) return i
  }
  throw new Error('Todos os slots estão ocupados')
}
