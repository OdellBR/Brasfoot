// ============================================================
// SEASON END SCREEN
// ============================================================

import { useEffect, useState } from 'react'
import { useGameStore }        from '@/store/useGameStore'
import { useUiStore }          from '@/store/useUiStore'
import { startNewSeason }      from '@/services/season/newSeason'
import { Button }              from '@/components/ui/Button'
import { Card }                from '@/components/ui/Card'
import { db }                  from '@/database/db'
import type { Club } from '@/types'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export function SeasonEndScreen() {
  const {
    activeSave, playerClub, activeSeason, competition,
    setActiveSeason, setCompetition, setActiveSave, setPendingSeasonEnd,
  } = useGameStore()
  const { navigate } = useUiStore()

  const [clubs, setClubs]       = useState<Map<string, Club>>(new Map())
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!activeSave) return
    // Refresh competition from DB on mount — store may be stale after season ends
    void db.competitions
      .where('saveId').equals(activeSave.id)
      .filter(comp => !comp.isActive)
      .last()
      .then(comp => { if (comp) setCompetition(comp) })
    if (!activeSeason) return
    db.clubs.where('saveId').equals(activeSeason.saveId).toArray()
      .then(all => setClubs(new Map(all.map(c => [c.id, c]))))
  }, [activeSave?.id, activeSeason?.saveId])

  async function handleNewSeason() {
    if (!activeSave || !playerClub || !activeSeason) return
    setStarting(true)
    try {
      const { competitionId, seasonId } = await startNewSeason(
        activeSave.id, playerClub.id, activeSeason.year
      )
      const [ns, nc, nsave] = await Promise.all([
        db.seasons.get(seasonId),
        db.competitions.get(competitionId),
        db.saves.get(activeSave.id),
      ])
      if (ns)    setActiveSeason(ns)
      if (nc)    setCompetition(nc)
      if (nsave) setActiveSave(nsave)
      setPendingSeasonEnd(false)  // Clear any stale season-end flag
      navigate('dashboard')
    } catch (e) { console.error(e) }
    finally { setStarting(false) }
  }

  const standings    = competition?.standings ?? []
  const champion     = standings[0]
  const playerIdx    = standings.findIndex(r => r.clubId === playerClub?.id)
  const playerSt     = standings[playerIdx]
  const isChampion   = champion?.clubId === playerClub?.id
  const championClub = clubs.get(champion?.clubId ?? '')
  const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

  return (
    <div className="space-y-5 pb-8 animate-fade-in">
      <div className="text-center pt-4">
        <p className="text-2xs text-night-600 uppercase tracking-widest font-mono mb-1">
          Temporada {activeSeason?.year} encerrada
        </p>
        <h1 className="font-display text-3xl font-black text-night-100 uppercase tracking-wide">
          {isChampion ? '🏆 Campeão!' : 'Fim da Temporada'}
        </h1>
        {isChampion && (
          <p className="text-accent-gold text-sm mt-1">
            {playerClub?.name} conquista a Liga Nacional!
          </p>
        )}
      </div>

      {playerSt && (
        <Card variant={isChampion ? 'highlight' : 'default'} padding="sm">
          <p className="text-2xs text-night-500 uppercase tracking-wider font-display mb-3">Sua Temporada</p>
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-14 h-14 rounded-xl flex items-center justify-center font-display font-black text-2xl',
              isChampion ? 'bg-accent-gold/20 text-accent-gold' : 'bg-night-700 text-night-300'
            )}>
              {medals[playerIdx] ?? `${playerIdx + 1}°`}
            </div>
            <div>
              <p className="font-display font-bold text-lg text-night-100 uppercase tracking-wide">
                {playerClub?.name}
              </p>
              <p className="text-sm text-night-400 font-mono">
                {playerSt.points} pts · {playerSt.won}V {playerSt.drawn}E {playerSt.lost}D
              </p>
              <p className="text-xs text-night-600 font-mono">
                {playerSt.goalsFor} gols pró · {playerSt.goalsAgainst} contra
              </p>
            </div>
          </div>
        </Card>
      )}

      {!isChampion && champion && (
        <Card padding="sm">
          <p className="text-2xs text-night-500 uppercase tracking-wider font-display mb-3">🏆 Campeão</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-display font-bold"
              style={{ backgroundColor: championClub?.colors.primary, color: championClub?.colors.secondary }}>
              {championClub?.shortName}
            </div>
            <div>
              <p className="font-display font-bold text-night-100 uppercase tracking-wide">{championClub?.name}</p>
              <p className="text-xs text-night-500 font-mono">{champion.points} pts · {champion.won}V {champion.drawn}E {champion.lost}D</p>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="px-4 pt-3 pb-1">
          <p className="text-2xs text-night-500 uppercase tracking-wider font-display">Classificação Final</p>
        </div>
        {standings.slice(0, 5).map((row, i) => {
          const club = clubs.get(row.clubId)
          const isMe = row.clubId === playerClub?.id
          return (
            <div key={row.clubId} className={clsx(
              'flex items-center gap-2 px-4 py-2 text-xs',
              isMe && 'bg-accent-green/5 border-l-2 border-accent-green'
            )}>
              <span className="w-5 text-right font-mono text-night-600">{medals[i] ?? `${i+1}°`}</span>
              <div className="w-5 h-5 rounded flex items-center justify-center text-2xs font-bold"
                style={{ backgroundColor: club?.colors.primary, color: club?.colors.secondary }}>
                {club?.shortName?.slice(0,1)}
              </div>
              <span className={clsx('flex-1 truncate', isMe ? 'text-night-100 font-medium' : 'text-night-500')}>
                {club?.name}
              </span>
              <span className="font-bold font-mono text-night-200">{row.points}</span>
            </div>
          )
        })}
        {playerIdx >= 5 && playerSt && (
          <>
            <div className="border-t border-dashed border-night-800 mx-4" />
            <div className="flex items-center gap-2 px-4 py-2 text-xs bg-accent-green/5 border-l-2 border-accent-green">
              <span className="w-5 text-right font-mono text-night-600">{playerIdx+1}°</span>
              <div className="w-5 h-5 rounded flex items-center justify-center text-2xs font-bold"
                style={{ backgroundColor: playerClub?.colors.primary, color: playerClub?.colors.secondary }}>
                {playerClub?.shortName?.slice(0,1)}
              </div>
              <span className="flex-1 text-night-100 font-medium truncate">{playerClub?.name}</span>
              <span className="font-bold font-mono text-night-200">{playerSt.points}</span>
            </div>
          </>
        )}
      </Card>

      <Button fullWidth size="lg" variant="gold"
        disabled={starting} onClick={handleNewSeason}
        icon={starting ? <Loader2 className="w-5 h-5 animate-spin" /> : undefined}>
        {starting ? 'Preparando...' : `Iniciar Temporada ${(activeSeason?.year ?? 2025) + 1} →`}
      </Button>
    </div>
  )
}
