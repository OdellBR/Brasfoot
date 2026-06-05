// Engine Debug Panel — only rendered in DEV mode
import { useState } from 'react'
import { simulateMatch } from '@/engine/simulation/matchSimulator'
import type { MatchResult, ChanceLogEntry } from '@/engine/simulation/types'
import type { EngineTeam, EnginePlayer } from '@/engine/simulation/types'
import type { Position } from '@/types'

const POSITIONS: Position[] = ['GK','CB','CB','LB','RB','CDM','CM','CM','LW','RW','ST']

function makeMockPlayer(id: string, name: string, position: Position, ovr: number): EnginePlayer {
  const a = { finishing: ovr, passing: ovr, speed: ovr, marking: ovr, physicality: ovr, technique: ovr, mental: ovr }
  return {
    id, name, position,
    attributes:   a,
    dynamicState: { morale: 75, stamina: 90, form: 70, injuryWeeksRemaining: 0 },
    isStarter:    true,
  }
}

function makeTeam(name: string, clubId: string, ovr: number, isHome: boolean): EngineTeam {
  return {
    clubId, name, isHome,
    tactics: {
      formation: '4-3-3', mentality: 'balanced', pressIntensity: 'medium',
      tempo: 'normal', defensiveLine: 'normal', attackFocus: 'mixed',
    },
    players: POSITIONS.map((pos, i) =>
      makeMockPlayer(`${clubId}-${i}`, `Jogador ${i + 1}`, pos, ovr)
    ),
  }
}

const OUTCOME_COLOR: Record<string, string> = {
  goal: '#10b981', on_target: '#3b82f6', off_target: '#f59e0b',
  blocked: '#475569', no_chance: '#1e293b',
}

// Hooks always called — guard only wraps the render output
export function EngineDebugPanel() {
  const [seedInput, setSeedInput] = useState('42')
  const [homeOvr, setHomeOvr]     = useState(14)
  const [awayOvr, setAwayOvr]     = useState(12)
  const [result, setResult]       = useState<MatchResult | null>(null)
  const [tab, setTab]             = useState<'summary' | 'chances' | 'events' | 'momentum'>('summary')

  // Guard after hooks — React rules compliant
  if (!import.meta.env.DEV) return null

  function run(seed?: number) {
    const home = makeTeam('Time A', 'home', homeOvr, true)
    const away = makeTeam('Time B', 'away', awayOvr, false)
    const parsed = parseInt(seedInput)
    setResult(simulateMatch({ matchId: 'debug', home, away, seed: seed ?? (isNaN(parsed) ? undefined : parsed) }))
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#080d1a', borderTop: '1px solid #1e293b',
      maxHeight: '50vh', overflowY: 'auto', zIndex: 9999,
      fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
    }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #1e293b', flexWrap: 'wrap' }}>
        <span style={{ color: '#10b981', fontWeight: 700 }}>ENGINE DEBUG</span>
        <label style={{ color: '#64748b' }}>seed:</label>
        <input value={seedInput} onChange={e => setSeedInput(e.target.value)}
          style={{ width: 80, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }} />
        <label style={{ color: '#64748b' }}>home:</label>
        <input type="number" min={1} max={20} value={homeOvr} onChange={e => setHomeOvr(Number(e.target.value))}
          style={{ width: 50, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }} />
        <label style={{ color: '#64748b' }}>away:</label>
        <input type="number" min={1} max={20} value={awayOvr} onChange={e => setAwayOvr(Number(e.target.value))}
          style={{ width: 50, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }} />
        <button onClick={() => run()}
          style={{ background: '#10b981', color: '#0a0f1e', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
          SIMULAR
        </button>
        {result && (
          <button onClick={() => run(result.seed)}
            style={{ background: '#334155', color: '#e2e8f0', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
            REPETIR seed={result.seed}
          </button>
        )}
      </div>

      {result && (
        <>
          {/* Score bar */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #1e293b', flexWrap: 'wrap' }}>
            <span style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>
              Time A {result.scoreHome} – {result.scoreAway} Time B
            </span>
            <span style={{ color: '#64748b' }}>seed: {result.seed}</span>
            <span style={{ color: '#64748b' }}>
              home: {result.debug.homeStrength.overall.toFixed(1)} | away: {result.debug.awayStrength.overall.toFixed(1)}
            </span>
            <span style={{ color: '#64748b' }}>
              posse: {result.stats.possession[0]}%/{result.stats.possession[1]}%  chutes: {result.stats.shots[0]}/{result.stats.shots[1]}
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
            {(['summary','chances','events','momentum'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 14px', background: tab === t ? '#1e293b' : 'transparent',
                border: 'none', color: tab === t ? '#10b981' : '#64748b', cursor: 'pointer',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ padding: '8px 12px' }}>
            {tab === 'summary'  && <SummaryTab result={result} />}
            {tab === 'chances'  && <ChancesTab log={result.debug.chanceLog} />}
            {tab === 'events'   && <EventsTab  result={result} />}
            {tab === 'momentum' && <MomentumTab curve={result.momentumCurve} />}
          </div>
        </>
      )}
    </div>
  )
}

function SummaryTab({ result }: { result: MatchResult }) {
  const { homeStrength: h, awayStrength: a, tacticalFactors: tf } = result.debug
  const row = (label: string, hv: number, av: number) => (
    <div key={label} style={{ display: 'grid', gridTemplateColumns: '120px 60px 60px', gap: 4, marginBottom: 2 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: '#10b981' }}>{hv.toFixed(1)}</span>
      <span style={{ color: '#f59e0b' }}>{av.toFixed(1)}</span>
    </div>
  )
  return (
    <div>
      <div style={{ color: '#475569', marginBottom: 6 }}>HOME / AWAY</div>
      {row('ataque',  h.attack,   a.attack)}
      {row('meio',    h.midfield, a.midfield)}
      {row('defesa',  h.defense,  a.defense)}
      {row('overall', h.overall,  a.overall)}
      <div style={{ marginTop: 12, color: '#64748b' }}>
        {`home: mentalidade ${tf.homeMentalityBonus.attack.toFixed(1)}/${tf.homeMentalityBonus.defense.toFixed(1)} | pressão +${tf.homePressBonus.toFixed(1)} | mando +${tf.homeAdvantageApplied}`}
      </div>
    </div>
  )
}

function ChancesTab({ log }: { log: ChanceLogEntry[] }) {
  const goals = log.filter(e => e.outcome === 'goal').length
  return (
    <div>
      <div style={{ color: '#475569', marginBottom: 6 }}>
        {log.length} ações | {log.filter(e => e.outcome !== 'blocked').length} chances | {goals} gols
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 50px 70px 70px 60px 80px', gap: 4, color: '#334155', marginBottom: 4 }}>
        <span>min</span><span>time</span><span>atk/def</span><span>chc%/gol%</span><span>roll</span><span>outcome</span>
      </div>
      {log.map((e, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 50px 70px 70px 60px 80px', gap: 4, marginBottom: 1, color: OUTCOME_COLOR[e.outcome] ?? '#e2e8f0' }}>
          <span>{e.minute}'</span>
          <span>{e.teamId}</span>
          <span>{e.attackStr.toFixed(1)}/{e.defenseStr.toFixed(1)}</span>
          <span>{(e.chanceProb*100).toFixed(0)}%/{(e.goalProb*100).toFixed(0)}%</span>
          <span>{e.roll.toFixed(2)}</span>
          <span>{e.outcome}</span>
        </div>
      ))}
    </div>
  )
}

function EventsTab({ result }: { result: MatchResult }) {
  return (
    <div>
      {result.events
        .filter(e => e.type === 'goal' || e.type === 'commentary')
        .map((e, i) => (
          <div key={i} style={{ marginBottom: 6, borderLeft: `2px solid ${e.type === 'goal' ? '#10b981' : '#334155'}`, paddingLeft: 8 }}>
            <span style={{ color: '#64748b' }}>{e.minute}' </span>
            <span style={{ color: e.type === 'goal' ? '#10b981' : '#94a3b8' }}>{e.narrative}</span>
          </div>
        ))
      }
    </div>
  )
}

function MomentumTab({ curve }: { curve: number[] }) {
  const w = 3, h = 60, mid = h / 2
  return (
    <div>
      <div style={{ color: '#64748b', marginBottom: 4 }}>momentum por minuto (+100 home / -100 away)</div>
      <svg width={curve.length * w} height={h} style={{ display: 'block' }}>
        <line x1={0} y1={mid} x2={curve.length * w} y2={mid} stroke="#1e293b" strokeWidth={1} />
        {curve.map((v, i) => {
          const y         = mid - (v / 100) * (mid - 4)
          const color     = v > 0 ? '#10b981' : v < 0 ? '#f59e0b' : '#475569'
          const barHeight = Math.abs(y - mid) || 1
          const barY      = Math.min(y, mid)
          return <rect key={i} x={i * w} y={barY} width={w - 1} height={barHeight} fill={color} opacity={0.8} />
        })}
      </svg>
    </div>
  )
}
