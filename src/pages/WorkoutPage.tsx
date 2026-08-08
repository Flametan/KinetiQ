import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getLastSetsForExercise, getPersonalRecords } from '../lib/history'
import { groupBySuperset } from '../lib/superset'
import { suggestWarmupSets } from '../lib/warmup'
import { playRestEndSound } from '../lib/sound'
import { generateId } from '../utils/id'
import ExercisePicker from '../components/ExercisePicker'
import PlateCalculatorModal from '../components/PlateCalculatorModal'
import type { ExerciseLogEntry, SetEntry, SetType } from '../types'

const DEFAULT_REST_SECONDS = 120
const RPE_OPTIONS = [5, 6, 7, 8, 9, 10]

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
  const updatePlan = useAppStore((s) => s.updatePlan)
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

  const bestWeightBaseline = useMemo(() => {
    const map = new Map<string, number>()
    if (day) {
      const exerciseIds = new Set(day.slots.map((s) => s.exerciseId).filter((id): id is string => !!id))
      for (const id of exerciseIds) map.set(id, getPersonalRecords(sessions, id).bestWeight)
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
        supersetGroup: slot.supersetGroup ?? null,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day?.id])

  const [exercises, setExercises] = useState<ExerciseLogEntry[]>(initialExercises)
  const [pickerSlotId, setPickerSlotId] = useState<string | null>(null)
  const [menuSlotId, setMenuSlotId] = useState<string | null>(null)
  const [notesOpen, setNotesOpen] = useState<Set<string>>(new Set())
  const [rpeOpen, setRpeOpen] = useState<Set<string>>(new Set())
  const [plateModal, setPlateModal] = useState<{ weight: number } | null>(null)
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [restTimers, setRestTimers] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(false)
  const [finishSummary, setFinishSummary] = useState<{ prs: { name: string; weight: number }[] } | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
      setRestTimers((prev) => {
        let changed = false
        let anyFinished = false
        const next: Record<string, number> = {}
        for (const [key, remaining] of Object.entries(prev)) {
          if (remaining > 0) {
            const nr = remaining - 1
            next[key] = nr
            changed = true
            if (nr === 0) anyFinished = true
          } else {
            next[key] = remaining
          }
        }
        if (anyFinished) playRestEndSound()
        return changed ? next : prev
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  if (!plan) return <Navigate to="/onboarding" replace />
  if (!day) return <Navigate to="/training" replace />

  const planSlot = (slotId: string) => day.slots.find((s) => s.slotId === slotId)!
  const restSecondsFor = (slotId: string) => planSlot(slotId).restSeconds ?? DEFAULT_REST_SECONDS

  function updateSet(slotId: string, setIndex: number, patch: Partial<SetEntry>) {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.slotId !== slotId
          ? ex
          : { ...ex, sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s)) },
      ),
    )
  }

  function toggleSetCompleted(ex: ExerciseLogEntry, setIndex: number, isLastInGroup: boolean, groupKey: string) {
    let willBeCompleted = false
    setExercises((prev) =>
      prev.map((e) => {
        if (e.slotId !== ex.slotId) return e
        return {
          ...e,
          sets: e.sets.map((s, i) => {
            if (i !== setIndex) return s
            willBeCompleted = !s.completed
            return { ...s, completed: willBeCompleted }
          }),
        }
      }),
    )
    if (willBeCompleted && isLastInGroup) {
      setRestTimers((r) => ({ ...r, [groupKey]: restSecondsFor(ex.slotId) }))
    }
  }

  function adjustRest(groupKey: string, lastSlotId: string, delta: number) {
    const next = Math.max(15, restSecondsFor(lastSlotId) + delta)
    updatePlan((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id !== day!.id
          ? d
          : { ...d, slots: d.slots.map((s) => (s.slotId === lastSlotId ? { ...s, restSeconds: next } : s)) },
      ),
    }))
    setRestTimers((r) => (r[groupKey] !== undefined && r[groupKey] > 0 ? { ...r, [groupKey]: next } : r))
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

  function addWarmupSets(ex: ExerciseLogEntry) {
    const workingSet = ex.sets.find((s) => (s.type ?? 'normal') !== 'warmup' && s.weight > 0)
    if (!workingSet) {
      alert('Trag zuerst ein Arbeitsgewicht ein, dann kann ich Aufwärmsätze vorschlagen.')
      return
    }
    const suggestions = suggestWarmupSets(workingSet.weight)
    if (suggestions.length === 0) return
    setExercises((prev) =>
      prev.map((e) => {
        if (e.slotId !== ex.slotId) return e
        const warmupSets: SetEntry[] = suggestions.map((s) => ({ ...s, completed: false, type: 'warmup', setNumber: 0 }))
        return { ...e, sets: [...warmupSets, ...e.sets].map((s, i) => ({ ...s, setNumber: i + 1 })) }
      }),
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

  function toggleInSet(setState: Set<string>, setter: (s: Set<string>) => void, slotId: string) {
    const next = new Set(setState)
    if (next.has(slotId)) next.delete(slotId)
    else next.add(slotId)
    setter(next)
  }

  async function finish() {
    const completedExercises = exercises.filter((e) => e.exerciseId)
    const newPRs: { name: string; weight: number }[] = []
    for (const ex of completedExercises) {
      const working = ex.sets.filter((s) => s.completed && s.weight > 0 && (s.type ?? 'normal') !== 'warmup')
      if (working.length === 0) continue
      const maxWeight = Math.max(...working.map((s) => s.weight))
      const priorBest = bestWeightBaseline.get(ex.exerciseId) ?? 0
      if (priorBest > 0 && maxWeight > priorBest) newPRs.push({ name: ex.exerciseName, weight: maxWeight })
    }
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
    if (newPRs.length > 0) {
      setFinishSummary({ prs: newPRs })
    } else {
      setTimeout(() => navigate('/progress'), 900)
    }
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
  const blocks = groupBySuperset(exercises)

  function renderExerciseBody(ex: ExerciseLogEntry) {
    const lastSets = lastSetsBySlot.get(ex.slotId)
    const priorBest = bestWeightBaseline.get(ex.exerciseId) ?? 0

    return (
      <div>
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
              <DumbbellMini />
            </div>
            <button onClick={() => setPickerSlotId(ex.slotId)} className="min-w-0 text-left">
              <p className="truncate text-base font-semibold text-brand-300">{ex.exerciseName || 'Übung wählen'}</p>
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
              <div className="absolute right-0 z-10 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-xl">
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
                    toggleInSet(notesOpen, setNotesOpen, ex.slotId)
                    setMenuSlotId(null)
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  {notesOpen.has(ex.slotId) ? 'Notiz ausblenden' : 'Notiz hinzufügen'}
                </button>
                <button
                  onClick={() => {
                    toggleInSet(rpeOpen, setRpeOpen, ex.slotId)
                    setMenuSlotId(null)
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  {rpeOpen.has(ex.slotId) ? 'RPE ausblenden' : 'RPE anzeigen'}
                </button>
                <button
                  onClick={() => {
                    addWarmupSets(ex)
                    setMenuSlotId(null)
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  Aufwärmsätze vorschlagen
                </button>
                <button
                  onClick={() => {
                    setPlateModal({ weight: ex.sets.find((s) => s.weight > 0)?.weight ?? 20 })
                    setMenuSlotId(null)
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  Plattenrechner
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
                const isPR = set.completed && type !== 'warmup' && priorBest > 0 && set.weight > priorBest
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="grid grid-cols-[1.75rem_4.25rem_1fr_1fr_2.25rem] items-center gap-2">
                      <button
                        onClick={() => cycleSetType(ex.slotId, i)}
                        className={`text-sm font-semibold ${SET_TYPE_COLOR[type]}`}
                        title="Satztyp ändern (Normal/Warm-up/Failure/Dropset)"
                      >
                        {type === 'normal' ? set.setNumber : SET_TYPE_LABEL[type]}
                      </button>
                      <span className="truncate text-xs text-slate-500">
                        {prev ? `${prev.weight}kg × ${prev.reps}` : '—'} {isPR ? '🏆' : ''}
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
                        onClick={() => {
                          const block = blocks.find((b) => b.some((e) => e.slotId === ex.slotId)) ?? [ex]
                          const isLast = block.at(-1)!.slotId === ex.slotId
                          const groupKey = ex.supersetGroup ?? ex.slotId
                          toggleSetCompleted(ex, i, isLast, groupKey)
                        }}
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
                    {rpeOpen.has(ex.slotId) && (
                      <div className="flex items-center gap-1 pl-9">
                        <span className="mr-1 text-[10px] text-slate-600">RPE</span>
                        {RPE_OPTIONS.map((v) => (
                          <button
                            key={v}
                            onClick={() => updateSet(ex.slotId, i, { rpe: set.rpe === v ? undefined : v })}
                            className={`h-6 w-6 rounded-md text-[11px] font-medium transition-colors ${
                              set.rpe === v ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    )}
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
  }

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
        {blocks.map((block, blockIdx) => {
          const isGrouped = block.length > 1
          const lastEx = block.at(-1)!
          const groupKey = lastEx.supersetGroup ?? lastEx.slotId
          const restDefault = restSecondsFor(lastEx.slotId)
          const restRemaining = restTimers[groupKey] ?? restDefault
          const allHaveExercise = block.every((e) => e.exerciseId)

          return (
            <div key={groupKey + blockIdx} className={blockIdx > 0 ? 'mt-6 border-t border-white/10 pt-6' : 'mt-5'}>
              {isGrouped && (
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-300">
                  <SupersetIcon />
                  Superset
                </div>
              )}
              <div
                className={isGrouped ? 'flex flex-col gap-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3' : ''}
              >
                {block.map((ex) => (
                  <div key={ex.slotId}>{renderExerciseBody(ex)}</div>
                ))}
              </div>
              {allHaveExercise && (
                <div className="mt-2 flex items-center gap-2">
                  <ClockMini />
                  <span className="text-sm font-medium text-brand-400">Pausentimer: {formatRest(restRemaining)}</span>
                  <button
                    onClick={() => adjustRest(groupKey, lastEx.slotId, -15)}
                    className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                  >
                    −15s
                  </button>
                  <button
                    onClick={() => adjustRest(groupKey, lastEx.slotId, 15)}
                    className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                  >
                    +15s
                  </button>
                  <button
                    onClick={() => setRestTimers((r) => ({ ...r, [groupKey]: restDefault }))}
                    className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                  >
                    Neu starten
                  </button>
                </div>
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

      {plateModal && (
        <PlateCalculatorModal open onClose={() => setPlateModal(null)} initialWeight={plateModal.weight} />
      )}

      {finishSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-sm rounded-3xl border border-brand-500/30 bg-slate-900 p-6 text-center">
            <p className="text-3xl">🎉</p>
            <h2 className="mt-2 text-lg font-bold text-white">Neue Rekorde!</h2>
            <div className="mt-4 flex flex-col gap-2 text-left">
              {finishSummary.prs.map((pr, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span className="text-sm text-slate-200">{pr.name}</span>
                  <span className="text-sm font-semibold text-brand-300">{pr.weight} kg 🏆</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/progress')}
              className="mt-5 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white"
            >
              Weiter
            </button>
          </div>
        </div>
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function SupersetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 6-4 4M6 18l4-4M8 6l10 10" />
    </svg>
  )
}
