import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import ExercisePicker from '../components/ExercisePicker'
import Barbell from '../components/Barbell'
import { DAY_CYCLE_LABELS, getDayIndexInCycle } from '../lib/schedule'
import { generateId } from '../utils/id'
import type { UserPlanSlot } from '../types'

export default function PlanPage() {
  const plan = useAppStore((s) => s.activePlan)
  const updatePlan = useAppStore((s) => s.updatePlan)
  const clearPlan = useAppStore((s) => s.clearPlan)
  const navigate = useNavigate()
  const [openDayId, setOpenDayId] = useState<string | null>(null)
  const [editingSlot, setEditingSlot] = useState<{ dayId: string; slot: UserPlanSlot } | null>(null)

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

  async function handleNewPlan() {
    if (confirm('Neuen Plan erstellen? Dein aktueller Plan wird ersetzt (der Trainingsverlauf bleibt erhalten).')) {
      await clearPlan()
      navigate('/onboarding')
    }
  }

  const todayIndex = getDayIndexInCycle(plan.createdAt)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex items-center justify-between gap-3 border-b-[3px] border-ink pb-4 pt-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">{plan.splitLabel}</p>
          <h1 className="font-display mt-1 text-[26px] uppercase leading-[0.95] text-ink">{plan.variantName}</h1>
        </div>
        <Barbell plates={plan.daysPerWeek} size="md" />
      </header>

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
            <div key={day.id} className="overflow-hidden border border-line bg-white">
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
                    return (
                      <div key={slot.slotId} className="flex flex-col gap-2">
                        <button
                          onClick={() => setEditingSlot({ dayId: day.id, slot })}
                          className={`flex items-center justify-between gap-3 border bg-panel2 px-3.5 py-3 text-left hover:border-ink ${
                            slot.supersetGroup ? 'border-brand-300' : 'border-line'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs text-dim">{slot.label}</p>
                            <p className="truncate text-sm font-semibold text-ink">
                              {slot.exerciseName ?? 'Übung wählen'}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="border border-line bg-white px-2 py-1 text-xs font-semibold text-dim">
                              {slot.sets} × {slot.repsMin}-{slot.repsMax}
                            </span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-dim">
                              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </div>
                        </button>
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
