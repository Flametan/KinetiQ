import { Navigate, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export default function TrainingPage() {
  const plan = useAppStore((s) => s.activePlan)
  const sessions = useAppStore((s) => s.sessions)
  const navigate = useNavigate()

  if (!plan) return <Navigate to="/onboarding" replace />

  const todayIndex = (new Date().getDay() + 6) % 7 // 0 = Montag
  const suggestedDayId = plan.schedule[todayIndex]

  const lastSessionByDay = new Map<string, string>()
  for (const s of sessions) {
    if (!lastSessionByDay.has(s.planDayId)) lastSessionByDay.set(s.planDayId, s.date)
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="pt-2">
        <p className="text-xs font-medium text-brand-400">Training starten</p>
        <h1 className="mt-0.5 text-xl font-bold text-white">Was steht heute an?</h1>
        <p className="mt-1 text-sm text-slate-400">
          Heute ist {DAY_LABELS[todayIndex]} —{' '}
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
              className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                isSuggested
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div>
                <p className="font-semibold text-white">{day.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {day.slots.length} Übungen{lastDate ? ` · zuletzt ${formatDate(lastDate)}` : ''}
                </p>
              </div>
              {isSuggested && (
                <span className="rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-semibold text-white">
                  HEUTE
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
