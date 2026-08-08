interface Props {
  /** Set von Tages-Zeitstempeln (00:00 Uhr lokal) an denen trainiert wurde. */
  trainedDays: Set<number>
  weeks?: number
}

const WEEKDAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', '']

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** GitHub-artige Trainings-Konsistenz-Heatmap der letzten `weeks` Wochen. */
export default function CalendarHeatmap({ trainedDays, weeks = 12 }: Props) {
  const oneDay = 86_400_000
  const today = startOfDay(Date.now())
  const todayWeekday = (new Date(today).getDay() + 6) % 7 // 0 = Montag
  const gridStart = today - todayWeekday * oneDay - (weeks - 1) * 7 * oneDay

  const columns = Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => gridStart + (week * 7 + day) * oneDay),
  )

  return (
    <div className="scrollbar-none overflow-x-auto">
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] pr-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} className="flex h-3 w-6 items-center text-[9px] text-slate-600">
              {label}
            </div>
          ))}
        </div>
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((ts, di) => {
              const isFuture = ts > today
              const trained = trainedDays.has(ts)
              return (
                <div
                  key={di}
                  title={new Date(ts).toLocaleDateString('de-DE')}
                  className={`h-3 w-3 rounded-[3px] ${
                    isFuture ? 'bg-transparent' : trained ? 'bg-brand-500' : 'bg-white/5'
                  } ${ts === today ? 'ring-1 ring-brand-300' : ''}`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
