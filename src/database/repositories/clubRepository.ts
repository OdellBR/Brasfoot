// ============================================================
// CLUB REPOSITORY
// ============================================================

import { db } from '../db'
import type { Club } from '@/types'

export const clubRepository = {

  async getBySaveId(saveId: string): Promise<Club[]> {
    return db.clubs.where('saveId').equals(saveId).toArray()
  },

  async getById(id: string): Promise<Club | undefined> {
    return db.clubs.get(id)
  },

  async bulkPut(clubs: Club[]): Promise<void> {
    await db.clubs.bulkPut(clubs)
  },

  async put(club: Club): Promise<void> {
    await db.clubs.put(club)
  },

  async updateDynamicState(
    id: string,
    patch: Partial<Club['dynamicState']>
  ): Promise<void> {
    const club = await db.clubs.get(id)
    if (!club) return
    await db.clubs.put({
      ...club,
      dynamicState: { ...club.dynamicState, ...patch },
    })
  },

  async updateFinances(
    id: string,
    patch: Partial<Club['finances']>
  ): Promise<void> {
    const club = await db.clubs.get(id)
    if (!club) return
    await db.clubs.put({
      ...club,
      finances: { ...club.finances, ...patch },
    })
  },
}
