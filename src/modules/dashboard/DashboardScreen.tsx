import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { RoundContextCard } from './RoundContextCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useGameStore } from '@/store/useGameStore'
import { useUiStore }   from '@/store/useUiStore'
import { useAdvanceRound } from '@/hooks/useAdvanceRound'
import { db } from '@/database/db'
import type { Match, Club, StandingsRow } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'

export function DashboardScreen() {
  const { playerClub, manager, activeSeason, competition, isAdvancing } = useGameStore()
  const { navigate } = useUiStore()
  const { advance }  = useAdvanceRound()

  const [nextMatch, setNextMatch] = useState<Match | null>(null)
  const [opponent, setOpponent]   = useState<Club | null>(null)
  const [recent, setRecent]       = useState<Match[]>([])
  const [clubMap, setClubMap]     = useState<Map<string, Club>>(new Map())

  useEffect(() => {
    if (!playerClub || !activeSeason) return
    void load()
  }, [playerClub?.id, competition?.currentRound])

  async function load() {
    if (!playerClub || !activeSeason) return
    const sid = activeSeason.saveId

    const [next, done, clubs] = await Promise.all([
      db.matches.where('saveId').equals(sid)
        .filter(m => m.isPlayerMatch && m.status === 'scheduled')
        .sortBy('round').then(arr => arr[0] ?? null),
      db.matches.where('saveId').equals(sid)
        .filter(m => m.isPlayerMatch && m.status === 'completed')
        .sortBy('round').then(arr => arr.slice(-5)),
      db.clubs.where('saveId').equals(sid).toArray(),
    ])

    const map = new Map(clubs.map(c => [c.id, c]))
    setClubMap(map)
    setRecent(done)  // sortBy('round') + slice(-5) already gives correct chronological order

    if (next) {
      const oppId = next.homeClubId === playerClub.id ? next.awayClubId : next.homeClubId
      setOpponent(map.get(oppId) ?? null)
      setNextMatch(next)
    } else {
      setNextMatch(null)
    }
  }

  const standings  = competition?.standings ?? []
  const playerPos  = standings.findIndex(r => r.clubId === playerClub?.id) + 1
  const playerRow  = standings.find(r => r.clubId === playerClub?.id)
  const top5       = standings.slice(0, 5)
  const isHome     = nextMatch?.homeClubId === playerClub?.id
  // Season is over when competition exists but has no more scheduled matches
  const seasonOver = competition != null && !competition.isActive

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-night-100 uppercase tracking-wide">
          {playerClub?.name}
        </h1>
        <p className="text-sm text-night-500 mt-0.5">
          {manager?.name} · Temporada {activeSeason?.year}
        </p>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Posição', value: playerPos ? `${playerPos}°` : '—', color: 'text-accent-gold' },
          { label: 'Pontos',  value: String(playerRow?.points ?? 0),     color: 'text-night-100' },
          { label: 'V-E-D',   value: `${playerRow?.won ?? 0}-${playerRow?.drawn ?? 0}-${playerRow?.lost ?? 0}`, color: 'text-night-300' },
          { label: 'Gols',    value: String(playerRow?.goalsFor ?? 0),   color: 'text-accent-green' },
        ].map(s => (
          <Card key={s.label} variant="elevated" padding="sm">
            <p className="text-2xs text-night-600 uppercase tracking-wider font-display">{s.label}</p>
            <p className={`font-display text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Próxima partida */}
      <Card variant="highlight" padding="none">
        <div className="p-4">
          <p className="text-2xs text-night-500 uppercase tracking-wider font-display mb-3">
            Próxima Partida · Rodada {competition?.currentRound ?? '—'}
          </p>

          {nextMatch && opponent ? (
            <div className="flex items-center mb-4">
              <ClubBadge club={playerClub} label={isHome ? 'CASA' : ''} />
              <div className="flex-1 text-center">
                <p className="font-display text-xl font-bold text-night-600">VS</p>
                <p className="text-2xs text-night-600 font-mono mt-0.5">
                  {format(new Date(nextMatch.scheduledAt), "dd 'de' MMM", { locale: ptBR })}
                </p>
              </div>
              <ClubBadge club={opponent} label={!isHome ? 'FORA' : ''} />
            </div>
          ) : seasonOver ? (
            <p className="text-sm text-accent-gold text-center py-2 mb-4 font-display uppercase tracking-wide">
              🏆 Temporada encerrada
            </p>
          ) : (
            <p className="text-sm text-night-500 text-center py-2 mb-4">
              Sem partidas pendentes
            </p>
          )}

          {seasonOver ? (
            <Button fullWidth size="lg" variant="gold" onClick={() => navigate('season-end')}>
              Ver Classificação Final →
            </Button>
          ) : (
            <Button fullWidth size="lg" variant="gold"
              disabled={isAdvancing || !nextMatch}
              onClick={advance}
              icon={isAdvancing ? <Loader2 className="w-5 h-5 animate-spin" /> : undefined}
            >
              {isAdvancing ? 'Simulando...' : 'Avançar Rodada →'}
            </Button>
          )}
        </div>
      </Card>

      {/* Forma recente */}
      {recent.length > 0 && (
        <Card padding="sm">
          <p className="text-2xs text-night-500 uppercase tracking-wider font-display mb-3">Forma Recente</p>
          <div className="flex gap-2">
            {recent.map(m => {
              const isH  = m.homeClubId === playerClub?.id
              const myG  = isH ? m.score.home : m.score.away
              const oppG = isH ? m.score.away : m.score.home
              const res  = myG > oppG ? 'W' : myG < oppG ? 'L' : 'D'
              const opp  = clubMap.get(isH ? m.awayClubId : m.homeClubId)
              return (
                <div key={m.id} className="flex flex-col items-center gap-1">
                  <div className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold font-display border',
                    res === 'W' ? 'bg-accent-green/15 text-accent-green border-accent-green/30' :
                    res === 'L' ? 'bg-accent-red/15 text-accent-red border-accent-red/30' :
                                  'bg-night-700 text-night-400 border-night-600'
                  )}>
                    {res}
                  </div>
                  <span className="text-2xs text-night-500 font-mono">{myG}–{oppG}</span>
                  <span className="text-2xs text-night-700 font-display">{opp?.shortName ?? '?'}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Últimos resultados */}
      {competition && competition.currentRound > 1 && <RoundContextCard />}

      {/* Tabela mini */}
      {top5.length > 0 && (
        <Card padding="none">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <p className="text-2xs text-night-500 uppercase tracking-wider font-display">Liga Nacional</p>
            <button onClick={() => navigate('competition')}
              className="text-xs text-accent-green hover:text-emerald-400 transition-colors">
              Ver tabela →
            </button>
          </div>
          <StandingsMini rows={top5} playerClubId={playerClub?.id} clubMap={clubMap} startPos={1} />
          {playerPos > 5 && playerRow && (
            <>
              <div className="border-t border-dashed border-night-800 mx-4" />
              <StandingsMini rows={[playerRow]} playerClubId={playerClub?.id} clubMap={clubMap} startPos={playerPos} />
            </>
          )}
        </Card>
      )}
    </div>
  )
}

function ClubBadge({ club, label }: { club: Club | null | undefined; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold font-display"
        style={{ backgroundColor: club?.colors.primary ?? '#1e293b', color: club?.colors.secondary ?? '#fff' }}>
        {club?.shortName}
      </div>
      <p className="text-xs text-night-300 font-display uppercase tracking-wide text-center leading-tight">
        {club?.name}
      </p>
      {label && <p className="text-2xs text-accent-green font-mono">{label}</p>}
    </div>
  )
}

function StandingsMini({ rows, playerClubId, clubMap, startPos }: {
  rows: StandingsRow[]; playerClubId?: string; clubMap: Map<string, Club>; startPos: number
}) {
  return (
    <div className="pb-2">
      {rows.map((row, i) => {
        const club = clubMap.get(row.clubId)
        const isMe = row.clubId === playerClubId
        return (
          <div key={row.clubId} className={clsx(
            'flex items-center gap-2 px-4 py-1.5 text-xs',
            isMe && 'bg-accent-green/5 border-l-2 border-accent-green'
          )}>
            <span className="w-4 text-right text-night-700 font-mono">{startPos + i}</span>
            <div className="w-4 h-4 rounded flex items-center justify-center text-2xs font-bold flex-shrink-0"
              style={{ backgroundColor: club?.colors.primary, color: club?.colors.secondary }}>
              {club?.shortName?.slice(0, 1)}
            </div>
            <span className={clsx('flex-1 truncate', isMe ? 'text-night-100 font-medium' : 'text-night-500')}>
              {club?.name}
            </span>
            <span className="text-night-600 font-mono w-5 text-center">{row.played}</span>
            <span className="font-bold font-mono text-night-200 w-5 text-right">{row.points}</span>
          </div>
        )
      })}
    </div>
  )
}
