import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import ExercisePicker from '../components/ExercisePicker'
import Barbell from '../components/Barbell'
import { DAY_CYCLE_LABELS, getDayIndexInCycle } from '../lib/schedule'
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

  async function handleNewPlan() {
    if (confirm('Neuen Plan erstellen? Dein aktueller Plan wird ersetzt (der Trainingsverlauf bleibt erhalten).')) {
      await clearPlan()
      navigate('/onboarding')
    }
  }

  const todayIndex = getDayIndexInCycle(plan.createdAt)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex items-center justify-between gap-3 pt-2">
        <div>
          <p className="text-xs font-medium text-brand-400">{plan.splitLabel}</p>
          <h1 className="mt-0.5 text-xl font-bold text-white">{plan.variantName}</h1>
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
                <span className={`text-[10px] ${isToday ? 'font-semibold text-brand-400' : 'text-slate-500'}`}>
                  {DAY_CYCLE_LABELS[i]}
                </span>
                <div
                  className={`flex h-10 w-full items-center justify-center rounded-lg text-[10px] font-medium ${
                    day ? 'bg-brand-500/70 text-white' : 'bg-white/5 text-slate-600'
                  } ${isToday ? 'ring-2 ring-brand-300' : ''}`}
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
            <div key={day.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <button
                onClick={() => setOpenDayId(isOpen ? null : day.id)}
                className="flex w-full items-center justify-between px-4 py-3.5"
              >
                <div className="text-left">
                  <p className="font-semibold text-white">{day.name}</p>
                  <p className="text-xs text-slate-500">{day.slots.length} Übungen</p>
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
                  className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3">
                  {day.slots.map((slot) => (
                    <button
                      key={slot.slotId}
                      onClick={() => setEditingSlot({ dayId: day.id, slot })}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-3 text-left hover:border-white/20"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs text-slate-500">{slot.label}</p>
                        <p className="truncate text-sm font-medium text-white">
                          {slot.exerciseName ?? 'Übung wählen'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-slate-300">
                          {slot.sets} × {slot.repsMin}-{slot.repsMax}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-500">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </section>

      <button
        onClick={handleNewPlan}
        className="rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-400 hover:border-white/20 hover:text-white"
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
