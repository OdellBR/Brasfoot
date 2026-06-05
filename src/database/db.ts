// ============================================================
// DATABASE — Dexie Schema
//
// Um banco "brasfootDB", tabelas separadas por entidade.
// IDs são UUIDs (string). Cada entidade carrega saveId para
// isolamento total entre saves diferentes.
//
// Regra de índices Dexie:
//   - Só indexar campos usados em WHERE/orderBy/filter
//   - Compound index: '[a+b]' no schema, .where('[a+b]').equals([a,b])
//   - multiEntry (*campo): para arrays — não usar em Player (squadIds é do Club)
// ============================================================

import Dexie, { type Table } from 'dexie'
import type {
  Player,
  PlayerSeasonStats,
  Club,
  Match,
  Competition,
  Season,
  Manager,
  GameSave,
  PressEvent,
  Transfer,
  ScoutReport,
  TrainingSession,
} from '@/types'

const SCHEMA_VERSION = 1

class BrasfootDatabase extends Dexie {
  saves!:             Table<GameSave>
  seasons!:           Table<Season>
  managers!:          Table<Manager>
  clubs!:             Table<Club>
  players!:           Table<Player>
  playerStats!:       Table<PlayerSeasonStats>
  matches!:           Table<Match>
  competitions!:      Table<Competition>
  pressEvents!:       Table<PressEvent>
  transfers!:         Table<Transfer>
  scoutReports!:      Table<ScoutReport>
  trainingSessions!:  Table<TrainingSession>

  constructor() {
    super('brasfootDB')

    this.version(SCHEMA_VERSION).stores({
      // Formato: 'primaryKey, index1, index2, [compound+index]'
      saves:            'id, slotIndex',
      seasons:          'id, saveId, year',
      managers:         'id, saveId, clubId',
      clubs:            'id, saveId, division',
      // Players indexados por saveId (query principal) e por clubId via contrato
      players:          'id, saveId',
      // Compound index para buscar stats por jogador+temporada em uma query
      playerStats:      'id, playerId, seasonId, [playerId+seasonId]',
      matches:          'id, saveId, seasonId, competitionId, homeClubId, awayClubId, status, scheduledAt',
      competitions:     'id, saveId, seasonId, type',
      pressEvents:      'id, saveId, seasonId, isRead, date',
      transfers:        'id, saveId, seasonId, playerId',
      scoutReports:     'id, saveId, playerId',
      trainingSessions: 'id, saveId, week',
    })
  }
}

export const db = new BrasfootDatabase()

/**
 * Apaga todos os dados de um save específico.
 * Usa transaction para garantir atomicidade.
 */
export async function deleteSave(saveId: string): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.seasons, db.managers, db.clubs, db.players,
      db.playerStats, db.matches, db.competitions,
      db.pressEvents, db.transfers, db.scoutReports,
      db.trainingSessions,
    ],
    async () => {
      await Promise.all([
        db.seasons.where('saveId').equals(saveId).delete(),
        db.managers.where('saveId').equals(saveId).delete(),
        db.clubs.where('saveId').equals(saveId).delete(),
        db.players.where('saveId').equals(saveId).delete(),
        db.matches.where('saveId').equals(saveId).delete(),
        db.competitions.where('saveId').equals(saveId).delete(),
        db.pressEvents.where('saveId').equals(saveId).delete(),
        db.transfers.where('saveId').equals(saveId).delete(),
        db.scoutReports.where('saveId').equals(saveId).delete(),
        db.trainingSessions.where('saveId').equals(saveId).delete(),
        // playerStats não tem saveId — deletar via seasonIds do save
        // (tratado pelo seasonRepository quando implementado)
      ])
    }
  )
  await db.saves.delete(saveId)
}

export default db
