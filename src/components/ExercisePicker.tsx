import { useMemo, useState } from 'react'
import { exerciseOptionsByPattern } from '../data/exerciseOptions'
import { movementPatternById, movementPatterns } from '../data/movementPatterns'
import { useAppStore } from '../store/useAppStore'
import { generateId } from '../utils/id'
import type { CustomExercise, ExerciseOption } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  label: string
  movementPatternIds: string[]
  currentExerciseId: string | null
  onSelect: (exercise: ExerciseOption | CustomExercise) => void
}

export default function ExercisePicker({
  open,
  onClose,
  label,
  movementPatternIds,
  currentExerciseId,
  onSelect,
}: Props) {
  const customExercises = useAppStore((s) => s.customExercises)
  const addCustomExercise = useAppStore((s) => s.addCustomExercise)
  const [addingCustom, setAddingCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const isFree = movementPatternIds.length === 0
  const [customPattern, setCustomPattern] = useState(movementPatternIds[0] ?? movementPatterns[0].id)

  const patternIds = isFree ? movementPatterns.map((p) => p.id) : movementPatternIds

  const groups = useMemo(() => {
    return patternIds
      .map((pid) => {
        const pattern = movementPatternById.get(pid)
        const builtIn = exerciseOptionsByPattern[pid] ?? []
        const custom = customExercises.filter((c) => c.movementPatternId === pid)
        return { pattern, exercises: [...builtIn, ...custom] }
      })
      .filter((g) => g.pattern)
  }, [patternIds, customExercises])

  if (!open) return null

  function handleSelect(ex: ExerciseOption | CustomExercise) {
    onSelect(ex)
    onClose()
  }

  async function handleAddCustom() {
    const name = customName.trim()
    if (!name) return
    const exercise: CustomExercise = {
      id: generateId('cex'),
      name,
      movementPatternId: customPattern,
      createdAt: Date.now(),
    }
    await addCustomExercise(exercise)
    handleSelect(exercise)
    setCustomName('')
    setAddingCustom(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-hidden rounded-t-3xl border-t border-white/10 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Übung wählen für</p>
            <h2 className="text-base font-semibold text-white">{label}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Schließen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="scrollbar-none max-h-[60dvh] overflow-y-auto px-5 py-4">
          {groups.map(({ pattern, exercises }) => (
            <div key={pattern!.id} className="mb-5">
              {(isFree || movementPatternIds.length > 1) && (
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-400">
                  {pattern!.name}
                </h3>
              )}
              <div className="flex flex-col gap-1.5">
                {exercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleSelect(ex)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      ex.id === currentExerciseId
                        ? 'border-brand-500 bg-brand-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span>{ex.name}</span>
                    {ex.id === currentExerciseId && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t border-white/10 pt-4">
            {!addingCustom ? (
              <button
                onClick={() => setAddingCustom(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-sm font-medium text-slate-300 hover:border-brand-400 hover:text-brand-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Eigene Übung hinzufügen
              </button>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <input
                  autoFocus
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Name der Übung"
                  className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
                />
                {(isFree || movementPatternIds.length > 1) && (
                  <select
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white focus:border-brand-400 focus:outline-none"
                  >
                    {(isFree ? movementPatterns : movementPatternIds.map((id) => movementPatternById.get(id)!)).map(
                      (p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ),
                    )}
                  </select>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddingCustom(false)}
                    className="flex-1 rounded-lg py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleAddCustom}
                    disabled={!customName.trim()}
                    className="flex-1 rounded-lg bg-brand-500 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
