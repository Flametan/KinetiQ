import type { MuscleCategory } from '../lib/muscleCategories'

interface RegionSpec {
  x: number
  y: number
  w: number
  h: number
  rx: number
  category: MuscleCategory
}

const SHOULDER_L: RegionSpec = { x: 55, y: 50, w: 24, h: 20, rx: 8, category: 'Schultern' }
const SHOULDER_R: RegionSpec = { x: 121, y: 50, w: 24, h: 20, rx: 8, category: 'Schultern' }
const ARM_L: RegionSpec = { x: 30, y: 55, w: 22, h: 85, rx: 11, category: 'Arme' }
const ARM_R: RegionSpec = { x: 148, y: 55, w: 22, h: 85, rx: 11, category: 'Arme' }
const LEG_L: RegionSpec = { x: 66, y: 155, w: 30, h: 130, rx: 15, category: 'Beine' }
const LEG_R: RegionSpec = { x: 104, y: 155, w: 30, h: 130, rx: 15, category: 'Beine' }
const CHEST: RegionSpec = { x: 62, y: 58, w: 76, h: 42, rx: 10, category: 'Brust' }
const CORE: RegionSpec = { x: 68, y: 100, w: 64, h: 48, rx: 10, category: 'Core' }
const BACK: RegionSpec = { x: 62, y: 55, w: 76, h: 95, rx: 12, category: 'Rücken' }

const FRONT_REGIONS = [CHEST, CORE, SHOULDER_L, SHOULDER_R, ARM_L, ARM_R, LEG_L, LEG_R]
const BACK_REGIONS = [BACK, SHOULDER_L, SHOULDER_R, ARM_L, ARM_R, LEG_L, LEG_R]

interface Props {
  /** Arbeitssätze je Kategorie im gewählten Zeitraum. */
  totals: Record<MuscleCategory, number>
}

/** Schematisches Vorder-/Rückansicht-Körperdiagramm, Regionen eingefärbt nach Trainingsvolumen. */
export default function MuscleBodyDiagram({ totals }: Props) {
  const max = Math.max(1, ...Object.values(totals))
  const opacityFor = (cat: MuscleCategory) => (totals[cat] > 0 ? 0.22 + (totals[cat] / max) * 0.68 : 0)

  return (
    <div className="flex items-center justify-center gap-6">
      <BodySilhouette label="Vorne" regions={FRONT_REGIONS} opacityFor={opacityFor} />
      <BodySilhouette label="Hinten" regions={BACK_REGIONS} opacityFor={opacityFor} />
    </div>
  )
}

function BodySilhouette({
  label,
  regions,
  opacityFor,
}: {
  label: string
  regions: RegionSpec[]
  opacityFor: (cat: MuscleCategory) => number
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="104" height="166" viewBox="0 0 200 320">
        <circle cx="100" cy="24" r="16" className="fill-panel2" />
        <rect x="92" y="38" width="16" height="12" rx="3" className="fill-panel2" />
        {regions.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} className="fill-panel2" />
        ))}
        {regions.map((r, i) => (
          <rect
            key={`fill-${i}`}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            rx={r.rx}
            className="fill-brand-400"
            style={{ opacity: opacityFor(r.category) }}
          />
        ))}
      </svg>
      <span className="text-[10px] font-bold uppercase tracking-wide text-dim">{label}</span>
    </div>
  )
}
