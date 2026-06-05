import { useState } from 'react'
import { ArrowLeft, Search, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useUiStore } from '@/store/useUiStore'
import { useGameStore } from '@/store/useGameStore'
import { CLUBS_DATA, type ClubTemplate } from '@/data/clubs'
import { createNewCareer } from '@/services/gameService'
import { clubRepository } from '@/database/repositories/clubRepository'
import { db } from '@/database/db'

export function NewCareerScreen() {
  const { navigate, addToast }         = useUiStore()
  const { setActiveSave, setPlayerClub, setManager, setActiveSeason, setCompetition } = useGameStore()
  const [step, setStep]                = useState<'club' | 'confirm'>('club')
  const [selected, setSelected]        = useState<ClubTemplate | null>(null)
  const [managerName, setManagerName]  = useState('')
  const [search, setSearch]            = useState('')
  const [isCreating, setIsCreating]    = useState(false)
  const [progress, setProgress]         = useState('')

  const filtered = CLUBS_DATA.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) ||
         c.city.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate() {
    if (!selected || !managerName.trim()) return
    setIsCreating(true)
    try {
      setProgress('Gerando clubes e jogadores...')
      await new Promise(r => setTimeout(r, 50)) // yield to repaint
      const { saveId, clubId, managerId } = await createNewCareer(selected, managerName.trim())
      setProgress('Carregando carreira...')

      // Carrega os dados recém-criados no store
      const [save, club, manager, season, comp] = await Promise.all([
        db.saves.get(saveId),
        clubRepository.getById(clubId),
        db.managers.get(managerId),
        db.seasons.where('saveId').equals(saveId).first(),
        db.competitions.where('saveId').equals(saveId).filter(c => c.isActive).first(),
      ])

      if (save && club && manager && season) {
        setActiveSave(save)
        setPlayerClub(club)
        setManager(manager)
        setActiveSeason(season)
        if (comp) setCompetition(comp)
      }

      addToast({ type: 'success', message: `Carreira com ${selected.name} iniciada!` })
      navigate('dashboard')
    } catch (err) {
      console.error(err)
      addToast({ type: 'error', message: 'Erro ao criar carreira. Tente novamente.' })
    } finally {
      setIsCreating(false)
      setProgress('')
    }
  }

  if (step === 'confirm' && selected) {
    return (
      <ConfirmStep
        club={selected}
        managerName={managerName}
        onNameChange={setManagerName}
        onBack={() => setStep('club')}
        onCreate={handleCreate}
        isCreating={isCreating}
        progress={progress}
      />
    )
  }

  return (
    <div className="min-h-screen bg-night-900 p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pt-4">
        <button onClick={() => navigate('home')} className="text-night-400 hover:text-night-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-xl text-night-100 uppercase tracking-wide">Nova Carreira</h1>
          <p className="text-xs text-night-500">Escolha seu clube</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-500" />
        <input
          type="text"
          placeholder="Buscar clube ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-night-800 border border-night-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-night-100 placeholder:text-night-600 focus:outline-none focus:border-accent-green/50 transition-colors"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(club => (
          <button key={club.name} onClick={() => { setSelected(club); setStep('confirm') }} className="w-full text-left">
            <Card variant="default" padding="sm" className="hover:border-night-600 hover:bg-night-700/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-display font-bold flex-shrink-0"
                  style={{ backgroundColor: club.colors.primary, color: club.colors.secondary }}
                >
                  {club.shortName}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-night-100 uppercase tracking-wide text-sm">{club.name}</p>
                    <Badge variant={club.division === 'primeira' ? 'success' : 'default'} size="xs">
                      {club.division === 'primeira' ? 'Série A' : 'Série B'}
                    </Badge>
                  </div>
                  <p className="text-xs text-night-500 truncate">{club.city}, {club.uf}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RepBar value={club.reputation.national} max={20} />
                    <span className="text-2xs text-night-600 font-mono">
                      R$ {(club.finances.transferBudget / 1_000_000).toFixed(1)}M orçamento
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-night-600 group-hover:text-night-300 transition-colors" />
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}

function RepBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1 bg-night-700 rounded-full overflow-hidden">
        <div className="h-full bg-accent-green rounded-full" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-2xs text-night-500 font-mono">{value}/20</span>
    </div>
  )
}

interface ConfirmProps {
  club:         ClubTemplate
  managerName:  string
  onNameChange: (v: string) => void
  onBack:       () => void
  onCreate:     () => void
  isCreating:   boolean
  progress:     string
}

function ConfirmStep({ club, managerName, onNameChange, onBack, onCreate, isCreating, progress }: ConfirmProps) {
  return (
    <div className="min-h-screen bg-night-900 p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-8 pt-4">
        <button onClick={onBack} className="text-night-400 hover:text-night-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-night-100 uppercase tracking-wide">Confirmar</h1>
      </div>

      <Card variant="elevated" className="mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-display font-bold"
            style={{ backgroundColor: club.colors.primary, color: club.colors.secondary }}
          >
            {club.shortName}
          </div>
          <div>
            <p className="font-display font-bold text-xl text-night-100 uppercase tracking-wide">{club.name}</p>
            <p className="text-sm text-night-400">{club.city}, {club.uf}</p>
            <p className="text-xs text-night-500 font-mono mt-1">{club.division === 'primeira' ? 'Série A' : 'Série B'} · Rep {club.reputation.national}/20</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="bg-night-700/50 rounded-lg p-3">
            <p className="text-lg font-mono font-bold text-night-100">R$ {(club.finances.transferBudget / 1_000_000).toFixed(1)}M</p>
            <p className="text-2xs text-night-500 mt-0.5">Orçamento contratações</p>
          </div>
          <div className="bg-night-700/50 rounded-lg p-3">
            <p className="text-lg font-mono font-bold text-night-100">R$ {(club.finances.wageBudget / 1_000).toFixed(0)}K/sem</p>
            <p className="text-2xs text-night-500 mt-0.5">Orçamento salarial</p>
          </div>
        </div>
      </Card>

      <div className="mb-6">
        <label className="block text-sm text-night-300 mb-2">Nome do Técnico</label>
        <input
          type="text"
          value={managerName}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Ex: João Silva"
          maxLength={30}
          className="w-full bg-night-800 border border-night-700 rounded-lg px-4 py-3 text-night-100 placeholder:text-night-600 focus:outline-none focus:border-accent-green/50 transition-colors"
        />
      </div>

      <Button
        fullWidth size="lg" variant="gold"
        disabled={!managerName.trim() || isCreating}
        onClick={onCreate}
        icon={isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : undefined}
      >
        {isCreating ? 'Gerando mundo...' : 'Iniciar Carreira'}
      </Button>
      <p className="text-center text-xs text-night-600 mt-3 min-h-[1rem]">
        {progress}
      </p>
    </div>
  )
}
