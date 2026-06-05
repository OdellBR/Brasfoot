import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/globals.css'
import { App } from './app/App'

// Register service worker.
// registerType: 'prompt' means we control when to update.
// onNeedRefresh / onOfflineReady callbacks handle the UX.
// offlineReady fires when all assets are precached — true offline support.
registerSW({
  onNeedRefresh() {
    // New version available — for now, auto-accept.
    // Future: show "Nova versão disponível" toast.
  },
  onOfflineReady() {
    console.log('[SW] App ready for offline use')
  },
  onRegistered(sw) {
    console.log('[SW] Service worker registered:', sw)
  },
  onRegisterError(error) {
    console.error('[SW] Registration failed:', error)
  },
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
