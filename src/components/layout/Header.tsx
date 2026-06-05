import { Menu, Bell, ChevronRight } from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { useGameStore } from '@/store/useGameStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const VIEW_LABELS: Record<string, string> = {
  dashboard:   'Painel',
  squad:       'Elenco',
  tactics:     'Táticas',
  calendar:    'Calendário',
  competition: 'Competições',
  transfer:    'Mercado',
  scouting:    'Scouting',
  finance:     'Finanças',
  press:       'Imprensa',
  match:       'Partida',
}

export function Header() {
  const { toggleSidebar, currentView } = useUiStore()
  const { activeSeason, playerClub } = useGameStore()

  const currentDate = activeSeason?.currentDate
    ? format(new Date(activeSeason.currentDate), "dd 'de' MMMM, yyyy", { locale: ptBR })
    : null

  return (
    <header className="h-14 bg-night-900 border-b border-night-700 flex items-center px-4 gap-4 sticky top-0 z-20">
      {/* Menu toggle (mobile) */}
      <button
        onClick={toggleSidebar}
        className="text-night-400 hover:text-night-100 transition-colors lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-body">
        <span className="text-night-500 hidden sm:block">
          {playerClub?.shortName ?? 'Brasfoot'}
        </span>
        {playerClub && (
          <>
            <ChevronRight className="w-3 h-3 text-night-600 hidden sm:block" />
            <span className="text-night-100 font-medium">
              {VIEW_LABELS[currentView] ?? currentView}
            </span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Data atual do jogo */}
      {currentDate && (
        <span className="text-xs text-night-500 font-mono hidden sm:block">
          {currentDate}
        </span>
      )}

      {/* Notificações (placeholder) */}
      <button className="relative text-night-400 hover:text-night-100 transition-colors">
        <Bell className="w-4 h-4" />
        {/* Indicador de não lido */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-red" />
      </button>
    </header>
  )
}
