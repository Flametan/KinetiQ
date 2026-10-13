import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { splitOptions } from '../data/splitTemplates'
import type { SplitVariant } from '../types'
import { buildUserPlanFromVariant } from '../lib/planBuilder'
import { useAppStore } from '../store/useAppStore'
import Barbell from '../components/Barbell'
import { DAY_CYCLE_LABELS } from '../lib/schedule'

export default function OnboardingPage() {
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null)
  const setPlan = useAppStore((s) => s.setPlan)
  const navigate = useNavigate()

  const split = daysPerWeek ? splitOptions.find((s) => s.daysPerWeek === daysPerWeek) : undefined

  async function choose(variant: SplitVariant) {
    if (!split) return
    const plan = buildUserPlanFromVariant(split.daysPerWeek, split.label, variant)
    await setPlan(plan)
    navigate('/plan')
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="pt-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-brand-400">Willkommen bei KinetiQ</p>
        <h1 className="font-display mt-2 text-[28px] uppercase leading-[0.95] text-ink">
          Erstelle deinen Trainingsplan
        </h1>
        <p className="mt-3 text-sm text-dim">
          Wähle, wie oft du in den nächsten 7 Tagen trainieren willst – ab heute als Tag 1 – wir
          schlagen dir einen passenden Split vor.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[.1em] text-dim">
          Trainingstage in den nächsten 7 Tagen
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {splitOptions.map((s) => (
            <button
              key={s.daysPerWeek}
              onClick={() => setDaysPerWeek(s.daysPerWeek)}
              className={`press flex flex-col items-center justify-center gap-2.5 border py-4 transition-colors ${
                daysPerWeek === s.daysPerWeek
                  ? 'border-ink bg-ink text-on-ink'
                  : 'border-line bg-surface text-ink hover:border-ink'
              }`}
            >
              <Barbell plates={s.daysPerWeek} size="xs" active={daysPerWeek === s.daysPerWeek} />
              <span className="font-display text-xl">{s.daysPerWeek}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Tage</span>
            </button>
          ))}
        </div>
      </section>

      {split && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[.1em] text-dim">Split wählen</h2>
          {split.variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => choose(variant)}
              className="press border border-line bg-surface p-4 text-left transition-colors hover:border-ink"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-base text-ink">{variant.name}</p>
                <Barbell plates={split.daysPerWeek} size="sm" />
              </div>
              <div className="mt-3 flex gap-1.5">
                {variant.schedule.map((dayId, i) => {
                  const day = variant.days.find((d) => d.id === dayId)
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold text-dim">{DAY_CYCLE_LABELS[i]}</span>
                      <div
                        className={`h-8 w-full ${dayId ? 'bg-brand-500' : 'bg-panel2'}`}
                        title={day?.name}
                      />
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-dim">{variant.days.map((d) => d.name).join(' · ')}</p>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
