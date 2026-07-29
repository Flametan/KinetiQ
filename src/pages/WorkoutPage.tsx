import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getLastSetsForExercise } from '../lib/history'
import { generateId } from '../utils/id'
import ExercisePicker from '../components/ExercisePicker'
import type { ExerciseLogEntry, SetEntry } from '../types'

export default function WorkoutPage() {
  const { dayId } = useParams<{ dayId: string }>()
  const plan = useAppStore((s) => s.activePlan)
  const sessions = useAppStore((s) => s.sessions)
  const addSession = useAppStore((s) => s.addSession)
  const navigate = useNavigate()

  const day = plan?.days.find((d) => d.id === dayId)

  const initialExercises = useMemo<ExerciseLogEntry[]>(() => {
    if (!day) return []
    return day.slots.map((slot) => {
      const lastSets = slot.exerciseId ? getLastSetsForExercise(sessions, slot.exerciseId) : null
      const sets: SetEntry[] = Array.from({ length: slot.sets }, (_, i) => ({
        setNumber: i + 1,
        reps: lastSets?.[i]?.reps ?? slot.repsMin,
        weight: lastSets?.[i]?.weight ?? 0,
        completed: false,
      }))
      return {
        slotId: slot.slotId,
        exerciseId: slot.exerciseId ?? '',
        exerciseName: slot.exerciseName ?? '',
        label: slot.label,
        targetSets: slot.sets,
        repsMin: slot.repsMin,
        repsMax: slot.repsMax,
        sets,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day?.id])

  const [exercises, setExercises] = useState<ExerciseLogEntry[]>(initialExercises)
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null)
  const [startedAt] = useState(() => Date.now())
  const [saved, setSaved] = useState(false)

  if (!plan) return <Navigate to="/onboarding" replace />
  if (!day) return <Navigate to="/training" replace />

  const planSlot = (slotId: string) => day.slots.find((s) => s.slotId === slotId)!

  function updateSet(slotId: string, setIndex: number, patch: Partial<SetEntry>) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.slotId !== slotId
          ? ex
          : { ...ex, sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s)) },
      ),
    )
  }

  function addSet(slotId: string) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.slotId !== slotId
          ? ex
          : {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  setNumber: ex.sets.length + 1,
                  reps: ex.sets.at(-1)?.reps ?? ex.repsMin,
                  weight: ex.sets.at(-1)?.weight ?? 0,
                  completed: false,
                },
              ],
            },
      ),
    )
  }

  function removeSet(slotId: string, setIndex: number) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.slotId !== slotId
          ? ex
          : { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex).map((s, i) => ({ ...s, setNumber: i + 1 })) },
      ),
    )
  }

  function assignExercise(slotId: string, ex: { id: string; name: string }) {
    setExercises((prev) =>
      prev.map((e) => (e.slotId !== slotId ? e : { ...e, exerciseId: ex.id, exerciseName: ex.name })),
    )
  }

  async function finish() {
    const completedExercises = exercises.filter((e) => e.exerciseId)
    await addSession({
      id: generateId('session'),
      planId: plan!.id,
      planDayId: day!.id,
      dayName: day!.name,
      date: new Date().toISOString(),
      startedAt,
      finishedAt: Date.now(),
      exercises: completedExercises,
    })
    setSaved(true)
    setTimeout(() => navigate('/progress'), 900)
  }

  const hasAnyLoggedSet = exercises.some((e) => e.sets.some((s) => s.completed))

  return (
    <div className="flex flex-col gap-5 pb-32">
      <header className="pt-2">
        <p className="text-xs font-medium text-brand-400">{plan.variantName}</p>
        <h1 className="mt-0.5 text-xl font-bold text-white">{day.name}</h1>
      </header>

      <section className="flex flex-col gap-4">
        {exercises.map((ex) => (
          <div key={ex.slotId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">{ex.label}</p>
                <button
                  onClick={() => setPickerSlotId(ex.slotId)}
                  className="text-left text-base font-semibold text-white hover:text-brand-300"
                >
                  {ex.exerciseName || 'Übung wählen'}
                </button>
              </div>
              <span className="shrink-0 rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-slate-300">
                Ziel: {ex.targetSets} × {ex.repsMin}-{ex.repsMax}
              </span>
            </div>

            {ex.exerciseId ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-[1.5rem_1fr_1fr_2.25rem] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <span>#</span>
                  <span>Wdh.</span>
                  <span>Gewicht (kg)</span>
                  <span></span>
                </div>
                {ex.sets.map((set, i) => (
                  <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr_2.25rem] items-center gap-2">
                    <span className="text-sm text-slate-500">{set.setNumber}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={set.reps}
                      onChange={(e) => updateSet(ex.slotId, i, { reps: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-center text-sm text-white focus:border-brand-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      value={set.weight}
                      onChange={(e) => updateSet(ex.slotId, i, { weight: Number(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-center text-sm text-white focus:border-brand-400 focus:outline-none"
                    />
                    <button
                      onClick={() => updateSet(ex.slotId, i, { completed: !set.completed })}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                        set.completed
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-white/15 text-slate-500 hover:border-white/30'
                      }`}
                      aria-label="Satz erledigt"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                  </div>
                ))}
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => addSet(ex.slotId)}
                    className="flex-1 rounded-lg border border-dashed border-white/15 py-1.5 text-xs font-medium text-slate-400 hover:border-white/30 hover:text-white"
                  >
                    + Satz
                  </button>
                  {ex.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(ex.slotId, ex.sets.length - 1)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-white"
                    >
                      Satz entfernen
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setPickerSlotId(ex.slotId)}
                className="w-full rounded-xl border border-dashed border-white/20 py-3 text-sm text-slate-400 hover:border-brand-400 hover:text-brand-300"
              >
                Übung auswählen, um Sätze zu erfassen
              </button>
            )}
          </div>
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-md px-4">
        <button
          onClick={finish}
          disabled={!hasAnyLoggedSet || saved}
          className="w-full rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 disabled:opacity-40"
        >
          {saved ? 'Gespeichert ✓' : 'Training abschließen'}
        </button>
      </div>

      {pickerSlotId && (
        <ExercisePicker
          open
          onClose={() => setPickerSlotId(null)}
          label={planSlot(pickerSlotId).label}
          movementPatternIds={planSlot(pickerSlotId).movementPatternIds}
          currentExerciseId={exercises.find((e) => e.slotId === pickerSlotId)?.exerciseId || null}
          onSelect={(ex) => assignExercise(pickerSlotId, ex)}
        />
      )}
    </div>
  )
}
