interface BarbellProps {
  /** Anzahl Scheiben pro Seite = Anzahl Trainingstage im Split. */
  plates: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  active?: boolean
}

const SIZES = {
  xs: { plateH: 22, plateW: 3, gap: 1, barOverhang: 6, barThickness: 2 },
  sm: { plateH: 30, plateW: 7, gap: 2, barOverhang: 10, barThickness: 4 },
  md: { plateH: 42, plateW: 9, gap: 2.5, barOverhang: 14, barThickness: 5 },
  lg: { plateH: 56, plateW: 11, gap: 3, barOverhang: 18, barThickness: 6 },
} as const

/**
 * Visualisiert einen Split als Langhantel: pro Trainingstag eine Scheibe
 * auf jeder Seite (2er Split = 2 Scheiben je Seite, 3er = 3, usw.).
 */
export default function Barbell({ plates, size = 'md', active = true }: BarbellProps) {
  const { plateH, plateW, gap, barOverhang, barThickness } = SIZES[size]
  const plateColor = active ? 'bg-brand-500' : 'bg-slate-600'
  const barColor = active ? 'bg-slate-500' : 'bg-slate-700'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ height: plateH }}>
      <div
        className={`absolute top-1/2 -translate-y-1/2 rounded-full ${barColor}`}
        style={{ left: -barOverhang, right: -barOverhang, height: barThickness }}
      />
      <div className="relative flex items-center" style={{ gap }}>
        {Array.from({ length: plates }).map((_, i) => (
          <div
            key={`l-${i}`}
            className={`rounded-[3px] ${plateColor}`}
            style={{ width: plateW, height: plateH }}
          />
        ))}
        <div style={{ width: gap * 2 }} />
        {Array.from({ length: plates }).map((_, i) => (
          <div
            key={`r-${i}`}
            className={`rounded-[3px] ${plateColor}`}
            style={{ width: plateW, height: plateH }}
          />
        ))}
      </div>
    </div>
  )
}
