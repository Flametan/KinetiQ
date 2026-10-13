import { Navigate, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { dayLabel, getDayIndexInCycle } from '../lib/schedule'

export default function TrainingPage() {
  const plan = useAppStore((s) => s.activePlan)
  const sessions = useAppStore((s) => s.sessions)
  const navigate = useNavigate()

  if (!plan) return <Navigate to="/onboarding" replace />

  const todayIndex = getDayIndexInCycle(plan.createdAt)
  const suggestedDayId = plan.schedule[todayIndex]

  const lastSessionByDay = new Map<string, string>()
  for (const s of sessions) {
    if (!lastSessionByDay.has(s.planDayId)) lastSessionByDay.set(s.planDayId, s.date)
  }

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

      <section className="flex flex-col gap-3">
        {plan.days.map((day) => {
          const isSuggested = day.id === suggestedDayId
          const lastDate = lastSessionByDay.get(day.id)
          return (
            <button
              key={day.id}
              onClick={() => navigate(`/training/${day.id}`)}
              className={`flex items-center justify-between border p-4 text-left transition-colors ${
                isSuggested ? 'border-ink bg-white' : 'border-line bg-white hover:border-ink'
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
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}
