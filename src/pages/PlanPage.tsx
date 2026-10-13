import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import ExercisePicker from '../components/ExercisePicker'
import Barbell from '../components/Barbell'
import { DAY_CYCLE_LABELS, getDayIndexInCycle, getMesocycleWeek, isDeloadWeek } from '../lib/schedule'
import { generateId } from '../utils/id'
import type { UserPlanSlot } from '../types'

export default function PlanPage() {
  const plan = useAppStore((s) => s.activePlan)
  const allPlans = useAppStore((s) => s.allPlans)
  const settings = useAppStore((s) => s.settings)
  const updatePlan = useAppStore((s) => s.updatePlan)
  const switchPlan = useAppStore((s) => s.switchPlan)
  const removePlan = useAppStore((s) => s.removePlan)
  const navigate = useNavigate()
  const [openDayId, setOpenDayId] = useState<string | null>(null)
  const [editingSlot, setEditingSlot] = useState<{ dayId: string; slot: UserPlanSlot } | null>(null)
  const [showOtherPlans, setShowOtherPlans] = useState(false)

  if (!plan) return <Navigate to="/onboarding" replace />

  function selectExercise(dayId: string, slotId: string, ex: { id: string; name: string }) {
    updatePlan((p) => ({
      ...p,
      days: p.days.map((d) =>
        d.id !== dayId
          ? d
          : {
              ...d,
              slots: d.slots.map((s) =>
                s.slotId !== slotId ? s : { ...s, exerciseId: ex.id, exerciseName: ex.name },
              ),
            },
      ),
    }))
  }

  function toggleSuperset(dayId: string, index: number) {
    updatePlan((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.id !== dayId) return d
        const a = d.slots[index]
        const b = d.slots[index + 1]
        if (!b) return d
        const connected = !!a.supersetGroup && a.supersetGroup === b.supersetGroup
        if (connected) {
          const groupId = a.supersetGroup
          let cut = false
          return {
            ...d,
            slots: d.slots.map((s, i) => {
              if (i === index + 1) cut = true
              return cut && s.supersetGroup === groupId ? { ...s, supersetGroup: null } : s
            }),
          }
        }
        const groupId = a.supersetGroup ?? generateId('ss')
        return {
          ...d,
          slots: d.slots.map((s, i) => (i === index || i === index + 1 ? { ...s, supersetGroup: groupId } : s)),
        }
      }),
    }))
  }

  function moveSlot(dayId: string, index: number, direction: -1 | 1) {
    updatePlan((p) => ({
      ...p,
      days: p.days.map((d) => {
        if (d.id !== dayId) return d
        const target = index + direction
        if (target < 0 || target >= d.slots.length) return d
        const slots = [...d.slots]
        ;[slots[index], slots[target]] = [slots[target], slots[index]]
        return { ...d, slots }
      }),
    }))
  }

  function handleNewPlan() {
    if (confirm('Neuen Plan erstellen? Der aktuelle Plan wird archiviert (nicht gelöscht) und kann jederzeit wieder aktiviert werden. Der Trainingsverlauf bleibt in jedem Fall erhalten.')) {
      navigate('/onboarding')
    }
  }

  async function handleDeletePlan(id: string, name: string) {
    if (confirm(`"${name}" endgültig löschen? Der dazugehörige Trainingsverlauf bleibt erhalten, der Plan selbst nicht.`)) {
      await removePlan(id)
    }
  }

  const todayIndex = getDayIndexInCycle(plan.createdAt)
  const deloadActive = settings.deloadEnabled && isDeloadWeek(plan.createdAt, settings.deloadIntervalWeeks)
  const mesoWeek = getMesocycleWeek(plan.createdAt)
  const archivedPlans = allPlans.filter((p) => p.id !== plan.id)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex items-center justify-between gap-3 border-b-[3px] border-ink pb-4 pt-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">{plan.splitLabel}</p>
          <h1 className="font-display mt-1 text-[26px] uppercase leading-[0.95] text-ink">{plan.variantName}</h1>
        </div>
        <Barbell plates={plan.daysPerWeek} size="md" />
      </header>

      {deloadActive && (
        <div className="border border-brand-400 bg-panel2 px-4 py-3">
          <p className="text-sm font-semibold text-brand-400">Deload-Woche (Woche {mesoWeek})</p>
          <p className="mt-0.5 text-xs text-dim">Gewichtsvorschläge im Training sind diese Woche automatisch ~10% reduziert.</p>
        </div>
      )}

      <section>
        <div className="flex gap-1.5">
          {plan.schedule.map((dayId, i) => {
            const day = plan.days.find((d) => d.id === dayId)
            const isToday = i === todayIndex
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className={`text-[10px] font-semibold ${isToday ? 'text-brand-400' : 'text-dim'}`}>
                  {DAY_CYCLE_LABELS[i]}
                </span>
                <div
                  className={`flex h-10 w-full items-center justify-center text-[10px] font-medium ${
                    day ? 'bg-brand-500 text-white' : 'bg-panel2 text-dim'
                  } ${isToday ? 'ring-2 ring-ink ring-offset-1 ring-offset-paper' : ''}`}
                >
                  {day ? '' : '–'}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {plan.days.map((day) => {
          const isOpen = openDayId === day.id
          return (
            <div key={day.id} className="overflow-hidden border border-line bg-surface">
              <button
                onClick={() => setOpenDayId(isOpen ? null : day.id)}
                className="flex w-full items-center justify-between px-4 py-3.5"
              >
                <div className="text-left">
                  <p className="font-display text-base text-ink">{day.name}</p>
                  <p className="text-xs text-dim">{day.slots.length} Übungen</p>
                </div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-dim transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isOpen && (
                <div className="flex flex-col border-t border-line px-4 py-3">
                  {day.slots.map((slot, i) => {
                    const next = day.slots[i + 1]
                    const connected = !!next && !!slot.supersetGroup && slot.supersetGroup === next.supersetGroup
                    const canReorder = !slot.supersetGroup
                    return (
                      <div key={slot.slotId} className="flex flex-col gap-2">
                        <div
                          className={`flex items-stretch gap-2 border bg-panel2 ${
                            slot.supersetGroup ? 'border-brand-300' : 'border-line'
                          }`}
                        >
                          <div className="flex flex-col border-r border-line">
                            <button
                              onClick={() => moveSlot(day.id, i, -1)}
                              disabled={i === 0 || !canReorder}
                              className="flex flex-1 items-center justify-center px-1.5 text-dim hover:text-ink disabled:opacity-25"
                              aria-label="Nach oben verschieben"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <path d="m18 15-6-6-6 6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveSlot(day.id, i, 1)}
                              disabled={i === day.slots.length - 1 || !canReorder}
                              className="flex flex-1 items-center justify-center border-t border-line px-1.5 text-dim hover:text-ink disabled:opacity-25"
                              aria-label="Nach unten verschieben"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </button>
                          </div>
                          <button
                            onClick={() => setEditingSlot({ dayId: day.id, slot })}
                            className="flex flex-1 items-center justify-between gap-3 px-3.5 py-3 text-left"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs text-dim">{slot.label}</p>
                              <p className="truncate text-sm font-semibold text-ink">
                                {slot.exerciseName ?? 'Übung wählen'}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="border border-line bg-surface px-2 py-1 text-xs font-semibold text-dim">
                                {slot.sets} × {slot.repsMin}-{slot.repsMax}
                              </span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-dim">
                                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                            </div>
                          </button>
                        </div>
                        {next && (
                          <button
                            onClick={() => toggleSuperset(day.id, i)}
                            className={`mx-auto flex items-center gap-1 px-3 py-1 text-[11px] font-semibold ${
                              connected ? 'text-brand-400' : 'text-dim hover:text-ink'
                            }`}
                          >
                            {connected ? '⛓ Verbunden – trennen' : '+ Als Superset verbinden'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </section>

      {archivedPlans.length > 0 && (
        <section>
          <button
            onClick={() => setShowOtherPlans((v) => !v)}
            className="flex w-full items-center justify-between border border-line bg-surface px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold text-ink">Andere Pläne ({archivedPlans.length})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`text-dim transition-transform ${showOtherPlans ? 'rotate-180' : ''}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {showOtherPlans && (
            <div className="mt-2 flex flex-col gap-2">
              {archivedPlans.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 border border-line bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{p.variantName}</p>
                    <p className="truncate text-xs text-dim">{p.splitLabel}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => switchPlan(p.id)}
                      className="border border-ink px-3 py-1.5 text-xs font-semibold text-ink hover:bg-panel2"
                    >
                      Aktivieren
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p.id, p.variantName)}
                      className="border border-line px-2 py-1.5 text-xs font-semibold text-dim hover:text-brand-400"
                      aria-label="Plan löschen"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <button
        onClick={handleNewPlan}
        className="border border-line py-3 text-sm font-semibold text-dim hover:border-ink hover:text-ink"
      >
        Neuen Plan erstellen
      </button>

      {editingSlot && (
        <ExercisePicker
          open
          onClose={() => setEditingSlot(null)}
          label={editingSlot.slot.label}
          movementPatternIds={editingSlot.slot.movementPatternIds}
          currentExerciseId={editingSlot.slot.exerciseId}
          onSelect={(ex) => selectExercise(editingSlot.dayId, editingSlot.slot.slotId, ex)}
        />
      )}
    </div>
  )
}
