// ============================================================
// SAVE REPOSITORY
// Responsabilidade única: CRUD de GameSave slots
// ============================================================

import { db } from '../db'
import type { GameSave } from '@/types'

const MAX_SLOTS = 3

export const saveRepository = {
  async list(): Promise<GameSave[]> {
    return db.saves.orderBy('slotIndex').toArray()
  },

  async getById(id: string): Promise<GameSave | undefined> {
    return db.saves.get(id)
  },

  async getBySlot(slotIndex: number): Promise<GameSave | undefined> {
    return db.saves.where('slotIndex').equals(slotIndex).first()
  },

  async upsert(save: GameSave): Promise<void> {
    await db.saves.put(save)
  },

  async updateSnapshot(
    id: string,
    snapshot: GameSave['snapshot'],
    currentDate: string
  ): Promise<void> {
    await db.saves.update(id, {
      snapshot,
      currentDate,
      updatedAt: new Date().toISOString(),
    })
  },

  async hasAvailableSlot(): Promise<boolean> {
    const count = await db.saves.count()
    return count < MAX_SLOTS
  },

  async getNextAvailableSlot(): Promise<number | null> {
    const saves = await db.saves.toArray()
    const usedSlots = new Set(saves.map(s => s.slotIndex))
    for (let i = 0; i < MAX_SLOTS; i++) {
      if (!usedSlots.has(i)) return i
    }
    return null
  },
}
