import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { splitOptions } from '../data/splitTemplates'
import type { SplitVariant } from '../types'
import { buildUserPlanFromVariant } from '../lib/planBuilder'
import { useAppStore } from '../store/useAppStore'

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

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
        <p className="text-sm font-medium text-brand-400">Willkommen bei KinetiQ</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Erstelle deinen Trainingsplan</h1>
        <p className="mt-2 text-sm text-slate-400">
          Wähle, wie oft du pro Woche trainieren willst – wir schlagen dir einen passenden Split vor.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Trainingstage pro Woche</h2>
        <div className="grid grid-cols-5 gap-2">
          {splitOptions.map((s) => (
            <button
              key={s.daysPerWeek}
              onClick={() => setDaysPerWeek(s.daysPerWeek)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl border py-4 transition-colors ${
                daysPerWeek === s.daysPerWeek
                  ? 'border-brand-500 bg-brand-500/15 text-white'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
              }`}
            >
              <span className="text-xl font-bold">{s.daysPerWeek}</span>
              <span className="text-[11px] text-slate-500">Tage</span>
            </button>
          ))}
        </div>
      </section>

      {split && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-300">Split wählen</h2>
          {split.variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => choose(variant)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:border-brand-400 hover:bg-brand-500/10"
            >
              <p className="font-semibold text-white">{variant.name}</p>
              <div className="mt-3 flex gap-1.5">
                {variant.schedule.map((dayId, i) => {
                  const day = variant.days.find((d) => d.id === dayId)
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-500">{DAY_LABELS[i]}</span>
                      <div
                        className={`h-8 w-full rounded-lg ${dayId ? 'bg-brand-500/70' : 'bg-white/5'}`}
                        title={day?.name}
                      />
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {variant.days.map((d) => d.name).join(' · ')}
              </p>
            </button>
          ))}
        </section>
      )}
    </div>
  )
}
