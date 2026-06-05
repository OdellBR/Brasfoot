import { create } from 'zustand'

export type AppView =
  | 'home'
  | 'new-career'
  | 'dashboard'
  | 'squad'
  | 'tactics'
  | 'match'
  | 'calendar'
  | 'transfer'
  | 'scouting'
  | 'finance'
  | 'press'
  | 'season-end'
  | 'competition'

export type ModalType =
  | 'player-detail'
  | 'match-result'
  | 'transfer-offer'
  | 'confirm-action'
  | 'board-meeting'
  | null

export interface Toast {
  id:       string
  type:     'success' | 'error' | 'info' | 'warning'
  message:  string
  duration?: number
}

interface UiState {
  currentView:    AppView
  activeModal:    ModalType
  modalPayload:   Record<string, unknown> | undefined  // undefined, not null — matches optional param
  toasts:         Toast[]
  isSidebarOpen:  boolean
  isMatchRunning: boolean
}

interface UiActions {
  navigate:       (view: AppView) => void
  openModal:      (modal: ModalType, payload?: Record<string, unknown>) => void
  closeModal:     () => void
  addToast:       (toast: Omit<Toast, 'id'>) => void
  removeToast:    (id: string) => void
  toggleSidebar:  () => void
  setSidebarOpen: (open: boolean) => void
  setMatchRunning:(running: boolean) => void
}

export const useUiStore = create<UiState & UiActions>((set, get) => ({
  currentView:    'home',
  activeModal:    null,
  modalPayload:   undefined,   // matches type
  toasts:         [],
  isSidebarOpen:  false,
  isMatchRunning: false,

  navigate:    (view) => set({ currentView: view, isSidebarOpen: false }),

  openModal:   (modal, payload) =>
    set({ activeModal: modal, modalPayload: payload }),

  closeModal:  () =>
    set({ activeModal: null, modalPayload: undefined }),

  addToast: (toast) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => get().removeToast(id), toast.duration ?? 4000)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  toggleSidebar:  () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  setMatchRunning:(running) => set({ isMatchRunning: running }),
}))
