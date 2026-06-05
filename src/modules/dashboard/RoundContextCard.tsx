import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { db } from '@/database/db'
import type { Club } from '@/types'
import clsx from 'clsx'

interface MatchResult {
  home:          Club
  away:          Club
  scoreH:        number
  scoreA:        number
  isPlayerMatch: boolean
}

interface RoundSummary {
  round:   number
  results: MatchResult[]
}

export function RoundContextCard() {
  const { activeSeason, competition } = useGameStore()
  const [summary, setSummary] = useState<RoundSummary | null>(null)

  useEffect(() => {
    if (!activeSeason || !competition) return
    void loadLastRound()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competition?.currentRound])

  async function loadLastRound() {
    if (!activeSeason || !competition || competition.currentRound <= 1) return
    const lastRound = competition.currentRound - 1

    const matches = await db.matches
      .where('saveId').equals(activeSeason.saveId)
      .filter(m => m.round === lastRound && m.status === 'completed')
      .toArray()

    if (!matches.length) return

    const clubIds = [...new Set(matches.flatMap(m => [m.homeClubId, m.awayClubId]))]
    // bulkGet returns (Club | undefined)[] — filter to Club[]
    const fetched  = await db.clubs.bulkGet(clubIds)
    const resolved = fetched.filter((c): c is Club => c !== undefined)
    const clubMap  = new Map(resolved.map(c => [c.id, c]))

    const results: MatchResult[] = matches.flatMap(m => {
      const home = clubMap.get(m.homeClubId)
      const away = clubMap.get(m.awayClubId)
      if (!home || !away) return []
      return [{
        home,
        away,
        scoreH:        m.score.home,
        scoreA:        m.score.away,
        isPlayerMatch: m.isPlayerMatch,
      }]
    })

    setSummary({ round: lastRound, results })
  }

  if (!summary || !competition) return null

  return (
    <div className="space-y-1">
      <p className="text-2xs text-night-600 uppercase tracking-wider font-display px-1">
        Rodada {summary.round} — Resultados
      </p>
      {summary.results.map((r, i) => {
        const homeWon = r.scoreH > r.scoreA
        const awayWon = r.scoreA > r.scoreH
        return (
          <div key={i} className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
            r.isPlayerMatch
              ? 'bg-night-700/60 border border-night-600'
              : 'bg-night-800/40',
          )}>
            <span className={clsx(
              'flex-1 text-right truncate',
              homeWon ? 'text-night-200 font-medium' : 'text-night-600',
            )}>
              {r.home.shortName}
            </span>
            <span className="font-mono font-bold text-night-100 text-sm tabular-nums px-2">
              {r.scoreH}–{r.scoreA}
            </span>
            <span className={clsx(
              'flex-1 truncate',
              awayWon ? 'text-night-200 font-medium' : 'text-night-600',
            )}>
              {r.away.shortName}
            </span>
          </div>
        )
      })}
    </div>
  )
}
