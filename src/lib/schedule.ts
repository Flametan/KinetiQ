function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Index (0-6) im 7-Tage-Zyklus des Plans für einen gegebenen Zeitpunkt.
 * Der Zyklus startet nicht an einem festen Wochentag, sondern am Tag der
 * Planerstellung ("Tag 1") und wiederholt sich danach alle 7 Tage.
 */
export function getDayIndexInCycle(createdAt: number, now: number = Date.now()): number {
  const start = startOfDay(createdAt)
  const today = startOfDay(now)
  const diffDays = Math.round((today - start) / 86_400_000)
  return ((diffDays % 7) + 7) % 7
}

export function dayLabel(index: number): string {
  return `Tag ${index + 1}`
}

export const DAY_CYCLE_LABELS = Array.from({ length: 7 }, (_, i) => dayLabel(i))
