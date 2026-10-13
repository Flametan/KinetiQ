import ExercisePicker from './ExercisePicker'
import type { UserPlanDay, UserPlanSlot } from '../types'

interface Props {
  day: UserPlanDay
  onClose: () => void
  onSelectExercise: (dayId: string, slotId: string, ex: { id: string; name: string }) => void
  onToggleSuperset: (dayId: string, index: number) => void
  onMoveSlot: (dayId: string, index: number, direction: -1 | 1) => void
  editingSlot: { dayId: string; slot: UserPlanSlot } | null
  onOpenPicker: (dayId: string, slot: UserPlanSlot) => void
  onClosePicker: () => void
}

/** Vollständige Tages-Bearbeitung (Reihenfolge, Supersätze, Übungswahl) als eigener Sheet statt Akkordeon. */
export default function DayEditSheet({
  day,
  onClose,
  onSelectExercise,
  onToggleSuperset,
  onMoveSlot,
  editingSlot,
  onOpenPicker,
  onClosePicker,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="max-h-[88dvh] w-full max-w-md overflow-hidden border-t-[3px] border-ink bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.1em] text-dim">Tag bearbeiten</p>
            <h2 className="font-display text-lg text-ink">{day.name}</h2>
          </div>
          <button onClick={onClose} className="icon-btn press text-dim hover:bg-panel2 hover:text-ink" aria-label="Schließen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="scrollbar-none max-h-[calc(88dvh-4.5rem)] overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-2">
            {day.slots.map((slot, i) => {
              const next = day.slots[i + 1]
              const connected = !!next && !!slot.supersetGroup && slot.supersetGroup === next.supersetGroup
              const canReorder = !slot.supersetGroup
              return (
                <div key={slot.slotId} className="flex flex-col gap-2">
                  <div
                    className={`flex items-stretch gap-2 border bg-panel2 ${
                      slot.supersetGroup ? 'border-brand-300' : 'border-line'
                    }`}
                  >
                    <div className="flex w-11 shrink-0 flex-col border-r border-line">
                      <button
                        onClick={() => onMoveSlot(day.id, i, -1)}
                        disabled={i === 0 || !canReorder}
                        className="press flex min-h-[22px] flex-1 items-center justify-center text-dim hover:text-ink disabled:opacity-25"
                        aria-label="Nach oben verschieben"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onMoveSlot(day.id, i, 1)}
                        disabled={i === day.slots.length - 1 || !canReorder}
                        className="press flex min-h-[22px] flex-1 items-center justify-center border-t border-line text-dim hover:text-ink disabled:opacity-25"
                        aria-label="Nach unten verschieben"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => onOpenPicker(day.id, slot)}
                      className="press flex flex-1 items-center justify-between gap-3 px-3.5 py-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs text-dim">{slot.label}</p>
                        <p className="truncate text-sm font-semibold text-ink">{slot.exerciseName ?? 'Übung wählen'}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="border border-line bg-surface px-2 py-1 text-xs font-semibold text-dim">
                          {slot.sets} × {slot.repsMin}-{slot.repsMax}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-dim">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </div>
                    </button>
                  </div>
                  {next && (
                    <button
                      onClick={() => onToggleSuperset(day.id, i)}
                      className={`press mx-auto flex items-center gap-1 px-3 py-1 text-[11px] font-semibold ${
                        connected ? 'text-brand-400' : 'text-dim hover:text-ink'
                      }`}
                    >
                      {connected ? '⛓ Verbunden – trennen' : '+ Als Superset verbinden'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {editingSlot && (
        <ExercisePicker
          open
          onClose={onClosePicker}
          label={editingSlot.slot.label}
          movementPatternIds={editingSlot.slot.movementPatternIds}
          currentExerciseId={editingSlot.slot.exerciseId}
          onSelect={(ex) => onSelectExercise(editingSlot.dayId, editingSlot.slot.slotId, ex)}
        />
      )}
    </div>
  )
}
