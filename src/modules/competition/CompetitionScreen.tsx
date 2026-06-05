import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { db } from '@/database/db'
import type { Club } from '@/types'
import { Card } from '@/components/ui/Card'
import clsx from 'clsx'

export function CompetitionScreen() {
  const { competition, playerClub, activeSeason } = useGameStore()
  const [clubMap, setClubMap] = useState<Map<string, Club>>(new Map())

  useEffect(() => {
    if (!activeSeason) return
    db.clubs.where('saveId').equals(activeSeason.saveId).toArray()
      .then(clubs => setClubMap(new Map(clubs.map(c => [c.id, c]))))
  }, [activeSeason?.saveId])

  if (!competition) return <p className="text-night-500 text-sm">Sem competição ativa.</p>

  const rows = competition.standings ?? []

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-night-100 uppercase tracking-wide">
          {competition.name}
        </h1>
        <p className="text-sm text-night-500 mt-0.5">
          Rodada {competition.currentRound - 1} de {competition.totalRounds}
        </p>
      </div>

      <Card padding="none">
        {/* Cabeçalho */}
        <div className="grid grid-cols-[28px_1fr_28px_28px_28px_28px_44px_36px] gap-1 px-4 py-2 border-b border-night-700">
          {['#','CLUBE','J','V','E','D','SG','PTS'].map(h => (
            <span key={h} className="text-2xs text-night-600 uppercase tracking-wider font-display text-center first:text-left">{h}</span>
          ))}
        </div>

        {rows.map((row, i) => {
          const club = clubMap.get(row.clubId)
          const isMe = row.clubId === playerClub?.id
          const isRelZone = i >= rows.length - 3  // Últimos 3 = rebaixamento
          const isTop4    = i < 4                  // Top 4 = Copa

          return (
            <div key={row.clubId} className={clsx(
              'grid grid-cols-[28px_1fr_28px_28px_28px_28px_44px_36px] gap-1 px-4 py-2.5 items-center border-b border-night-800 last:border-0',
              isMe        && 'bg-accent-green/5 border-l-2 border-accent-green',
              isRelZone   && !isMe && 'opacity-60',
            )}>
              <span className={clsx('text-xs font-mono text-center', isTop4 ? 'text-accent-blue' : 'text-night-700')}>
                {i + 1}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-2xs font-bold"
                  style={{ backgroundColor: club?.colors.primary, color: club?.colors.secondary }}>
                  {club?.shortName?.slice(0, 1)}
                </div>
                <span className={clsx('text-xs truncate', isMe ? 'text-night-100 font-medium' : 'text-night-400')}>
                  {club?.name}
                </span>
              </div>
              <span className="text-xs font-mono text-night-600 text-center">{row.played}</span>
              <span className="text-xs font-mono text-accent-green text-center">{row.won}</span>
              <span className="text-xs font-mono text-night-500 text-center">{row.drawn}</span>
              <span className="text-xs font-mono text-accent-red text-center">{row.lost}</span>
              <span className={clsx('text-xs font-mono text-center', row.goalDiff >= 0 ? 'text-night-400' : 'text-accent-red')}>
                {row.goalDiff >= 0 ? '+' : ''}{row.goalDiff}
              </span>
              <span className={clsx('text-sm font-mono font-bold text-center', isMe ? 'text-accent-green' : 'text-night-200')}>
                {row.points}
              </span>
            </div>
          )
        })}
      </Card>

      <div className="flex gap-4 text-xs text-night-600 font-body">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-blue" />
          Top 4 — Copa
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-red" />
          Últimos 3 — Rebaixamento
        </div>
      </div>
    </div>
  )
}
