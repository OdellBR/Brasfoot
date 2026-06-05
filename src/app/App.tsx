import { AppRouter } from './Router'
import { EngineDebugPanel } from '@/modules/debug/EngineDebugPanel'

export function App() {
  return (
    <>
      <AppRouter />
      <EngineDebugPanel />
    </>
  )
}
