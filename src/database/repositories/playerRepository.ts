// ============================================================
// PLAYER REPOSITORY
// Responsabilidade: acesso a dados de jogadores e stats.
// Não contém lógica de negócio.
// ============================================================

import { db } from '../db'
import type { Player, PlayerSeasonStats } from '@/types'

export const playerRepository = {

  async getBySaveId(saveId: string): Promise<Player[]> {
    return db.players.where('saveId').equals(saveId).toArray()
  },

  async getById(id: string): Promise<Player | undefined> {
    return db.players.get(id)
  },

  async getByIds(ids: string[]): Promise<Player[]> {
    const results = await db.players.bulkGet(ids)
    return results.filter((p): p is Player => p !== undefined)
  },

  async bulkPut(players: Player[]): Promise<void> {
    await db.players.bulkPut(players)
  },

  async put(player: Player): Promise<void> {
    await db.players.put(player)
  },

  async updateDynamicState(
    id: string,
    patch: Partial<Player['dynamicState']>
  ): Promise<void> {
    const player = await db.players.get(id)
    if (!player) return
    await db.players.put({
      ...player,
      dynamicState: { ...player.dynamicState, ...patch },
    })
  },

  // ── Stats ────────────────────────────────────────────────

  async getStatsByPlayerAndSeason(
    playerId: string,
    seasonId: string
  ): Promise<PlayerSeasonStats | undefined> {
    // Usa compound index [playerId+seasonId] definido no schema
    return db.playerStats
      .where('[playerId+seasonId]')
      .equals([playerId, seasonId])
      .first()
  },

  async getStatsBySeason(seasonId: string): Promise<PlayerSeasonStats[]> {
    return db.playerStats.where('seasonId').equals(seasonId).toArray()
  },

  async putStats(stats: PlayerSeasonStats): Promise<void> {
    await db.playerStats.put(stats)
  },

  async bulkPutStats(stats: PlayerSeasonStats[]): Promise<void> {
    await db.playerStats.bulkPut(stats)
  },
}
