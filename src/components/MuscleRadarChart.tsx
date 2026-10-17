import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { MUSCLE_CATEGORIES, type MuscleCategory } from '../lib/muscleCategories'

interface Props {
  current: Record<MuscleCategory, number>
  previous: Record<MuscleCategory, number>
}

export default function MuscleRadarChart({ current, previous }: Props) {
  const data = MUSCLE_CATEGORIES.map((cat) => ({
    category: cat,
    Aktuell: current[cat],
    Vorherig: previous[cat],
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--color-line)" />
          <PolarAngleAxis dataKey="category" tick={{ fill: 'var(--color-dim)', fontSize: 11 }} />
          <Radar name="Vorherig" dataKey="Vorherig" stroke="var(--color-dim)" fill="var(--color-dim)" fillOpacity={0.15} strokeWidth={1.5} />
          <Radar name="Aktuell" dataKey="Aktuell" stroke="var(--color-brand-400)" fill="var(--color-brand-400)" fillOpacity={0.35} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-5 text-xs text-dim">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-400" /> Aktuell
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-dim" /> Vorherig
        </span>
      </div>
    </div>
  )
}
