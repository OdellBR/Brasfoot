import { useCallback } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { useUiStore }   from '@/store/useUiStore'
import { advanceRound } from '@/services/season/advanceRound'
import { db }           from '@/database/db'

export function useAdvanceRound() {
  const {
    activeSave, playerClub, tactics,
    setIsAdvancing, setLastMatchResult,
    setPendingSeasonEnd,
    updateSeason, updateCompetition,
  } = useGameStore()
  const { navigate, addToast } = useUiStore()

  const advance = useCallback(async () => {
    if (!activeSave || !playerClub) return
    setIsAdvancing(true)
    try {
      const result = await advanceRound(activeSave.id, playerClub.id, tactics)

      // Re-lê do banco após avançar — nunca confia no snapshot do store
      const [updatedComp, updatedSeason] = await Promise.all([
        db.competitions
          .where('saveId').equals(activeSave.id)
          .filter(c => c.isActive)
          .first(),
        db.seasons
          .where('saveId').equals(activeSave.id)
          .filter(s => s.isActive)
          .first(),
      ])
      if (updatedComp)   updateCompetition(updatedComp)
      if (updatedSeason) updateSeason(updatedSeason)

      if (result.playerMatchResult) {
        // Always show the match result first — even if it's the last round.
        // If the season is also over, set a flag so MatchScreen redirects correctly.
        setLastMatchResult(result.playerMatchResult)
        if (result.isSeasonOver) setPendingSeasonEnd(true)
        navigate('match')
      } else if (result.isSeasonOver) {
        navigate('season-end')
      } else {
        addToast({ type: 'info', message: `Rodada ${result.roundSimulated} concluída.` })
      }
    } catch (e) {
      console.error(e)
      addToast({ type: 'error', message: 'Erro ao simular rodada.' })
    } finally {
      setIsAdvancing(false)
    }
  }, [
    activeSave, playerClub, tactics,
    setIsAdvancing, setLastMatchResult,
    setPendingSeasonEnd,
    updateSeason, updateCompetition,
    navigate, addToast,
  ])

  return { advance }
}
