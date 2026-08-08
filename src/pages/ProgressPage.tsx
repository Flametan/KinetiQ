import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import {
  computeStreak,
  getMuscleBalance,
  getPersonalRecords,
  getProgressForExercise,
  getTrainedDaySet,
  listLoggedExerciseIds,
} from '../lib/history'
import { generateId } from '../utils/id'
import CalendarHeatmap from '../components/CalendarHeatmap'
import type { WorkoutSession } from '../types'

type View = 'exercise' | 'history' | 'calendar' | 'balance' | 'bodyweight'

const VIEWS: { id: View; label: string }[] = [
  { id: 'exercise', label: 'Nach Übung' },
  { id: 'history', label: 'Trainingshistorie' },
  { id: 'calendar', label: 'Kalender' },
  { id: 'balance', label: 'Balance' },
  { id: 'bodyweight', label: 'Körpergewicht' },
]

export default function ProgressPage() {
  const sessions = useAppStore((s) => s.sessions)
  const customExercises = useAppStore((s) => s.customExercises)
  const loggedExercises = useMemo(() => listLoggedExerciseIds(sessions), [sessions])
  const [selectedId, setSelectedId] = useState<string | null>(loggedExercises[0]?.id ?? null)
  const [metric, setMetric] = useState<'maxWeight' | 'estimated1RM'>('maxWeight')
  const [view, setView] = useState<View>('exercise')

  const activeId = selectedId ?? loggedExercises[0]?.id ?? null
  const progress = useMemo(
    () => (activeId ? getProgressForExercise(sessions, activeId) : []),
    [sessions, activeId],
  )
  const records = useMemo(
    () => (activeId ? getPersonalRecords(sessions, activeId) : null),
    [sessions, activeId],
  )

  const thisWeekCount = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    startOfWeek.setHours(0, 0, 0, 0)
    return sessions.filter((s) => new Date(s.date) >= startOfWeek).length
  }, [sessions])

  const streak = useMemo(() => computeStreak(sessions), [sessions])
  const trainedDays = useMemo(() => getTrainedDaySet(sessions), [sessions])
  const muscleBalance = useMemo(() => getMuscleBalance(sessions, customExercises, 7), [sessions, customExercises])

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

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Trainings gesamt" value={sessions.length} />
        <StatCard label="Diese Woche" value={thisWeekCount} />
        <StatCard label="Serie (Tage)" value={streak} />
      </section>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
          Noch keine Trainings geloggt. Starte dein erstes Training, um hier deinen Fortschritt zu sehen.
        </div>
      ) : (
        <>
          <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  view === v.id ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {view === 'exercise' && (
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

              {records && (records.bestWeight > 0 || records.best1RM > 0) && (
                <section className="grid grid-cols-3 gap-3">
                  <StatCard label="Bestgewicht" value={`${records.bestWeight} kg`} isText />
                  <StatCard label="Beste Wdh." value={records.bestReps} />
                  <StatCard label="Geschätzt 1RM" value={`${Math.round(records.best1RM)} kg`} isText />
                </section>
              )}

              {chartData.length > 0 && (
                <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {metric === 'maxWeight' ? 'Maximalgewicht pro Training (kg)' : 'Geschätztes 1RM pro Training (kg)'}
                    </p>
                    <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
                      <button
                        onClick={() => setMetric('maxWeight')}
                        className={`rounded px-2 py-1 text-[11px] font-medium ${
                          metric === 'maxWeight' ? 'bg-brand-500 text-white' : 'text-slate-500'
                        }`}
                      >
                        Gewicht
                      </button>
                      <button
                        onClick={() => setMetric('estimated1RM')}
                        className={`rounded px-2 py-1 text-[11px] font-medium ${
                          metric === 'estimated1RM' ? 'bg-brand-500 text-white' : 'text-slate-500'
                        }`}
                      >
                        1RM
                      </button>
                    </div>
                  </div>
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
                          formatter={(value) => [`${Math.round(Number(value) * 10) / 10} kg`, '']}
                        />
                        <Line
                          type="monotone"
                          dataKey={metric}
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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Einträge</p>
                {sessionsForExercise.map((session) => {
                  const entry = session.exercises.find((e) => e.exerciseId === activeId)!
                  return (
                    <div key={session.id} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium text-white">{session.dayName}</p>
                        <p className="text-xs text-slate-500">{formatFullDate(session.date)}</p>
                      </div>
                      <SetChips sets={entry.sets} />
                    </div>
                  )
                })}
              </section>
            </>
          )}

          {view === 'history' && <SessionHistoryList sessions={sessions} />}

          {view === 'calendar' && (
            <section className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trainings-Konsistenz (letzte 12 Wochen)
                </p>
                <CalendarHeatmap trainedDays={trainedDays} weeks={12} />
              </div>
              <p className="text-center text-sm text-slate-400">
                {streak > 0 ? (
                  <>
                    🔥 <span className="font-semibold text-white">{streak}</span> Tage in Folge trainiert
                  </>
                ) : (
                  'Starte heute deine nächste Serie.'
                )}
              </p>
            </section>
          )}

          {view === 'balance' && <MuscleBalanceView entries={muscleBalance} />}

          {view === 'bodyweight' && <BodyWeightView />}
        </>
      )}
    </div>
  )
}

function MuscleBalanceView({ entries }: { entries: ReturnType<typeof getMuscleBalance> }) {
  const max = Math.max(1, ...entries.map((e) => e.sets))
  const grouped = {
    Oberkörper: entries.filter((e) => e.category === 'Oberkörper'),
    Unterkörper: entries.filter((e) => e.category === 'Unterkörper'),
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
        Noch keine Trainings in den letzten 7 Tagen – Balance erscheint hier, sobald du loslegst.
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <p className="text-xs text-slate-500">Arbeitssätze je Bewegungsmuster, letzte 7 Tage</p>
      {(['Oberkörper', 'Unterkörper'] as const).map((category) =>
        grouped[category].length === 0 ? null : (
          <div key={category} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{category}</p>
            {grouped[category].map((entry) => (
              <div key={entry.movementPatternId} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-sm text-slate-300">{entry.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(entry.sets / max) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-slate-500">{entry.sets} Sätze</span>
              </div>
            ))}
          </div>
        ),
      )}
    </section>
  )
}

function BodyWeightView() {
  const bodyWeights = useAppStore((s) => s.bodyWeights)
  const addBodyWeight = useAppStore((s) => s.addBodyWeight)
  const removeBodyWeight = useAppStore((s) => s.removeBodyWeight)
  const [weight, setWeight] = useState('')

  const chartData = bodyWeights.map((b) => ({
    ...b,
    label: new Date(b.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
  }))

  async function submit() {
    const value = Number(weight)
    if (!value || value <= 0) return
    await addBodyWeight({
      id: generateId('bw'),
      date: new Date().toISOString(),
      weight: value,
      createdAt: Date.now(),
    })
    setWeight('')
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Heutiges Gewicht (kg)"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!weight}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Eintragen
        </button>
      </div>

      {chartData.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
          Noch kein Körpergewicht erfasst.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#598eff" strokeWidth={2.5} dot={{ fill: '#598eff', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {[...bodyWeights].reverse().map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <span className="text-sm text-white">{b.weight} kg</span>
                <span className="text-xs text-slate-500">{formatFullDate(b.date)}</span>
                <button onClick={() => removeBodyWeight(b.id)} className="text-slate-600 hover:text-red-400" aria-label="Löschen">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function SessionHistoryList({ sessions }: { sessions: WorkoutSession[] }) {
  const [openId, setOpenId] = useState<string | null>(sessions[0]?.id ?? null)

  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alle Trainings</p>
      {sessions.map((session) => {
        const isOpen = openId === session.id
        const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0)
        return (
          <div key={session.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <button
              onClick={() => setOpenId(isOpen ? null : session.id)}
              className="flex w-full items-center justify-between px-4 py-3.5"
            >
              <div className="text-left">
                <p className="font-semibold text-white">{session.dayName}</p>
                <p className="text-xs text-slate-500">
                  {formatFullDate(session.date)} · {session.exercises.length} Übungen · {totalSets} Sätze
                </p>
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
                className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3.5">
                {session.exercises.map((entry) => (
                  <div key={entry.slotId}>
                    <p className="mb-1.5 text-xs text-slate-500">{entry.label}</p>
                    <p className="mb-1.5 text-sm font-medium text-white">{entry.exerciseName}</p>
                    <SetChips sets={entry.sets} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}

function SetChips({ sets }: { sets: WorkoutSession['exercises'][number]['sets'] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sets.map((set, i) => (
        <span
          key={i}
          className={`rounded-md px-2 py-1 text-xs ${
            set.completed ? 'bg-brand-500/15 text-brand-200' : 'bg-white/5 text-slate-500'
          }`}
        >
          {set.reps} × {set.weight}kg
          {set.rpe ? ` · RPE ${set.rpe}` : ''}
        </span>
      ))}
    </div>
  )
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StatCard({ label, value, isText }: { label: string; value: number | string; isText?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className={`font-bold text-white ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  )
}
