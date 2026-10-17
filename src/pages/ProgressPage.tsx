import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import {
  computeStreak,
  getPersonalRecords,
  getProgressForExercise,
  getTrainedDaySet,
  listLoggedExerciseIds,
} from '../lib/history'
import { getMuscleCategoryTotals, MUSCLE_CATEGORIES, type MuscleCategory } from '../lib/muscleCategories'
import { getMonthlyReport, getNewRecordsInRange, getMonthRange } from '../lib/report'
import { generateId } from '../utils/id'
import CalendarHeatmap from '../components/CalendarHeatmap'
import MuscleBodyDiagram from '../components/MuscleBodyDiagram'
import MuscleRadarChart from '../components/MuscleRadarChart'
import Snackbar from '../components/Snackbar'
import { useUndoableDelete } from '../hooks/useUndoableDelete'
import { displayToKg, kgToDisplay, unitLabel } from '../lib/units'
import type {
  BodyMeasurement,
  BodyWeightEntry,
  CustomExercise,
  MeasurementType,
  ProgressPhoto,
  WeightUnit,
  WorkoutSession,
} from '../types'
import { MEASUREMENT_LABELS } from '../types'

type View = 'exercise' | 'history' | 'calendar' | 'balance' | 'report' | 'bodyweight' | 'measurements' | 'photos'

const VIEWS: { id: View; label: string }[] = [
  { id: 'exercise', label: 'Nach Übung' },
  { id: 'history', label: 'Trainingshistorie' },
  { id: 'calendar', label: 'Kalender' },
  { id: 'balance', label: 'Balance' },
  { id: 'report', label: 'Monatsbericht' },
  { id: 'bodyweight', label: 'Körpergewicht' },
  { id: 'measurements', label: 'Körpermessungen' },
  { id: 'photos', label: 'Fotos' },
]

const tooltipStyle = {
  contentStyle: { background: 'var(--color-ink)', border: 'none', borderRadius: 12, fontSize: 12 },
  labelStyle: { color: 'var(--color-on-ink)' },
  itemStyle: { color: 'var(--color-on-ink)' },
}

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

      <div className="flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`press shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
              view === v.id ? 'bg-ink text-on-ink' : 'bg-panel2 text-dim hover:text-ink'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {sessions.length === 0 &&
      (view === 'exercise' || view === 'history' || view === 'calendar' || view === 'balance' || view === 'report') ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-dim">
          Noch keine Trainings geloggt. Starte dein erstes Training, um hier deinen Fortschritt zu sehen.
        </div>
      ) : (
        <>
          {view === 'exercise' && (
            <>
              <section>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dim">
                  Übung
                </label>
                <select
                  value={activeId ?? ''}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-surface px-3.5 py-3 text-sm text-ink focus:border-ink focus:outline-none"
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
                <section className="rounded-2xl border border-line bg-surface p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-dim">
                      {metric === 'maxWeight'
                        ? `Maximalgewicht pro Training (${unitLabel(unit)})`
                        : `Geschätztes 1RM pro Training (${unitLabel(unit)})`}
                    </p>
                    <div className="flex gap-1 rounded-full border border-line p-0.5">
                      <button
                        onClick={() => setMetric('maxWeight')}
                        className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                          metric === 'maxWeight' ? 'bg-ink text-on-ink' : 'text-dim'
                        }`}
                      >
                        Gewicht
                      </button>
                      <button
                        onClick={() => setMetric('estimated1RM')}
                        className={`rounded-full px-2 py-1 text-[11px] font-bold ${
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
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                        <XAxis dataKey="label" tick={{ fill: 'var(--color-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fill: 'var(--color-dim)', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip
                          {...tooltipStyle}
                          formatter={(value) => [`${Math.round(Number(value) * 10) / 10} ${unitLabel(unit)}`, '']}
                        />
                        <Line
                          type="monotone"
                          dataKey={metric}
                          stroke="var(--color-brand-400)"
                          strokeWidth={2.5}
                          dot={{ fill: 'var(--color-brand-400)', r: 3 }}
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
                    <div key={session.id} className="rounded-2xl border border-line bg-surface p-3.5">
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
              <div className="rounded-2xl border border-line bg-surface p-4">
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

          {view === 'balance' && <MuscleBalanceView sessions={sessions} customExercises={customExercises} />}

          {view === 'report' && <MonthlyReportView sessions={sessions} unit={unit} />}

          {view === 'bodyweight' && <BodyWeightView unit={unit} />}

          {view === 'measurements' && <MeasurementsView />}

          {view === 'photos' && <ProgressPhotosView />}
        </>
      )}
    </div>
  )
}

function MuscleBalanceView({
  sessions,
  customExercises,
}: {
  sessions: WorkoutSession[]
  customExercises: CustomExercise[]
}) {
  const [days, setDays] = useState(7)
  const now = Date.now()
  const current = useMemo(
    () => getMuscleCategoryTotals(sessions, customExercises, now - days * 86_400_000, now),
    [sessions, customExercises, days, now],
  )
  const previous = useMemo(
    () => getMuscleCategoryTotals(sessions, customExercises, now - days * 2 * 86_400_000, now - days * 86_400_000),
    [sessions, customExercises, days, now],
  )
  const hasData = Object.values(current).some((v) => v > 0)

  return (
    <section className="flex flex-col gap-5">
      <div className="flex justify-center gap-1.5">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`press rounded-full px-3 py-1.5 text-xs font-semibold ${
              days === d ? 'bg-ink text-on-ink' : 'bg-panel2 text-dim hover:text-ink'
            }`}
          >
            {d} Tage
          </button>
        ))}
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-dim">
          Noch keine Trainings in den letzten {days} Tagen – Balance erscheint hier, sobald du loslegst.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-dim">
              Muskel-Wärmebild, letzte {days} Tage
            </p>
            <MuscleBodyDiagram totals={current} />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-dim">
              Aktuell vs. vorherige {days} Tage
            </p>
            <MuscleRadarChart current={current} previous={previous} />
          </div>

          <div className="flex flex-col gap-2">
            {MUSCLE_CATEGORIES.map((cat: MuscleCategory) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-ink">{cat}</span>
                <div className="h-2.5 flex-1 rounded-full bg-panel2">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.min(100, (current[cat] / Math.max(1, ...Object.values(current))) * 100)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-dim">{current[cat]} Sätze</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function formatDelta(current: number, previous: number, formatter: (n: number) => string = (n) => String(n)) {
  const diff = current - previous
  if (diff === 0) return { text: '± 0', colorClass: 'text-dim' }
  const sign = diff > 0 ? '+' : '−'
  return {
    text: `${sign} ${formatter(Math.abs(diff))}`,
    colorClass: diff > 0 ? 'text-emerald-500' : 'text-brand-400',
  }
}

function formatDurationShort(ms: number) {
  const totalMinutes = Math.round(ms / 60_000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}min`
  return `${h}h ${m}min`
}

function MonthlyReportView({ sessions, unit }: { sessions: WorkoutSession[]; unit: WeightUnit }) {
  const [monthsAgo, setMonthsAgo] = useState(0)
  const report = useMemo(() => getMonthlyReport(sessions, monthsAgo), [sessions, monthsAgo])
  const range = useMemo(() => getMonthRange(monthsAgo), [monthsAgo])
  const newRecords = useMemo(() => getNewRecordsInRange(sessions, range.from, range.to), [sessions, range])

  const volumeDisplay = (v: number) => `${Math.round(kgToDisplay(v, unit)).toLocaleString('de-DE')} ${unitLabel(unit)}`

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonthsAgo((m) => m + 1)}
          className="icon-btn press text-dim hover:bg-panel2 hover:text-ink"
          aria-label="Vorheriger Monat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <p className="font-display text-base uppercase text-ink">{range.label}</p>
        <button
          onClick={() => setMonthsAgo((m) => Math.max(0, m - 1))}
          disabled={monthsAgo === 0}
          className="icon-btn press text-dim hover:bg-panel2 hover:text-ink disabled:opacity-30"
          aria-label="Nächster Monat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ReportStatCard
          label="Workouts"
          value={String(report.current.workouts)}
          delta={formatDelta(report.current.workouts, report.previous.workouts)}
        />
        <ReportStatCard
          label="Dauer"
          value={formatDurationShort(report.current.durationMs)}
          delta={formatDelta(report.current.durationMs, report.previous.durationMs, (n) => formatDurationShort(n))}
        />
        <ReportStatCard
          label="Volumen"
          value={volumeDisplay(report.current.volume)}
          delta={formatDelta(report.current.volume, report.previous.volume, (n) => volumeDisplay(n))}
        />
        <ReportStatCard
          label="Sätze"
          value={String(report.current.sets)}
          delta={formatDelta(report.current.sets, report.previous.sets)}
        />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">Persönliche Rekorde</p>
        <p className="font-display mt-2 text-3xl text-ink">
          {newRecords.length} {newRecords.length === 1 ? 'neuer Rekord' : 'neue Rekorde'}
        </p>
        {newRecords.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 text-left">
            {newRecords.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-panel2 px-3 py-2.5">
                <span className="truncate text-sm font-medium text-ink">{r.exerciseName}</span>
                <span className="shrink-0 rounded-full bg-brand-500 px-2.5 py-0.5 text-sm font-bold text-white">
                  {kgToDisplay(r.weight, unit)} {unitLabel(unit)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ReportStatCard({
  label,
  value,
  delta,
}: {
  label: string
  value: string
  delta: { text: string; colorClass: string }
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs text-dim">{label}</p>
      <p className="font-display mt-1 text-xl text-ink">{value}</p>
      <p className={`mt-0.5 text-xs font-semibold ${delta.colorClass}`}>{delta.text}</p>
    </div>
  )
}

const MEASUREMENT_TYPES = Object.keys(MEASUREMENT_LABELS) as MeasurementType[]

function MeasurementsView() {
  const bodyMeasurements = useAppStore((s) => s.bodyMeasurements)
  const addBodyMeasurement = useAppStore((s) => s.addBodyMeasurement)
  const removeBodyMeasurement = useAppStore((s) => s.removeBodyMeasurement)
  const [type, setType] = useState<MeasurementType>('brust')
  const [value, setValue] = useState('')
  const measurementDelete = useUndoableDelete<BodyMeasurement>((m) => removeBodyMeasurement(m.id))
  const visible = bodyMeasurements.filter((m) => !measurementDelete.isPending(m.id))

  async function submit() {
    const num = Number(value)
    if (!num || num <= 0) return
    await addBodyMeasurement({
      id: generateId('bm'),
      date: new Date().toISOString(),
      type,
      value: num,
      createdAt: Date.now(),
    })
    setValue('')
  }

  const latestByType = new Map<MeasurementType, BodyMeasurement>()
  for (const m of visible) {
    const existing = latestByType.get(m.type)
    if (!existing || m.date > existing.date) latestByType.set(m.type, m)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MeasurementType)}
          className="rounded-2xl border border-line bg-surface px-3 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        >
          {MEASUREMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {MEASUREMENT_LABELS[t]}
            </option>
          ))}
        </select>
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="cm"
          className="w-24 rounded-2xl border border-line bg-surface px-3.5 py-3 text-sm text-ink placeholder:text-dim focus:border-ink focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!value}
          className="press rounded-full bg-ink px-4 py-2 text-sm font-bold text-on-ink disabled:opacity-40"
        >
          Eintragen
        </button>
      </div>

      {latestByType.size === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-dim">
          Noch keine Körpermessungen erfasst.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {Array.from(latestByType.entries()).map(([t, m]) => (
            <div key={t} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs text-dim">{MEASUREMENT_LABELS[t]}</p>
              <p className="font-display mt-1 text-xl text-ink">{m.value} cm</p>
              <p className="mt-0.5 text-[11px] text-dim">{formatFullDate(m.date)}</p>
            </div>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-dim">Verlauf</p>
          {[...visible].reverse().map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-2xl border border-line bg-surface py-1 pl-3.5 pr-1.5">
              <span className="text-sm font-semibold text-ink">{MEASUREMENT_LABELS[m.type]}</span>
              <span className="text-sm text-ink">{m.value} cm</span>
              <span className="text-xs text-dim">{formatFullDate(m.date)}</span>
              <button
                onClick={() => measurementDelete.triggerDelete(m)}
                className="icon-btn press text-dim hover:bg-panel2 hover:text-brand-400"
                aria-label="Löschen"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {measurementDelete.pending && (
        <Snackbar
          message={`${MEASUREMENT_LABELS[measurementDelete.pending.type]}-Eintrag gelöscht`}
          actionLabel="Rückgängig"
          onAction={measurementDelete.undo}
        />
      )}
    </section>
  )
}

function ProgressPhotosView() {
  const progressPhotos = useAppStore((s) => s.progressPhotos)
  const addProgressPhoto = useAppStore((s) => s.addProgressPhoto)
  const removeProgressPhoto = useAppStore((s) => s.removeProgressPhoto)
  const photoDelete = useUndoableDelete<ProgressPhoto>((p) => removeProgressPhoto(p.id))
  const visible = [...progressPhotos.filter((p) => !photoDelete.isPending(p.id))].reverse()

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      await addProgressPhoto({
        id: generateId('photo'),
        date: new Date().toISOString(),
        image: file,
        createdAt: Date.now(),
      })
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <label className="press flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface py-5 text-sm font-semibold text-dim hover:text-ink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        Foto hinzufügen
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-dim">
          Noch keine Fortschrittsfotos. Dokumentiere deine Veränderung über die Zeit.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((photo) => (
            <PhotoThumb key={photo.id} photo={photo} onDelete={() => photoDelete.triggerDelete(photo)} />
          ))}
        </div>
      )}

      {photoDelete.pending && (
        <Snackbar message="Foto gelöscht" actionLabel="Rückgängig" onAction={photoDelete.undo} />
      )}

      <p className="text-center text-[11px] text-dim">
        Fotos werden nur lokal auf diesem Gerät gespeichert und sind nicht Teil des Datenexports.
      </p>
    </section>
  )
}

function PhotoThumb({ photo, onDelete }: { photo: ProgressPhoto; onDelete: () => void }) {
  const url = useMemo(() => URL.createObjectURL(photo.image), [photo.image])
  useEffect(() => () => URL.revokeObjectURL(url), [url])

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface">
      <img src={url} alt="Fortschrittsfoto" className="aspect-square w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
        <span className="text-xs font-medium text-white">{formatFullDate(photo.date)}</span>
        <button
          onClick={onDelete}
          className="icon-btn press text-white/80 hover:text-white"
          aria-label="Löschen"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function BodyWeightView({ unit }: { unit: WeightUnit }) {
  const bodyWeights = useAppStore((s) => s.bodyWeights)
  const addBodyWeight = useAppStore((s) => s.addBodyWeight)
  const removeBodyWeight = useAppStore((s) => s.removeBodyWeight)
  const [weight, setWeight] = useState('')
  const weightDelete = useUndoableDelete<BodyWeightEntry>((b) => removeBodyWeight(b.id))
  const visibleBodyWeights = bodyWeights.filter((b) => !weightDelete.isPending(b.id))

  const chartData = visibleBodyWeights.map((b) => ({
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
          className="flex-1 rounded-2xl border border-line bg-surface px-3.5 py-3 text-sm text-ink placeholder:text-dim focus:border-ink focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!weight}
          className="press rounded-full bg-ink px-4 py-2 text-sm font-bold text-on-ink disabled:opacity-40"
        >
          Eintragen
        </button>
      </div>

      {chartData.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-dim">
          Noch kein Körpergewicht erfasst.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--color-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: 'var(--color-dim)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="weight" stroke="var(--color-brand-400)" strokeWidth={2.5} dot={{ fill: 'var(--color-brand-400)', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {[...visibleBodyWeights].reverse().map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl border border-line bg-surface py-1 pl-3.5 pr-1.5">
                <span className="text-sm font-semibold text-ink">{kgToDisplay(b.weight, unit)} {unitLabel(unit)}</span>
                <span className="text-xs text-dim">{formatFullDate(b.date)}</span>
                <button onClick={() => weightDelete.triggerDelete(b)} className="icon-btn press text-dim hover:bg-panel2 hover:text-brand-400" aria-label="Löschen">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {weightDelete.pending && (
        <Snackbar
          message={`Eintrag gelöscht`}
          actionLabel="Rückgängig"
          onAction={weightDelete.undo}
        />
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
          <div key={session.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
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
          className={`rounded-full px-2 py-1 text-xs font-medium ${
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
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className={`font-display text-ink ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-dim">{label}</p>
    </div>
  )
}
