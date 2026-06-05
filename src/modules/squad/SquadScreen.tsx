import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { playerRepository } from '@/database/repositories/playerRepository'
import type { Player } from '@/types'
import { playerOverall } from '@/utils'
import { Card } from '@/components/ui/Card'
import clsx from 'clsx'

// Overall simplificado para UI
function ovr(p: Player): number {
  return Math.round(playerOverall(p.attributes, p.position))
}

function ovrColor(v: number) {
  if (v >= 15) return 'text-accent-gold'
  if (v >= 12) return 'text-accent-green'
  if (v >= 9)  return 'text-night-300'
  return 'text-night-600'
}

function moraleIcon(m: number) {
  if (m >= 80) return '😄'
  if (m >= 60) return '🙂'
  if (m >= 40) return '😐'
  return '😟'
}

function posColor(pos: string) {
  if (pos === 'GK') return 'text-amber-400 bg-amber-400/10'
  if (['CB','LB','RB'].includes(pos)) return 'text-sky-400 bg-sky-400/10'
  if (['CDM','CM','CAM','LM','RM'].includes(pos)) return 'text-emerald-400 bg-emerald-400/10'
  return 'text-rose-400 bg-rose-400/10'
}

const POS_ORDER = ['GK','CB','LB','RB','CDM','CM','CAM','LM','RM','LW','RW','ST','CF']

export function SquadScreen() {
  const { playerClub } = useGameStore()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'pos' | 'ovr' | 'age'>('pos')

  useEffect(() => {
    if (!playerClub) return
    playerRepository.getByIds(playerClub.squadIds)
      .then(ps => { setPlayers(ps); setLoading(false) })
  }, [playerClub?.id])

  const sorted = [...players].sort((a, b) => {
    if (sort === 'ovr') return ovr(b) - ovr(a)
    if (sort === 'age') return a.age - b.age
    // Por posição
    return POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position)
  })

  const avgOvr = players.length
    ? Math.round(players.reduce((s, p) => s + ovr(p), 0) / players.length)
    : 0

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-night-100 uppercase tracking-wide">Elenco</h1>
          <p className="text-sm text-night-500 mt-0.5">{players.length} jogadores · Overall médio: {avgOvr}</p>
        </div>
        <div className="flex gap-1">
          {(['pos','ovr','age'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={clsx('px-2 py-1 rounded text-xs font-mono transition-colors',
                sort === s ? 'bg-night-700 text-night-100' : 'text-night-600 hover:text-night-300'
              )}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-accent-green border-t-transparent animate-spin" />
        </div>
      ) : (
        <Card padding="none">
          {/* Header */}
          <div className="grid grid-cols-[32px_1fr_40px_36px_36px_36px] gap-2 px-4 py-2 border-b border-night-700">
            {['POS','JOGADOR','OVR','FOR','MOR','IDA'].map(h => (
              <span key={h} className="text-2xs text-night-600 uppercase tracking-wider font-display text-center first:text-left">{h}</span>
            ))}
          </div>

          {sorted.map((p, i) => {
            const o   = ovr(p)
            const inj = p.dynamicState.injuryWeeksRemaining > 0
            return (
              <div key={p.id} className={clsx(
                'grid grid-cols-[32px_1fr_40px_36px_36px_36px] gap-2 px-4 py-2.5 items-center',
                'border-b border-night-800 last:border-0',
                inj && 'opacity-50',
                i % 2 === 0 ? 'bg-transparent' : 'bg-night-800/30',
              )}>
                <span className={clsx('text-2xs font-mono font-bold px-1 py-0.5 rounded text-center', posColor(p.position))}>
                  {p.position}
                </span>
                <div className="min-w-0">
                  <p className={clsx('text-sm font-body truncate', inj ? 'text-night-600' : 'text-night-100')}>
                    {p.name}
                  </p>
                  {inj && (
                    <p className="text-2xs text-accent-red font-mono">
                      🤕 {p.dynamicState.injuryWeeksRemaining}sem
                    </p>
                  )}
                </div>
                <span className={clsx('text-sm font-mono font-bold text-center', ovrColor(o))}>{o}</span>
                <FormBar value={p.dynamicState.form} />
                <span className="text-sm text-center">{moraleIcon(p.dynamicState.morale)}</span>
                <span className="text-xs text-night-500 font-mono text-center">{p.age}</span>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

function FormBar({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-6 h-1.5 bg-night-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full', value >= 70 ? 'bg-accent-green' : value >= 45 ? 'bg-accent-gold' : 'bg-accent-red')}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-2xs text-night-700 font-mono">{value}</span>
    </div>
  )
}
