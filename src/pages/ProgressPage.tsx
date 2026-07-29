import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import { getProgressForExercise, listLoggedExerciseIds } from '../lib/history'

export default function ProgressPage() {
  const sessions = useAppStore((s) => s.sessions)
  const loggedExercises = useMemo(() => listLoggedExerciseIds(sessions), [sessions])
  const [selectedId, setSelectedId] = useState<string | null>(loggedExercises[0]?.id ?? null)

  const activeId = selectedId ?? loggedExercises[0]?.id ?? null
  const progress = useMemo(
    () => (activeId ? getProgressForExercise(sessions, activeId) : []),
    [sessions, activeId],
  )

  const thisWeekCount = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    startOfWeek.setHours(0, 0, 0, 0)
    return sessions.filter((s) => new Date(s.date) >= startOfWeek).length
  }, [sessions])

  const chartData = progress.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
  }))

  const sessionsForExercise = activeId
    ? sessions.filter((s) => s.exercises.some((e) => e.exerciseId === activeId))
    : []

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="pt-2">
        <p className="text-xs font-medium text-brand-400">Fortschritt</p>
        <h1 className="mt-0.5 text-xl font-bold text-white">Dein Trainingsverlauf</h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Trainings gesamt" value={sessions.length} />
        <StatCard label="Diese Woche" value={thisWeekCount} />
      </section>

      {loggedExercises.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
          Noch keine Trainings geloggt. Starte dein erstes Training, um hier deinen Fortschritt zu sehen.
        </div>
      ) : (
        <>
          <section>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Übung
            </label>
            <select
              value={activeId ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white focus:border-brand-400 focus:outline-none"
            >
              {loggedExercises.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </section>

          {chartData.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Maximalgewicht pro Training (kg)
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      stroke="#598eff"
                      strokeWidth={2.5}
                      dot={{ fill: '#598eff', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verlauf</p>
            {sessionsForExercise.map((session) => {
              const entry = session.exercises.find((e) => e.exerciseId === activeId)!
              return (
                <div key={session.id} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{session.dayName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(session.date).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.sets.map((set, i) => (
                      <span
                        key={i}
                        className={`rounded-md px-2 py-1 text-xs ${
                          set.completed ? 'bg-brand-500/15 text-brand-200' : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        {set.reps} × {set.weight}kg
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  )
}
