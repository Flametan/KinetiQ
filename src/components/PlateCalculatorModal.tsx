import { useState } from 'react'
import { calculatePlates } from '../lib/plates'

interface Props {
  open: boolean
  onClose: () => void
  initialWeight: number
}

export default function PlateCalculatorModal({ open, onClose, initialWeight }: Props) {
  const [targetWeight, setTargetWeight] = useState(initialWeight)
  const [barWeight, setBarWeight] = useState(20)

  if (!open) return null

  const { perSide, plates, remainder } = calculatePlates(targetWeight, barWeight)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-t-3xl border-t border-white/10 bg-slate-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Plattenrechner</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Schließen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Zielgewicht (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-center text-sm text-white focus:border-brand-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Stangengewicht (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={barWeight}
              onChange={(e) => setBarWeight(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-center text-sm text-white focus:border-brand-400 focus:outline-none"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Pro Seite ({perSide} kg)</p>
          {plates.length === 0 ? (
            <p className="text-sm text-slate-400">Nur die Stange – keine Scheiben nötig.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {plates.map((p, i) => (
                <span key={i} className="rounded-md bg-brand-500/15 px-2.5 py-1.5 text-sm font-semibold text-brand-200">
                  {p}
                </span>
              ))}
            </div>
          )}
          {remainder > 0 && (
            <p className="mt-2 text-xs text-amber-400">
              {remainder} kg pro Seite lassen sich mit dem Standard-Scheibensatz nicht exakt abbilden.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
