import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getLastSetsForExercise } from '../lib/history'
import { generateId } from '../utils/id'
import ExercisePicker from '../components/ExercisePicker'
import type { ExerciseLogEntry, SetEntry, SetType } from '../types'

const REST_SECONDS = 120

const SET_TYPE_ORDER: SetType[] = ['normal', 'warmup', 'failure', 'dropset']
const SET_TYPE_LABEL: Record<SetType, string> = { normal: '', warmup: 'W', failure: 'F', dropset: 'D' }
const SET_TYPE_COLOR: Record<SetType, string> = {
  normal: 'text-slate-400',
  warmup: 'text-amber-400',
  failure: 'text-red-400',
  dropset: 'text-purple-400',
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatRest(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}min ${s}s`
}

export default function WorkoutPage() {
  const { dayId } = useParams<{ dayId: string }>()
  const plan = useAppStore((s) => s.activePlan)
  const sessions = useAppStore((s) => s.sessions)
  const addSession = useAppStore((s) => s.addSession)
  const navigate = useNavigate()

  const day = plan?.days.find((d) => d.id === dayId)

  const lastSetsBySlot = useMemo(() => {
    const map = new Map<string, SetEntry[] | null>()
    if (day) {
      for (const slot of day.slots) {
        map.set(slot.slotId, slot.exerciseId ? getLastSetsForExercise(sessions, slot.exerciseId) : null)
      }
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day?.id])

  const initialExercises = useMemo<ExerciseLogEntry[]>(() => {
    if (!day) return []
    return day.slots.map((slot) => {
      const lastSets = lastSetsBySlot.get(slot.slotId) ?? null
      const sets: SetEntry[] = Array.from({ length: slot.sets }, (_, i) => ({
        setNumber: i + 1,
        reps: lastSets?.[i]?.reps ?? slot.repsMin,
        weight: lastSets?.[i]?.weight ?? 0,
        completed: false,
        type: 'normal',
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
        notes: '',
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day?.id])

  const [exercises, setExercises] = useState<ExerciseLogEntry[]>(initialExercises)
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null)
  const [menuSlotId, setMenuSlotId] = useState<string | null>(null)
  const [notesOpen, setNotesOpen] = useState<Set<string>>(new Set())
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [restTimers, setRestTimers] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
      setRestTimers((prev) => {
        let changed = false
        const next: Record<string, number> = {}
        for (const [slotId, remaining] of Object.entries(prev)) {
          if (remaining > 0) {
            next[slotId] = remaining - 1
            changed = true
          } else {
            next[slotId] = remaining
          }
        }
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

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

  function toggleSetCompleted(slotId: string, setIndex: number) {
    let willBeCompleted = false
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.slotId !== slotId) return ex
        return {
          ...ex,
          sets: ex.sets.map((s, i) => {
            if (i !== setIndex) return s
            willBeCompleted = !s.completed
            return { ...s, completed: willBeCompleted }
          }),
        }
      }),
    )
    if (willBeCompleted) {
      setRestTimers((r) => ({ ...r, [slotId]: REST_SECONDS }))
    }
  }

  function cycleSetType(slotId: string, setIndex: number) {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.slotId !== slotId) return ex
        return {
          ...ex,
          sets: ex.sets.map((s, i) => {
            if (i !== setIndex) return s
            const current = s.type ?? 'normal'
            const nextType = SET_TYPE_ORDER[(SET_TYPE_ORDER.indexOf(current) + 1) % SET_TYPE_ORDER.length]
            return { ...s, type: nextType }
          }),
        }
      }),
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
                  type: 'normal',
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

  function updateNotes(slotId: string, notes: string) {
    setExercises((prev) => prev.map((e) => (e.slotId !== slotId ? e : { ...e, notes })))
  }

  function toggleNotes(slotId: string) {
    setNotesOpen((prev) => {
      const next = new Set(prev)
      if (next.has(slotId)) next.delete(slotId)
      else next.add(slotId)
      return next
    })
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

  function cancelWorkout() {
    if (confirm('Training abbrechen? Nicht gespeicherte Eingaben gehen verloren.')) {
      navigate('/training')
    }
  }

  const hasAnyLoggedSet = exercises.some((e) => e.sets.some((s) => s.completed))
  const totalVolume = exercises.reduce(
    (sum, ex) =>
      sum +
      ex.sets.filter((s) => s.completed && s.type !== 'warmup').reduce((sSum, s) => sSum + s.weight * s.reps, 0),
    0,
  )
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0)

  return (
    <div className="-mx-4 -mt-6 flex flex-col pb-10" onClick={() => setMenuSlotId(null)}>
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/training')} className="flex items-center gap-1 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
            <span className="font-semibold">{day.name}</span>
          </button>
          <button
            onClick={finish}
            disabled={!hasAnyLoggedSet || saved}
            className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saved ? 'Gespeichert ✓' : 'Beenden'}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Stat label="Dauer" value={formatDuration(elapsed)} accent />
          <Stat label="Volumen" value={`${totalVolume.toLocaleString('de-DE')} kg`} />
          <Stat label="Sätze" value={String(totalSets)} />
          <button
            onClick={cancelWorkout}
            className="rounded-full p-2 text-slate-500 hover:bg-white/5 hover:text-white"
            aria-label="Training abbrechen"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col px-4">
        {exercises.map((ex, idx) => {
          const lastSets = lastSetsBySlot.get(ex.slotId)
          const restRemaining = restTimers[ex.slotId] ?? REST_SECONDS
          return (
            <div key={ex.slotId} className={idx > 0 ? 'mt-6 border-t border-white/10 pt-6' : 'mt-5'}>
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
                    <DumbbellMini />
                  </div>
                  <button onClick={() => setPickerSlotId(ex.slotId)} className="min-w-0 text-left">
                    <p className="truncate text-base font-semibold text-brand-300">
                      {ex.exerciseName || 'Übung wählen'}
                    </p>
                  </button>
                </div>
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuSlotId(menuSlotId === ex.slotId ? null : ex.slotId)}
                    className="rounded-full p-1.5 text-slate-500 hover:bg-white/5 hover:text-white"
                    aria-label="Optionen"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="19" cy="12" r="1.8" />
                    </svg>
                  </button>
                  {menuSlotId === ex.slotId && (
                    <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-xl">
                      <button
                        onClick={() => {
                          setPickerSlotId(ex.slotId)
                          setMenuSlotId(null)
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
                      >
                        Übung ersetzen
                      </button>
                      <button
                        onClick={() => {
                          toggleNotes(ex.slotId)
                          setMenuSlotId(null)
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
                      >
                        {notesOpen.has(ex.slotId) ? 'Notiz ausblenden' : 'Notiz hinzufügen'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="mb-2 truncate text-xs text-slate-500">
                {ex.label} · Ziel {ex.targetSets} × {ex.repsMin}-{ex.repsMax}
              </p>

              {notesOpen.has(ex.slotId) && (
                <input
                  value={ex.notes ?? ''}
                  onChange={(e) => updateNotes(ex.slotId, e.target.value)}
                  placeholder="Notizen hier hinzufügen…"
                  className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:border-brand-400 focus:outline-none"
                />
              )}

              {ex.exerciseId ? (
                <>
                  <button
                    onClick={() => setRestTimers((r) => ({ ...r, [ex.slotId]: REST_SECONDS }))}
                    className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-400"
                  >
                    <ClockMini />
                    Pausentimer: {formatRest(restRemaining)}
                  </button>

                  <div className="grid grid-cols-[1.75rem_4.25rem_1fr_1fr_2.25rem] gap-2 px-1 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    <span>Satz</span>
                    <span>Vorherige</span>
                    <span>kg</span>
                    <span>Wdh.</span>
                    <span></span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {ex.sets.map((set, i) => {
                      const prev = lastSets?.[i]
                      const type = set.type ?? 'normal'
                      return (
                        <div key={i} className="grid grid-cols-[1.75rem_4.25rem_1fr_1fr_2.25rem] items-center gap-2">
                          <button
                            onClick={() => cycleSetType(ex.slotId, i)}
                            className={`text-sm font-semibold ${SET_TYPE_COLOR[type]}`}
                            title="Satztyp ändern (Normal/Warm-up/Failure/Dropset)"
                          >
                            {type === 'normal' ? set.setNumber : SET_TYPE_LABEL[type]}
                          </button>
                          <span className="truncate text-xs text-slate-500">
                            {prev ? `${prev.weight}kg × ${prev.reps}` : '—'}
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            value={set.weight}
                            onChange={(e) => updateSet(ex.slotId, i, { weight: Number(e.target.value) })}
                            className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-center text-sm text-white focus:border-brand-400 focus:outline-none"
                          />
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.reps}
                            onChange={(e) => updateSet(ex.slotId, i, { reps: Number(e.target.value) })}
                            className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-2 text-center text-sm text-white focus:border-brand-400 focus:outline-none"
                          />
                          <button
                            onClick={() => toggleSetCompleted(ex.slotId, i)}
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
                      )
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => addSet(ex.slotId)}
                      className="flex-1 rounded-lg border border-dashed border-white/15 py-1.5 text-xs font-medium text-slate-400 hover:border-white/30 hover:text-white"
                    >
                      + Satz hinzufügen
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
                </>
              ) : (
                <button
                  onClick={() => setPickerSlotId(ex.slotId)}
                  className="w-full rounded-xl border border-dashed border-white/20 py-3 text-sm text-slate-400 hover:border-brand-400 hover:text-brand-300"
                >
                  Übung auswählen, um Sätze zu erfassen
                </button>
              )}
            </div>
          )
        })}
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`text-base font-bold ${accent ? 'text-brand-400' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function DumbbellMini() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5 3 10l4 4 3.5-3.5" />
      <path d="M17.5 17.5 21 14l-4-4-3.5 3.5" />
      <path d="m9 15 6-6" />
    </svg>
  )
}

function ClockMini() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}
