// Tática simplificada: 3 decisões com impacto real e visível
import { useGameStore, type TacticStyle, type TacticRhythm, type TacticFormation } from '@/store/useGameStore'
import { Card } from '@/components/ui/Card'
import clsx from 'clsx'

// Impacto legível de cada escolha
const STYLE_INFO: Record<TacticStyle, { label: string; desc: string; atk: number; def: number }> = {
  defensive: { label: 'Defensivo',   desc: 'Foco em não levar gol. Menos chances criadas.',        atk: -1, def: +2 },
  balanced:  { label: 'Equilibrado', desc: 'Equilíbrio entre atacar e defender.',                   atk:  0, def:  0 },
  attacking: { label: 'Ofensivo',    desc: 'Mais pressão e chances. Defesa mais exposta.',          atk: +2, def: -1 },
}

const RHYTHM_INFO: Record<TacticRhythm, { label: string; desc: string }> = {
  slow:   { label: 'Posse',    desc: 'Controla o ritmo. Menos desgaste físico.' },
  normal: { label: 'Normal',   desc: 'Ritmo padrão. Equilibrado.' },
  press:  { label: 'Pressão',  desc: 'Alta intensidade. Desgaste alto, mais recuperações.' },
}

const FORMATIONS: { value: TacticFormation; label: string; desc: string }[] = [
  { value: '4-3-3',   label: '4-3-3',   desc: 'Ofensivo. 3 pontas, pressão alta.' },
  { value: '4-4-2',   label: '4-4-2',   desc: 'Clássico. Equilíbrio e solidez.' },
  { value: '4-2-3-1', label: '4-2-3-1', desc: 'Controle do meio. Criativo.' },
  { value: '5-3-2',   label: '5-3-2',   desc: 'Defensivo. 5 na linha de trás.' },
]

export function TacticsScreen() {
  const { tactics, setTactics } = useGameStore()

  function set<K extends keyof typeof tactics>(key: K, value: typeof tactics[K]) {
    setTactics({ ...tactics, [key]: value })
  }

  const info = STYLE_INFO[tactics.style]

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-night-100 uppercase tracking-wide">Táticas</h1>
        <p className="text-sm text-night-500 mt-0.5">3 decisões. Impacto direto na simulação.</p>
      </div>

      {/* Impacto atual */}
      <Card variant="elevated" padding="sm">
        <p className="text-2xs text-night-500 uppercase tracking-wider font-display mb-2">Impacto Tático Atual</p>
        <div className="flex gap-4">
          <ImpactBar label="Ataque" delta={info.atk} />
          <ImpactBar label="Defesa" delta={info.def} />
          {tactics.rhythm === 'press' && <ImpactBar label="Pressão" delta={1} />}
        </div>
      </Card>

      {/* Estilo de jogo */}
      <div>
        <p className="text-xs text-night-400 uppercase tracking-wider font-display mb-2">Estilo de Jogo</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(STYLE_INFO) as [TacticStyle, typeof STYLE_INFO[TacticStyle]][]).map(([key, s]) => (
            <button
              key={key}
              onClick={() => set('style', key)}
              className={clsx(
                'p-3 rounded-xl border text-left transition-all',
                tactics.style === key
                  ? 'bg-night-700 border-accent-green text-night-100'
                  : 'bg-night-800 border-night-700 text-night-500 hover:border-night-600'
              )}
            >
              <p className="font-display font-bold text-sm uppercase tracking-wide">{s.label}</p>
              <p className="text-2xs mt-1 leading-tight opacity-70">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Ritmo */}
      <div>
        <p className="text-xs text-night-400 uppercase tracking-wider font-display mb-2">Ritmo</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(RHYTHM_INFO) as [TacticRhythm, typeof RHYTHM_INFO[TacticRhythm]][]).map(([key, r]) => (
            <button
              key={key}
              onClick={() => set('rhythm', key)}
              className={clsx(
                'p-3 rounded-xl border text-left transition-all',
                tactics.rhythm === key
                  ? 'bg-night-700 border-accent-green text-night-100'
                  : 'bg-night-800 border-night-700 text-night-500 hover:border-night-600'
              )}
            >
              <p className="font-display font-bold text-sm uppercase tracking-wide">{r.label}</p>
              <p className="text-2xs mt-1 leading-tight opacity-70">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Formação */}
      <div>
        <p className="text-xs text-night-400 uppercase tracking-wider font-display mb-2">Formação</p>
        <div className="grid grid-cols-2 gap-2">
          {FORMATIONS.map(f => (
            <button
              key={f.value}
              onClick={() => set('formation', f.value)}
              className={clsx(
                'p-3 rounded-xl border text-left transition-all',
                tactics.formation === f.value
                  ? 'bg-night-700 border-accent-green text-night-100'
                  : 'bg-night-800 border-night-700 text-night-500 hover:border-night-600'
              )}
            >
              <p className="font-display font-bold text-lg">{f.label}</p>
              <p className="text-2xs mt-0.5 leading-tight opacity-70">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-night-700 text-center">
        Tática aplicada automaticamente na próxima rodada.
      </p>
    </div>
  )
}

function ImpactBar({ label, delta }: { label: string; delta: number }) {
  const positive = delta > 0
  const neutral  = delta === 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-night-500 w-14">{label}</span>
      <span className={clsx(
        'text-sm font-mono font-bold',
        neutral   ? 'text-night-600' :
        positive  ? 'text-accent-green' : 'text-accent-red'
      )}>
        {neutral ? '±0' : delta > 0 ? `+${delta}` : delta}
      </span>
    </div>
  )
}
