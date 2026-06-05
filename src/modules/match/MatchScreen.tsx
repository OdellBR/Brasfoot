// ============================================================
// MATCH SCREEN
//
// Duas fases:
//   1. LIVE  — eventos aparecem com delay, placar evolui
//   2. FINAL — resultado completo com stats e destaque
//
// A engine já calculou tudo. Aqui só apresentamos com pacing.
// Total: ~15 segundos de apresentação antes do resultado final.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { useUiStore }   from '@/store/useUiStore'
import { Button }       from '@/components/ui/Button'
import { Card }         from '@/components/ui/Card'
import clsx from 'clsx'
import type { SimEvent } from '@/engine/simulation/types'

// Eventos que merecem aparecer durante o "live"
const LIVE_EVENT_TYPES = new Set(['goal', 'yellow_card', 'red_card', 'save', 'missed_chance'])

// Delay entre eventos em ms — ritmo de 10-18 segundos total
const EVENT_DELAY_MS = 700

type Phase = 'live' | 'final'

export function MatchScreen() {
  const { lastMatchResult, pendingSeasonEnd, setPendingSeasonEnd } = useGameStore()
  const { navigate } = useUiStore()

  const [phase, setPhase]               = useState<Phase>('live')
  const [visibleEvents, setVisible]     = useState<SimEvent[]>([])
  const [displayScore, setDisplayScore] = useState({ home: 0, away: 0 })
  const [highlightScore, setHighlight]  = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const r = lastMatchResult

  useEffect(() => {
    if (!r) {
    if (pendingSeasonEnd) setPendingSeasonEnd(false)
    navigate('dashboard')
    return
  }

    const liveEvents = r.events.filter(e => LIVE_EVENT_TYPES.has(e.type))

    let idx = 0
    function showNext() {
      if (idx >= liveEvents.length) {
        // Todos os eventos mostrados — vai para fase final
        timerRef.current = setTimeout(() => setPhase('final'), 600)
        return
      }
      const event = liveEvents[idx]

      setVisible(prev => [...prev, event])

      // Atualiza placar em tempo real quando é gol
      if (event.type === 'goal') {
        setDisplayScore(prev => ({
          ...prev,
          home: event.teamId === 'home' ? prev.home + 1 : prev.home,
          away: event.teamId === 'away' ? prev.away + 1 : prev.away,
        }))
        setHighlight(true)
        setTimeout(() => setHighlight(false), 800)
      }

      // Scroll para o último evento
      setTimeout(() => {
        scrollRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 50)

      idx++
      timerRef.current = setTimeout(showNext, EVENT_DELAY_MS)
    }

    timerRef.current = setTimeout(showNext, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])  // eslint-disable-line

  if (!r) return null

  if (phase === 'final') return <FinalScreen />

  // ── FASE LIVE ─────────────────────────────────────────────
  const totalEvents = r.events.filter(e => LIVE_EVENT_TYPES.has(e.type)).length
  const progress    = totalEvents > 0 ? (visibleEvents.length / totalEvents) * 100 : 0

  return (
    <div className="space-y-4 pb-8">
      {/* Barra de progresso da partida */}
      <div className="h-0.5 bg-night-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-green rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Placar ao vivo */}
      <div className={clsx(
        'text-center py-6 rounded-2xl transition-colors duration-300',
        highlightScore ? 'bg-accent-green/15' : 'bg-night-800/40'
      )}>
        <p className="text-2xs text-night-600 font-mono uppercase tracking-widest mb-2">
          AO VIVO · Liga Nacional
        </p>
        <div className={clsx(
          'font-display text-6xl font-black text-night-50 tracking-tight transition-transform duration-200',
          highlightScore && 'scale-110'
        )}>
          {displayScore.home} – {displayScore.away}
        </div>
        <p className="text-xs text-night-600 mt-2 font-mono animate-pulse">
          simulando...
        </p>
      </div>

      {/* Feed de eventos */}
      <Card padding="sm">
        <div ref={scrollRef} className="space-y-2 max-h-64 overflow-y-auto">
          {visibleEvents.length === 0 && (
            <p className="text-sm text-night-600 text-center py-4">Aguardando início...</p>
          )}
          {visibleEvents.map((e, i) => (
            <LiveEventRow key={i} event={e} isNew={i === visibleEvents.length - 1} />
          ))}
        </div>
      </Card>

      {/* Skip */}
      <button
        onClick={() => {
          if (timerRef.current) clearTimeout(timerRef.current)
          setPhase('final')
        }}
        className="w-full text-center text-xs text-night-700 hover:text-night-500 transition-colors py-2"
      >
        Pular para resultado →
      </button>
    </div>
  )
}

// ── Componente de evento ao vivo ─────────────────────────────

function LiveEventRow({ event, isNew }: { event: SimEvent; isNew: boolean }) {
  const icon =
    event.type === 'goal'         ? '⚽' :
    event.type === 'missed_chance'? '😤' :
    event.type === 'yellow_card'  ? '🟨' :
    event.type === 'red_card'     ? '🟥' :
    event.type === 'save'         ? '🧤' : '•'

  const isGoal = event.type === 'goal'

  return (
    <div className={clsx(
      'flex gap-3 items-start rounded-lg px-2 py-1.5 transition-all',
      isNew    && 'animate-slide-up',
      isGoal   && 'bg-accent-green/10 border border-accent-green/20',
    )}>
      <span className="text-2xs text-night-600 font-mono w-6 text-right flex-shrink-0 pt-0.5">
        {event.minute}'
      </span>
      <span className="flex-shrink-0 text-sm">{icon}</span>
      <p className={clsx(
        'text-sm font-body leading-snug',
        isGoal ? 'text-night-100 font-medium' : 'text-night-400'
      )}>
        {event.narrative}
      </p>
    </div>
  )
}

// ── FASE FINAL ───────────────────────────────────────────────

function FinalScreen() {
  const { lastMatchResult, competition, pendingSeasonEnd, setPendingSeasonEnd } = useGameStore()
  const { navigate } = useUiStore()
  const r = lastMatchResult!

  // playerSide tells us which side the player's club is on.
  // 'home' → player is home team; 'away' → player is visiting; null → not playing.
  const side       = r.playerSide
  const myScore    = side === 'home' ? r.scoreHome : r.scoreAway
  const theirScore = side === 'home' ? r.scoreAway : r.scoreHome
  const gHome      = r.scoreHome
  const gAway      = r.scoreAway

  const won   = side !== null && myScore > theirScore
  const lost  = side !== null && myScore < theirScore


  const resultLabel = won ? 'VITÓRIA' : lost ? 'DERROTA' : 'EMPATE'
  const resultColor = won ? 'text-accent-green' : lost ? 'text-accent-red' : 'text-accent-gold'

  const keyEvents = r.events.filter(e =>
    e.type === 'goal' || e.type === 'yellow_card' || e.type === 'red_card'
  )

  const bestEntry  = Object.entries(r.playerRatings).sort(([,a],[,b]) => b - a)[0]
  const bestRating = bestEntry?.[1] ?? 0

  const resultBg =
    won  ? 'from-accent-green/10' :
    lost ? 'from-accent-red/10'   : 'from-accent-gold/8'

  return (
    <div className="space-y-4 pb-8 animate-fade-in">
      {/* Placar final */}
      <div className={clsx('rounded-2xl bg-gradient-to-b to-transparent p-6 text-center', resultBg)}>
        {side !== null && (
          <p className={clsx('font-display text-xs font-bold uppercase tracking-widest mb-1', resultColor)}>
            {resultLabel}
          </p>
        )}
        <p className="text-2xs text-night-500 uppercase tracking-widest font-mono mb-2">
          Liga Nacional · Rodada {(competition?.currentRound ?? 1) - 1}
        </p>
        <p className="font-display text-6xl font-black text-night-50 tracking-tight">
          {gHome} – {gAway}
        </p>
        {side !== null && (
          <p className="text-xs text-night-600 font-mono mt-1">
            {side === 'home' ? 'Mandante' : 'Visitante'}
          </p>
        )}

        {r.stats && (
          <div className="flex justify-center gap-5 mt-4">
            <StatPill label="Posse" home={`${r.stats.possession[0]}%`} away={`${r.stats.possession[1]}%`} />
            <StatPill label="Chutes" home={String(r.stats.shots[0])} away={String(r.stats.shots[1])} />
            <StatPill label="No alvo" home={String(r.stats.shotsOnTarget[0])} away={String(r.stats.shotsOnTarget[1])} />
          </div>
        )}
      </div>

      {/* Gráfico de momentum */}
      {r.momentumCurve.length > 0 && (
        <Card padding="sm">
          <p className="text-2xs text-night-500 uppercase tracking-wider font-display mb-3">
            Domínio da Partida
          </p>
          <MomentumChart curve={r.momentumCurve} />
          <div className="flex justify-between mt-1">
            <span className="text-2xs text-night-700 font-mono">Home</span>
            <span className="text-2xs text-night-700 font-mono">Away</span>
          </div>
        </Card>
      )}

      {/* Eventos chave */}
      {keyEvents.length > 0 && (
        <Card padding="sm">
          <p className="text-2xs text-night-500 uppercase tracking-wider font-display mb-3">Lances</p>
          <div className="space-y-2">
            {keyEvents.map((e, i) => <LiveEventRow key={i} event={e} isNew={false} />)}
          </div>
        </Card>
      )}

      {/* Destaque */}
      {bestRating >= 7.5 && (
        <Card variant="highlight" padding="sm">
          <p className="text-2xs text-accent-gold uppercase tracking-wider font-display mb-2">
            Destaque da Partida
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-gold/15 border border-accent-gold/30 flex items-center justify-center">
              <span className="font-display font-black text-accent-gold text-lg">{bestRating.toFixed(1)}</span>
            </div>
            <div>
              <p className="text-sm text-night-200 font-body">Performance individual excepcional</p>
              <p className="text-xs text-night-600 font-mono">nota {bestRating.toFixed(1)} / 10</p>
            </div>
          </div>
        </Card>
      )}

      {/* CTAs */}
      <div className="flex gap-3">
        <Button variant="secondary" size="md" onClick={() => navigate('competition')} className="flex-1">
          Tabela
        </Button>
        <Button variant="primary" size="md" onClick={() => {
          if (pendingSeasonEnd) {
            setPendingSeasonEnd(false)
            navigate('season-end')
          } else {
            navigate('dashboard')
          }
        }} className="flex-1">
          {pendingSeasonEnd ? 'Ver Classificação Final →' : 'Continuar →'}
        </Button>
      </div>
    </div>
  )
}

function StatPill({ label, home, away }: { label: string; home: string; away: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-night-600 font-mono mb-1">{label}</p>
      <p className="text-xs font-mono">
        <span className="text-night-300">{home}</span>
        <span className="text-night-700 mx-1">·</span>
        <span className="text-night-300">{away}</span>
      </p>
    </div>
  )
}

function MomentumChart({ curve }: { curve: number[] }) {
  // Agrupa em 18 blocos de 5 minutos
  const blocks = Array.from({ length: 18 }, (_, i) => {
    const slice = curve.slice(i * 5, i * 5 + 5)
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : 0
  })

  return (
    <div className="flex gap-0.5 h-8 items-end">
      {blocks.map((v, i) => {
        const pct     = Math.abs(v) / 100
        const isHome  = v >= 0
        const height  = Math.max(8, pct * 100)
        return (
          <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
            <div
              className={clsx('rounded-sm', isHome ? 'bg-accent-green' : 'bg-accent-orange')}
              style={{ height: `${height}%`, opacity: 0.5 + pct * 0.5 }}
            />
          </div>
        )
      })}
    </div>
  )
}
