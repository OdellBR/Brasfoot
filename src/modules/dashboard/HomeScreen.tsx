import { Plus, Trash2, ChevronRight, Trophy, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useUiStore } from '@/store/useUiStore'
import { useSaveList, useDeleteSave, useLoadSave } from '@/hooks/useSave'
import type { GameSave } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MAX_SLOTS = 3

export function HomeScreen() {
  const { navigate }                = useUiStore()
  const { saves, loading, refresh } = useSaveList()
  const { remove, deletingId }      = useDeleteSave()
  const { load, loadingId }         = useLoadSave()

  const emptySlots = Math.max(0, MAX_SLOTS - saves.length)

  async function handleDelete(save: GameSave) {
    if (!confirm(`Deletar carreira com ${save.clubName}? Irreversível.`)) return
    const ok = await remove(save)
    if (ok) void refresh()
  }

  return (
    <div className="min-h-screen bg-night-900 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-green/10 border border-accent-green/20 mb-4">
          <Trophy className="w-8 h-8 text-accent-green" />
        </div>
        <h1 className="font-display text-4xl font-bold text-night-50 uppercase tracking-widest">Brasfoot</h1>
        <p className="text-night-500 text-sm mt-1">Manager de Futebol Brasileiro</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-night-600 animate-spin" />
          </div>
        ) : (
          <>
            {saves.map(save => (
              <Card key={save.id} variant="elevated" padding="none">
                <button
                  onClick={() => load(save)}
                  disabled={loadingId === save.id}
                  className="w-full text-left p-4 hover:bg-night-600/30 transition-colors rounded-t-xl group disabled:opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-night-100 uppercase tracking-wide">{save.clubName}</p>
                      <p className="text-xs text-night-500 mt-0.5">Temporada {save.seasonYear} · {save.name}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-night-400 font-mono">{save.snapshot.leaguePosition}º lugar</span>
                        <span className="text-xs text-night-600">·</span>
                        <span className="text-xs text-night-400 font-mono">{save.snapshot.leaguePoints} pts</span>
                        <span className="text-xs text-night-600">·</span>
                        <span className="text-xs text-night-400">
                          {format(new Date(save.updatedAt), 'dd/MM/yy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    {loadingId === save.id
                      ? <Loader2 className="w-4 h-4 text-night-500 animate-spin" />
                      : <ChevronRight className="w-4 h-4 text-night-500 group-hover:text-night-200 transition-colors" />
                    }
                  </div>
                </button>
                <div className="border-t border-night-700 px-4 py-2 flex justify-end">
                  <button
                    onClick={() => handleDelete(save)}
                    disabled={!!deletingId}
                    className="text-xs text-night-600 hover:text-accent-red transition-colors flex items-center gap-1 disabled:opacity-40"
                  >
                    {deletingId === save.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Deletar
                  </button>
                </div>
              </Card>
            ))}

            {Array.from({ length: emptySlots }).map((_, i) => (
              <button
                key={i}
                onClick={() => navigate('new-career')}
                className="w-full border-2 border-dashed border-night-700 hover:border-accent-green/50 rounded-xl p-6 transition-colors group"
              >
                <div className="flex items-center justify-center gap-3 text-night-600 group-hover:text-night-300 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span className="font-display font-medium uppercase tracking-wide text-sm">Nova Carreira</span>
                </div>
              </button>
            ))}
          </>
        )}
      </div>

      <p className="mt-10 text-2xs text-night-800 font-mono">v0.1.0-alpha</p>
    </div>
  )
}
