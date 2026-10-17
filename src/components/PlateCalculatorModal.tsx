import { useState } from 'react'
import { calculatePlates } from '../lib/plates'
import { useAppStore } from '../store/useAppStore'
import { DEFAULT_BAR_WEIGHT, kgToDisplay, unitLabel } from '../lib/units'

interface Props {
  open: boolean
  onClose: () => void
  initialWeight: number
}

export default function PlateCalculatorModal({ open, onClose, initialWeight }: Props) {
  const unit = useAppStore((s) => s.settings.weightUnit)
  const [targetWeight, setTargetWeight] = useState(() => kgToDisplay(initialWeight, unit))
  const [barWeight, setBarWeight] = useState(DEFAULT_BAR_WEIGHT[unit])

  if (!open) return null

  const { perSide, plates, remainder } = calculatePlates(targetWeight, unit, barWeight)
  const label = unitLabel(unit)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pb-2">
          <div className="h-1 w-10 rounded-full bg-line" />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base text-ink">Plattenrechner</h2>
          <button onClick={onClose} className="icon-btn press text-dim hover:bg-panel2 hover:text-ink" aria-label="Schließen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-dim">Zielgewicht ({label})</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
              className="border border-line bg-surface px-3 py-2 text-center text-sm font-semibold text-ink focus:border-ink focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-dim">Stangengewicht ({label})</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={barWeight}
              onChange={(e) => setBarWeight(Number(e.target.value))}
              className="border border-line bg-surface px-3 py-2 text-center text-sm font-semibold text-ink focus:border-ink focus:outline-none"
            />
          </label>
        </div>

        <div className="border border-line bg-panel2 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dim">Pro Seite ({perSide} {label})</p>
          {plates.length === 0 ? (
            <p className="text-sm text-dim">Nur die Stange – keine Scheiben nötig.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {plates.map((p, i) => (
                <span key={i} className="border border-ink bg-surface px-2.5 py-1.5 text-sm font-bold text-ink">
                  {p}
                </span>
              ))}
            </div>
          )}
          {remainder > 0 && (
            <p className="mt-2 text-xs font-medium text-brand-400">
              {remainder} {label} pro Seite lassen sich mit dem Standard-Scheibensatz nicht exakt abbilden.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
