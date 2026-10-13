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
import { displayToKg, kgToDisplay, unitLabel } from '../lib/units'
import type { WeightUnit, WorkoutSession } from '../types'

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
  const unit = useAppStore((s) => s.settings.weightUnit)
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
    maxWeight: kgToDisplay(p.maxWeight, unit),
    estimated1RM: kgToDisplay(p.estimated1RM, unit),
    label: new Date(p.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
  }))

  const sessionsForExercise = activeId
    ? sessions.filter((s) => s.exercises.some((e) => e.exerciseId === activeId))
    : []

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="pt-2">
        <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">Fortschritt</p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-[0.95] text-ink">Dein Trainingsverlauf</h1>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Trainings gesamt" value={sessions.length} />
        <StatCard label="Diese Woche" value={thisWeekCount} />
        <StatCard label="Serie (Tage)" value={streak} />
      </section>

      {sessions.length === 0 ? (
        <div className="border border-line bg-surface p-6 text-center text-sm text-dim">
          Noch keine Trainings geloggt. Starte dein erstes Training, um hier deinen Fortschritt zu sehen.
        </div>
      ) : (
        <>
          <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`shrink-0 px-3.5 py-2 text-sm font-semibold transition-colors ${
                  view === v.id ? 'bg-ink text-on-ink' : 'bg-panel2 text-dim hover:text-ink'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {view === 'exercise' && (
            <>
              <section>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dim">
                  Übung
                </label>
                <select
                  value={activeId ?? ''}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full border border-line bg-surface px-3.5 py-3 text-sm text-ink focus:border-ink focus:outline-none"
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
                  <StatCard label="Bestgewicht" value={`${kgToDisplay(records.bestWeight, unit)} ${unitLabel(unit)}`} isText />
                  <StatCard label="Beste Wdh." value={records.bestReps} />
                  <StatCard label="Geschätzt 1RM" value={`${kgToDisplay(records.best1RM, unit)} ${unitLabel(unit)}`} isText />
                </section>
              )}

              {chartData.length > 0 && (
                <section className="border border-line bg-surface p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-dim">
                      {metric === 'maxWeight'
                        ? `Maximalgewicht pro Training (${unitLabel(unit)})`
                        : `Geschätztes 1RM pro Training (${unitLabel(unit)})`}
                    </p>
                    <div className="flex gap-1 border border-line p-0.5">
                      <button
                        onClick={() => setMetric('maxWeight')}
                        className={`px-2 py-1 text-[11px] font-bold ${
                          metric === 'maxWeight' ? 'bg-ink text-on-ink' : 'text-dim'
                        }`}
                      >
                        Gewicht
                      </button>
                      <button
                        onClick={() => setMetric('estimated1RM')}
                        className={`px-2 py-1 text-[11px] font-bold ${
                          metric === 'estimated1RM' ? 'bg-ink text-on-ink' : 'text-dim'
                        }`}
                      >
                        1RM
                      </button>
                    </div>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e3e0d8" />
                        <XAxis dataKey="label" tick={{ fill: '#6b6860', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fill: '#6b6860', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#17171a',
                            border: 'none',
                            borderRadius: 0,
                            fontSize: 12,
                          }}
                          labelStyle={{ color: '#fafaf8' }}
                          itemStyle={{ color: '#fafaf8' }}
                          formatter={(value) => [`${Math.round(Number(value) * 10) / 10} ${unitLabel(unit)}`, '']}
                        />
                        <Line
                          type="monotone"
                          dataKey={metric}
                          stroke="#c23b22"
                          strokeWidth={2.5}
                          dot={{ fill: '#c23b22', r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}

              <section className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-dim">Einträge</p>
                {sessionsForExercise.map((session) => {
                  const entry = session.exercises.find((e) => e.exerciseId === activeId)!
                  return (
                    <div key={session.id} className="border border-line bg-surface p-3.5">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-ink">{session.dayName}</p>
                        <p className="text-xs text-dim">{formatFullDate(session.date)}</p>
                      </div>
                      <SetChips sets={entry.sets} unit={unit} />
                    </div>
                  )
                })}
              </section>
            </>
          )}

          {view === 'history' && <SessionHistoryList sessions={sessions} unit={unit} />}

          {view === 'calendar' && (
            <section className="flex flex-col gap-4">
              <div className="border border-line bg-surface p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-dim">
                  Trainings-Konsistenz (letzte 12 Wochen)
                </p>
                <CalendarHeatmap trainedDays={trainedDays} weeks={12} />
              </div>
              <p className="text-center text-sm text-dim">
                {streak > 0 ? (
                  <>
                    <span className="font-display text-ink">{streak}</span> Tage in Folge trainiert
                  </>
                ) : (
                  'Starte heute deine nächste Serie.'
                )}
              </p>
            </section>
          )}

          {view === 'balance' && <MuscleBalanceView entries={muscleBalance} />}

          {view === 'bodyweight' && <BodyWeightView unit={unit} />}
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
      <div className="border border-line bg-surface p-6 text-center text-sm text-dim">
        Noch keine Trainings in den letzten 7 Tagen – Balance erscheint hier, sobald du loslegst.
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <p className="text-xs text-dim">Arbeitssätze je Bewegungsmuster, letzte 7 Tage</p>
      {(['Oberkörper', 'Unterkörper'] as const).map((category) =>
        grouped[category].length === 0 ? null : (
          <div key={category} className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-dim">{category}</p>
            {grouped[category].map((entry) => (
              <div key={entry.movementPatternId} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-sm text-ink">{entry.name}</span>
                <div className="h-2.5 flex-1 bg-panel2">
                  <div
                    className="h-full bg-brand-500"
                    style={{ width: `${(entry.sets / max) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-dim">{entry.sets} Sätze</span>
              </div>
            ))}
          </div>
        ),
      )}
    </section>
  )
}

function BodyWeightView({ unit }: { unit: WeightUnit }) {
  const bodyWeights = useAppStore((s) => s.bodyWeights)
  const addBodyWeight = useAppStore((s) => s.addBodyWeight)
  const removeBodyWeight = useAppStore((s) => s.removeBodyWeight)
  const [weight, setWeight] = useState('')

  const chartData = bodyWeights.map((b) => ({
    ...b,
    weight: kgToDisplay(b.weight, unit),
    label: new Date(b.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
  }))

  async function submit() {
    const value = Number(weight)
    if (!value || value <= 0) return
    await addBodyWeight({
      id: generateId('bw'),
      date: new Date().toISOString(),
      weight: displayToKg(value, unit),
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
          placeholder={`Heutiges Gewicht (${unitLabel(unit)})`}
          className="flex-1 border border-line bg-surface px-3.5 py-3 text-sm text-ink placeholder:text-dim focus:border-ink focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!weight}
          className="bg-ink px-4 py-2 text-sm font-bold text-on-ink disabled:opacity-40"
        >
          Eintragen
        </button>
      </div>

      {chartData.length === 0 ? (
        <div className="border border-line bg-surface p-6 text-center text-sm text-dim">
          Noch kein Körpergewicht erfasst.
        </div>
      ) : (
        <>
          <div className="border border-line bg-surface p-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e0d8" />
                  <XAxis dataKey="label" tick={{ fill: '#6b6860', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#6b6860', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip
                    contentStyle={{ background: '#17171a', border: 'none', borderRadius: 0, fontSize: 12 }}
                    labelStyle={{ color: '#fafaf8' }}
                    itemStyle={{ color: '#fafaf8' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#c23b22" strokeWidth={2.5} dot={{ fill: '#c23b22', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {[...bodyWeights].reverse().map((b) => (
              <div key={b.id} className="flex items-center justify-between border border-line bg-surface px-3.5 py-2.5">
                <span className="text-sm font-semibold text-ink">{kgToDisplay(b.weight, unit)} {unitLabel(unit)}</span>
                <span className="text-xs text-dim">{formatFullDate(b.date)}</span>
                <button onClick={() => removeBodyWeight(b.id)} className="text-dim hover:text-brand-400" aria-label="Löschen">
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

function SessionHistoryList({ sessions, unit }: { sessions: WorkoutSession[]; unit: WeightUnit }) {
  const [openId, setOpenId] = useState<string | null>(sessions[0]?.id ?? null)

  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-dim">Alle Trainings</p>
      {sessions.map((session) => {
        const isOpen = openId === session.id
        const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0)
        return (
          <div key={session.id} className="overflow-hidden border border-line bg-surface">
            <button
              onClick={() => setOpenId(isOpen ? null : session.id)}
              className="flex w-full items-center justify-between px-4 py-3.5"
            >
              <div className="text-left">
                <p className="font-display text-base text-ink">{session.dayName}</p>
                <p className="text-xs text-dim">
                  {formatFullDate(session.date)} · {session.exercises.length} Übungen · {totalSets} Sätze
                </p>
                {session.note && <p className="mt-1 text-xs italic text-brand-400">{session.note}</p>}
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
                className={`shrink-0 text-dim transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-3 border-t border-line px-4 py-3.5">
                {session.exercises.map((entry) => (
                  <div key={entry.slotId}>
                    <p className="mb-1.5 text-xs text-dim">{entry.label}</p>
                    <p className="mb-1.5 text-sm font-semibold text-ink">{entry.exerciseName}</p>
                    <SetChips sets={entry.sets} unit={unit} />
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

function SetChips({ sets, unit }: { sets: WorkoutSession['exercises'][number]['sets']; unit: WeightUnit }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sets.map((set, i) => (
        <span
          key={i}
          className={`px-2 py-1 text-xs font-medium ${
            set.completed ? 'bg-brand-500 text-white' : 'bg-panel2 text-dim'
          }`}
        >
          {set.reps} × {kgToDisplay(set.weight, unit)}{unitLabel(unit)}
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
    <div className="border border-line bg-surface p-4">
      <p className={`font-display text-ink ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-dim">{label}</p>
    </div>
  )
}
