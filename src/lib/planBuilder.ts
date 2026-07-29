import type { SplitVariant, UserPlan, UserPlanDay } from '../types'
import { exerciseOptionsByPattern } from '../data/exerciseOptions'
import { generateId } from '../utils/id'

/**
 * Erzeugt aus einem Split-Template einen konkreten, bearbeitbaren Trainingsplan.
 * Slots mit genau einem Bewegungsmuster bekommen die erste Übung aus der
 * Übungsauswahl vorbelegt, alle anderen (freie Wahl / mehrere Muster) bleiben
 * offen und müssen vom Nutzer zugewiesen werden.
 */
export function buildUserPlanFromVariant(
  daysPerWeek: number,
  splitLabel: string,
  variant: SplitVariant,
): UserPlan {
  const days: UserPlanDay[] = variant.days.map((day) => ({
    id: generateId('pday'),
    dayTemplateId: day.id,
    name: day.name,
    slots: day.slots.map((slot) => {
      const defaultOption =
        slot.movementPatternIds.length === 1
          ? exerciseOptionsByPattern[slot.movementPatternIds[0]]?.[0]
          : undefined
      return {
        slotId: slot.id,
        label: slot.label,
        sets: slot.sets,
        repsMin: slot.repsMin,
        repsMax: slot.repsMax,
        movementPatternIds: slot.movementPatternIds,
        exerciseId: defaultOption?.id ?? null,
        exerciseName: defaultOption?.name ?? null,
      }
    }),
  }))

  const templateIdToPlanDayId = new Map(
    variant.days.map((templateDay, i) => [templateDay.id, days[i].id]),
  )

  const schedule = variant.schedule.map((templateId) =>
    templateId ? (templateIdToPlanDayId.get(templateId) ?? null) : null,
  )

  return {
    id: generateId('plan'),
    createdAt: Date.now(),
    daysPerWeek,
    splitLabel,
    variantId: variant.id,
    variantName: variant.name,
    schedule,
    days,
    active: true,
  }
}
