import { useMemo, useState } from 'react'
import { exerciseOptionsByPattern } from '../data/exerciseOptions'
import { movementPatternById, movementPatterns } from '../data/movementPatterns'
import { useAppStore } from '../store/useAppStore'
import { generateId } from '../utils/id'
import { EQUIPMENT_OPTIONS, inferEquipment, type Equipment } from '../lib/equipment'
import { exerciseImageByName } from '../data/exerciseImages'
import { assetUrl } from '../lib/assetUrl'
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
  const [search, setSearch] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState<Equipment | null>(null)
  const isFree = movementPatternIds.length === 0
  const [customPattern, setCustomPattern] = useState(movementPatternIds[0] ?? movementPatterns[0].id)

  const patternIds = isFree ? movementPatterns.map((p) => p.id) : movementPatternIds

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    return patternIds
      .map((pid) => {
        const pattern = movementPatternById.get(pid)
        const builtIn = exerciseOptionsByPattern[pid] ?? []
        const custom = customExercises.filter((c) => c.movementPatternId === pid)
        const exercises = [...builtIn, ...custom].filter((ex) => {
          if (query && !ex.name.toLowerCase().includes(query)) return false
          if (equipmentFilter && inferEquipment(ex.name) !== equipmentFilter) return false
          return true
        })
        return { pattern, exercises }
      })
      .filter((g) => g.pattern && g.exercises.length > 0)
  }, [patternIds, customExercises, search, equipmentFilter])

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-hidden border-t-[3px] border-ink bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-dim">Übung wählen für</p>
            <h2 className="font-display text-base text-ink">{label}</h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn press text-dim hover:bg-panel2 hover:text-ink"
            aria-label="Schließen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b border-line px-5 py-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Übung suchen…"
            className="mb-2.5 w-full border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-dim focus:border-ink focus:outline-none"
          />
          <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <button
                key={eq}
                onClick={() => setEquipmentFilter(equipmentFilter === eq ? null : eq)}
                className={`shrink-0 border px-2.5 py-1 text-[11px] font-semibold ${
                  equipmentFilter === eq ? 'border-ink bg-ink text-on-ink' : 'border-line text-dim hover:border-ink hover:text-ink'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>

        <div className="scrollbar-none max-h-[50dvh] overflow-y-auto px-5 py-4">
          {groups.length === 0 && (
            <p className="py-6 text-center text-sm text-dim">Keine Übungen gefunden.</p>
          )}
          {groups.map(({ pattern, exercises }) => (
            <div key={pattern!.id} className="mb-5">
              {(isFree || movementPatternIds.length > 1) && (
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[.1em] text-brand-400">
                  {pattern!.name}
                </h3>
              )}
              <div className="flex flex-col gap-1.5">
                {exercises.map((ex) => {
                  const image = exerciseImageByName[ex.name]
                  const selected = ex.id === currentExerciseId
                  return (
                    <button
                      key={ex.id}
                      onClick={() => handleSelect(ex)}
                      className={`press flex items-center justify-between gap-3 border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        selected ? 'border-ink bg-ink text-on-ink' : 'border-line bg-surface text-ink hover:border-ink'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {image && (
                          <img
                            src={assetUrl(image)}
                            alt=""
                            loading="lazy"
                            className={`h-11 w-11 shrink-0 object-cover ${selected ? 'opacity-90' : ''}`}
                          />
                        )}
                        <span className="truncate">{ex.name}</span>
                      </span>
                      {selected && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="border-t border-line pt-4">
            {!addingCustom ? (
              <button
                onClick={() => setAddingCustom(true)}
                className="flex w-full items-center justify-center gap-2 border border-dashed border-line py-3 text-sm font-semibold text-dim hover:border-ink hover:text-ink"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Eigene Übung hinzufügen
              </button>
            ) : (
              <div className="flex flex-col gap-2 border border-line bg-panel2 p-3">
                <input
                  autoFocus
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Name der Übung"
                  className="border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-dim focus:border-ink focus:outline-none"
                />
                {(isFree || movementPatternIds.length > 1) && (
                  <select
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    className="border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
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
                    className="flex-1 py-2 text-sm font-semibold text-dim hover:text-ink"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleAddCustom}
                    disabled={!customName.trim()}
                    className="press flex-1 bg-ink py-2 text-sm font-bold text-on-ink disabled:opacity-40"
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
