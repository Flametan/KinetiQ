import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { dayLabel, getDayIndexInCycle, getMesocycleWeek, isDeloadWeek } from '../lib/schedule'

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export default function TrainingPage() {
  const plan = useAppStore((s) => s.activePlan)
  const sessions = useAppStore((s) => s.sessions)
  const settings = useAppStore((s) => s.settings)
  const navigate = useNavigate()

  const todayIndex = plan ? getDayIndexInCycle(plan.createdAt) : 0
  const suggestedDayId = plan ? plan.schedule[todayIndex] : null
  const trainedToday = sessions.some((s) => isToday(s.date))

  useEffect(() => {
    if (!plan || !settings.remindersEnabled || !suggestedDayId || trainedToday) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const key = `kinetiq-reminder-${new Date().toDateString()}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    const dayName = plan.days.find((d) => d.id === suggestedDayId)?.name ?? 'Training'
    new Notification('KinetiQ', { body: `Heute steht an: ${dayName}` })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, settings.remindersEnabled, suggestedDayId, trainedToday])

  if (!plan) return <Navigate to="/onboarding" replace />

  const lastSessionByDay = new Map<string, string>()
  for (const s of sessions) {
    if (!lastSessionByDay.has(s.planDayId)) lastSessionByDay.set(s.planDayId, s.date)
  }

  const deloadActive = settings.deloadEnabled && isDeloadWeek(plan.createdAt, settings.deloadIntervalWeeks)
  const mesoWeek = getMesocycleWeek(plan.createdAt)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="pt-2">
        <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">Training starten</p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-[0.95] text-ink">Was steht heute an?</h1>
        <p className="mt-2 text-sm text-dim">
          Heute ist {dayLabel(todayIndex)} deines Zyklus —{' '}
          {suggestedDayId
            ? `geplant: ${plan.days.find((d) => d.id === suggestedDayId)?.name}`
            : 'eigentlich Ruhetag, du kannst aber trotzdem trainieren'}
        </p>
      </header>

      {deloadActive && (
        <div className="border border-brand-400 bg-panel2 px-4 py-3">
          <p className="text-sm font-semibold text-brand-400">Deload-Woche (Woche {mesoWeek})</p>
          <p className="mt-0.5 text-xs text-dim">Gewichtsvorschläge sind diese Woche automatisch ~10% reduziert.</p>
        </div>
      )}

      {settings.remindersEnabled && suggestedDayId && !trainedToday && (
        <div className="border border-ink bg-ink px-4 py-3 text-on-ink">
          <p className="text-sm font-semibold">Heute steht ein Training an</p>
          <p className="mt-0.5 text-xs opacity-70">Du hast heute noch nicht trainiert.</p>
        </div>
      )}

      <section className="flex flex-col gap-3">
        {plan.days.map((day) => {
          const isSuggested = day.id === suggestedDayId
          const lastDate = lastSessionByDay.get(day.id)
          return (
            <button
              key={day.id}
              onClick={() => navigate(`/training/${day.id}`)}
              className={`press flex items-center justify-between border p-4 text-left transition-colors ${
                isSuggested ? 'border-ink bg-surface' : 'border-line bg-surface hover:border-ink'
              }`}
            >
              <div>
                <p className="font-display text-base text-ink">{day.name}</p>
                <p className="mt-0.5 text-xs text-dim">
                  {day.slots.length} Übungen{lastDate ? ` · zuletzt ${formatDate(lastDate)}` : ''}
                </p>
              </div>
              {isSuggested && (
                <span className="bg-brand-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Heute
                </span>
              )}
            </button>
          )
        })}
      </section>

      <button
        onClick={() => navigate('/interval')}
        className="border border-dashed border-line py-3 text-sm font-semibold text-dim hover:border-ink hover:text-ink"
      >
        Zirkel-/EMOM-Training starten
      </button>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}
