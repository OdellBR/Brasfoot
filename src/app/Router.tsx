import { useUiStore }      from '@/store/useUiStore'
import { AppShell }        from '@/components/layout/AppShell'
import { HomeScreen }      from '@/modules/dashboard/HomeScreen'
import { NewCareerScreen } from '@/modules/dashboard/NewCareerScreen'
import { DashboardScreen } from '@/modules/dashboard/DashboardScreen'
import { MatchScreen }     from '@/modules/match/MatchScreen'
import { SquadScreen }     from '@/modules/squad/SquadScreen'
import { TacticsScreen }   from '@/modules/tactics/TacticsScreen'
import { CompetitionScreen } from '@/modules/competition/CompetitionScreen'
import { SeasonEndScreen } from '@/modules/season/SeasonEndScreen'

export function AppRouter() {
  const { currentView } = useUiStore()

  if (currentView === 'home')       return <HomeScreen />
  if (currentView === 'new-career') return <NewCareerScreen />

  return (
    <AppShell>
      {currentView === 'dashboard'   && <DashboardScreen />}
      {currentView === 'match'       && <MatchScreen />}
      {currentView === 'squad'       && <SquadScreen />}
      {currentView === 'tactics'     && <TacticsScreen />}
      {currentView === 'competition' && <CompetitionScreen />}
      {currentView === 'season-end'  && <SeasonEndScreen />}
      {currentView === 'calendar'    && <PlaceholderView title="Calendário" eta="próxima iteração" />}
      {currentView === 'transfer'    && <PlaceholderView title="Mercado" eta="Etapa 6" />}
      {currentView === 'scouting'    && <PlaceholderView title="Scouting" eta="Etapa 7" />}
      {currentView === 'finance'     && <PlaceholderView title="Finanças" eta="Etapa 6" />}
      {currentView === 'press'       && <PlaceholderView title="Imprensa" eta="Etapa 7" />}
    </AppShell>
  )
}

function PlaceholderView({ title, eta }: { title: string; eta: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-night-800 border border-night-700 flex items-center justify-center mb-2">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="font-display text-xl font-bold text-night-300 uppercase tracking-wide">{title}</h2>
      <p className="text-sm text-night-600">{eta}</p>
    </div>
  )
}
