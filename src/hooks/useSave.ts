import { useState, useEffect, useCallback } from 'react'
import { saveRepository }  from '@/database/repositories/saveRepository'
import { clubRepository }  from '@/database/repositories/clubRepository'
import { deleteSave, db } from '@/database/db'
import { useGameStore }    from '@/store/useGameStore'
import { useUiStore }      from '@/store/useUiStore'
import type { GameSave }   from '@/types'

export function useSaveList() {
  const [saves, setSaves]     = useState<GameSave[]>([])
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => {
    setLoading(true)
    setSaves(await saveRepository.list())
    setLoading(false)
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { saves, loading, refresh }
}

export function useDeleteSave() {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { addToast } = useUiStore()
  const remove = useCallback(async (save: GameSave): Promise<boolean> => {
    setDeletingId(save.id)
    try {
      await deleteSave(save.id)
      addToast({ type: 'success', message: `Carreira com ${save.clubName} deletada.` })
      return true
    } catch {
      addToast({ type: 'error', message: 'Erro ao deletar.' })
      return false
    } finally { setDeletingId(null) }
  }, [addToast])
  return { remove, deletingId }
}

export function useLoadSave() {
  const { setActiveSave, setPlayerClub, setManager, setActiveSeason, setCompetition } = useGameStore()
  const { addToast, navigate } = useUiStore()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const load = useCallback(async (save: GameSave) => {
    setLoadingId(save.id)
    try {
      const [club, manager, season] = await Promise.all([
        clubRepository.getById(save.clubId),
        db.managers.where('saveId').equals(save.id).first(),
        db.seasons.where('saveId').equals(save.id).filter(s => s.isActive).first(),
      ])
      if (!club || !manager || !season) {
        addToast({ type: 'error', message: 'Save corrompido.' }); return
      }
      // Busca a primeira competição ativa
      const comp = await db.competitions
        .where('saveId').equals(save.id)
        .filter(c => c.isActive)
        .first()

      setActiveSave(save)
      setPlayerClub(club)
      setManager(manager)
      setActiveSeason(season)
      if (comp) setCompetition(comp)
      navigate('dashboard')
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar save.' })
    } finally { setLoadingId(null) }
  }, [setActiveSave, setPlayerClub, setManager, setActiveSeason, setCompetition, addToast, navigate])

  return { load, loadingId }
}
