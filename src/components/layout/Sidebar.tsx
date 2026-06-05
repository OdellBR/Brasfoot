import clsx from 'clsx'
import {
  LayoutDashboard,
  Users,
  Sliders,
  CalendarDays,
  ArrowLeftRight,
  Radar,
  Wallet,
  Newspaper,
  Trophy,
  X,
} from 'lucide-react'
import { useUiStore, type AppView } from '@/store/useUiStore'
import { useGameStore } from '@/store/useGameStore'

interface NavItem {
  view:  AppView
  label: string
  icon:  typeof LayoutDashboard
  divider?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { view: 'dashboard',   label: 'Painel',       icon: LayoutDashboard },
  { view: 'squad',       label: 'Elenco',        icon: Users },
  { view: 'tactics',     label: 'Táticas',       icon: Sliders },
  { view: 'calendar',   label: 'Calendário',    icon: CalendarDays },
  { view: 'competition', label: 'Competições',   icon: Trophy, divider: true },
  { view: 'transfer',    label: 'Mercado',       icon: ArrowLeftRight },
  { view: 'scouting',   label: 'Scouting',      icon: Radar },
  { view: 'finance',    label: 'Finanças',      icon: Wallet },
  { view: 'press',      label: 'Imprensa',      icon: Newspaper },
]

export function Sidebar() {
  const { currentView, navigate, isSidebarOpen, setSidebarOpen } = useUiStore()
  const { playerClub } = useGameStore()

  return (
    <>
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 h-full w-64 flex flex-col',
          'bg-night-900 border-r border-night-700',
          'transition-transform duration-250 ease-out',
          // Mobile: slide in/out
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible
          'lg:translate-x-0 lg:relative lg:z-auto'
        )}
      >
        {/* Header do clube */}
        <div className="flex items-center justify-between p-4 border-b border-night-700">
          <div className="flex items-center gap-3">
            {/* Club color badge */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-bold"
              style={{
                backgroundColor: playerClub?.colors.primary ?? '#334155',
                color: playerClub?.colors.secondary ?? '#fff',
              }}
            >
              {playerClub?.shortName ?? '—'}
            </div>
            <div>
              <p className="text-xs text-night-400 font-body">Técnico</p>
              <p className="text-sm font-display font-semibold text-night-100 uppercase tracking-wide">
                {playerClub?.name ?? 'Sem clube'}
              </p>
            </div>
          </div>
          {/* Fechar (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-night-400 hover:text-night-100 lg:hidden transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.view
            return (
              <div key={item.view}>
                {item.divider && (
                  <div className="my-1 mx-4 border-t border-night-700" />
                )}
                <button
                  onClick={() => navigate(item.view)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2.5',
                    'text-sm font-body transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green/50',
                    isActive
                      ? 'text-night-100 bg-night-700 border-r-2 border-accent-green'
                      : 'text-night-400 hover:text-night-200 hover:bg-night-800'
                  )}
                >
                  <Icon
                    className={clsx(
                      'w-4 h-4 flex-shrink-0',
                      isActive ? 'text-accent-green' : 'text-night-500'
                    )}
                  />
                  {item.label}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-night-700">
          <p className="text-2xs text-night-600 font-mono">
            BRASFOOT MANAGER v0.1
          </p>
        </div>
      </aside>
    </>
  )
}
