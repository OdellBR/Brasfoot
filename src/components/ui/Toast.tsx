import { useUiStore } from '@/store/useUiStore'
import clsx from 'clsx'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
}

const styles = {
  success: 'border-accent-green/30 bg-accent-green/10 text-accent-green',
  error:   'border-accent-red/30 bg-accent-red/10 text-accent-red',
  info:    'border-accent-blue/30 bg-accent-blue/10 text-accent-blue',
  warning: 'border-accent-orange/30 bg-accent-orange/10 text-accent-orange',
}

export function ToastContainer() {
  const { toasts, removeToast } = useUiStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={clsx(
              'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3',
              'shadow-lg min-w-[280px] max-w-[360px] animate-slide-up',
              'bg-night-800',
              styles[toast.type]
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-body text-night-100 flex-1">
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-night-400 hover:text-night-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
