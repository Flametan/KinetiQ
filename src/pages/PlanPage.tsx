import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import DayEditSheet from '../components/DayEditSheet'
import Barbell from '../components/Barbell'
import ConfirmDialog from '../components/ConfirmDialog'
import { DAY_CYCLE_LABELS, getDayIndexInCycle, getMesocycleWeek, isDeloadWeek, isToday } from '../lib/schedule'
import { generateId } from '../utils/id'
import type { UserPlanSlot } from '../types'

interface PendingConfirm {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
}

export default function PlanPage() {
  const plan = useAppStore((s) => s.activePlan)
  const allPlans = useAppStore((s) => s.allPlans)
  const sessions = useAppStore((s) => s.sessions)
  const settings = useAppStore((s) => s.settings)
  const updatePlan = useAppStore((s) => s.updatePlan)
  const switchPlan = useAppStore((s) => s.switchPlan)
  const removePlan = useAppStore((s) => s.removePlan)
  const navigate = useNavigate()
  const [editingDayId, setEditingDayId] = useState<string | null>(null)
  const [editingSlot, setEditingSlot] = useState<{ dayId: string; slot: UserPlanSlot } | null>(null)
  const [showOtherPlans, setShowOtherPlans] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)

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
    setPendingConfirm({
      title: 'Neuen Plan erstellen?',
      message: 'Der aktuelle Plan wird archiviert (nicht gelöscht) und kann jederzeit wieder aktiviert werden. Der Trainingsverlauf bleibt in jedem Fall erhalten.',
      confirmLabel: 'Erstellen',
      onConfirm: () => navigate('/onboarding'),
    })
  }

  function handleDeletePlan(id: string, name: string) {
    setPendingConfirm({
      title: `"${name}" löschen?`,
      message: 'Der dazugehörige Trainingsverlauf bleibt erhalten, der Plan selbst nicht – das lässt sich nicht rückgängig machen.',
      confirmLabel: 'Löschen',
      danger: true,
      onConfirm: () => removePlan(id),
    })
  }

  const todayIndex = getDayIndexInCycle(plan.createdAt)
  const suggestedDayId = plan.schedule[todayIndex]
  const suggestedDay = plan.days.find((d) => d.id === suggestedDayId)
  const trainedToday = sessions.some((s) => isToday(s.date))
  const deloadActive = settings.deloadEnabled && isDeloadWeek(plan.createdAt, settings.deloadIntervalWeeks)
  const mesoWeek = getMesocycleWeek(plan.createdAt)
  const archivedPlans = allPlans.filter((p) => p.id !== plan.id)
  const editingDay = plan.days.find((d) => d.id === editingDayId)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">{plan.splitLabel}</p>
          <h1 className="font-display mt-1 text-xl uppercase leading-[0.95] text-ink">{plan.variantName}</h1>
        </div>
        <Barbell plates={plan.daysPerWeek} size="sm" />
      </header>

      {suggestedDay ? (
        trainedToday ? (
          <button
            onClick={() => navigate('/training')}
            className="press flex items-center justify-between gap-3 border border-ink bg-surface p-5 text-left"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">Heute erledigt ✓</p>
              <p className="font-display mt-1 text-lg text-ink">{suggestedDay.name}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-dim">Nochmal trainieren →</span>
          </button>
        ) : (
          <button
            onClick={() => navigate(`/training/${suggestedDay.id}`)}
            className="press flex items-center justify-between gap-3 border border-ink bg-ink p-5 text-left text-on-ink"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[.1em] opacity-70">Heute</p>
              <p className="font-display mt-1 text-xl uppercase">{suggestedDay.name}</p>
              <p className="mt-0.5 text-xs opacity-70">{suggestedDay.slots.length} Übungen</p>
            </div>
            <span className="icon-btn bg-brand-500 text-white" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )
      ) : (
        <div className="flex items-center justify-between gap-3 border border-line bg-panel2 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.1em] text-dim">Heute</p>
            <p className="font-display mt-1 text-lg text-ink">Ruhetag</p>
          </div>
          <button onClick={() => navigate('/training')} className="press text-xs font-semibold text-ink hover:text-brand-400">
            Trotzdem trainieren →
          </button>
        </div>
      )}

      {deloadActive && (
        <div className="rounded-2xl border border-brand-400 bg-panel2 px-4 py-3">
          <p className="text-sm font-semibold text-brand-400">Deload-Woche (Woche {mesoWeek})</p>
          <p className="mt-0.5 text-xs text-dim">Gewichtsvorschläge im Training sind diese Woche automatisch ~10% reduziert.</p>
        </div>
      )}

      <section>
        <div className="flex gap-1.5">
          {plan.schedule.map((dayId, i) => {
            const day = plan.days.find((d) => d.id === dayId)
            const isTodayCol = i === todayIndex
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className={`text-[10px] font-semibold ${isTodayCol ? 'text-brand-400' : 'text-dim'}`}>
                  {DAY_CYCLE_LABELS[i]}
                </span>
                <div
                  className={`flex h-10 w-full items-center justify-center rounded-xl text-[10px] font-medium ${
                    day ? 'bg-brand-500 text-white' : 'bg-panel2 text-dim'
                  } ${isTodayCol ? 'ring-2 ring-ink ring-offset-1 ring-offset-paper' : ''}`}
                >
                  {day ? '' : '–'}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-[.1em] text-dim">Deine Trainingstage</h2>
        {plan.days.map((day) => {
          const names = day.slots.map((s) => s.exerciseName).filter((n): n is string => !!n)
          const preview = names.slice(0, 3).join(' · ') + (names.length > 3 ? ` +${names.length - 3} weitere` : '')
          return (
            <button
              key={day.id}
              onClick={() => setEditingDayId(day.id)}
              className="press flex items-center justify-between gap-3 border border-line bg-surface px-4 py-3.5 text-left hover:border-ink"
            >
              <div className="min-w-0">
                <p className="font-display text-base text-ink">{day.name}</p>
                <p className="mt-0.5 truncate text-xs text-dim">{preview || `${day.slots.length} Übungen auswählen`}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-dim">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          )
        })}
      </section>

      {archivedPlans.length > 0 && (
        <section>
          <button
            onClick={() => setShowOtherPlans((v) => !v)}
            className="press flex w-full items-center justify-between border border-line bg-surface px-4 py-3 text-left"
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
                      className="press border border-ink px-3 py-1.5 text-xs font-semibold text-ink hover:bg-panel2"
                    >
                      Aktivieren
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p.id, p.variantName)}
                      className="icon-btn press border border-line text-dim hover:text-brand-400"
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
        className="press rounded-full border border-line py-3 text-sm font-semibold text-dim hover:border-ink hover:text-ink"
      >
        Neuen Plan erstellen
      </button>

      {editingDay && (
        <DayEditSheet
          day={editingDay}
          onClose={() => setEditingDayId(null)}
          onSelectExercise={selectExercise}
          onToggleSuperset={toggleSuperset}
          onMoveSlot={moveSlot}
          editingSlot={editingSlot}
          onOpenPicker={(dayId, slot) => setEditingSlot({ dayId, slot })}
          onClosePicker={() => setEditingSlot(null)}
        />
      )}

      <ConfirmDialog
        open={!!pendingConfirm}
        title={pendingConfirm?.title ?? ''}
        message={pendingConfirm?.message ?? ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        danger={pendingConfirm?.danger}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          pendingConfirm?.onConfirm()
          setPendingConfirm(null)
        }}
      />
    </div>
  )
}
