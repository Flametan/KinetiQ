import type { WorkoutSession } from '../types'

export interface MonthRange {
  from: number
  to: number
  label: string
}

/** Kalendermonat, `monthsAgo` Monate vor heute (0 = aktueller Monat). */
export function getMonthRange(monthsAgo: number): MonthRange {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() - monthsAgo
  const from = new Date(year, month, 1).getTime()
  const to = new Date(year, month + 1, 1).getTime() - 1
  const label = new Date(year, month, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  return { from, to, label }
}

function workingSets(entrySets: WorkoutSession['exercises'][number]['sets']) {
  return entrySets.filter((s) => s.completed && s.reps > 0 && s.weight > 0 && s.type !== 'warmup')
}

export interface MonthlyStats {
  workouts: number
  durationMs: number
  volume: number
  sets: number
}

function statsForRange(sessions: WorkoutSession[], from: number, to: number): MonthlyStats {
  const inRange = sessions.filter((s) => {
    const t = new Date(s.date).getTime()
    return t >= from && t <= to
  })
  let durationMs = 0
  let volume = 0
  let sets = 0
  for (const session of inRange) {
    if (session.startedAt && session.finishedAt) durationMs += session.finishedAt - session.startedAt
    for (const entry of session.exercises) {
      const working = workingSets(entry.sets)
      sets += working.length
      volume += working.reduce((sum, s) => sum + s.weight * s.reps, 0)
    }
  }
  return { workouts: inRange.length, durationMs, volume, sets }
}

export interface MonthlyReport {
  current: MonthlyStats
  previous: MonthlyStats
  label: string
}

/** Statistiken für einen Kalendermonat plus Vergleich zum Vormonat. */
export function getMonthlyReport(sessions: WorkoutSession[], monthsAgo = 0): MonthlyReport {
  const curRange = getMonthRange(monthsAgo)
  const prevRange = getMonthRange(monthsAgo + 1)
  return {
    current: statsForRange(sessions, curRange.from, curRange.to),
    previous: statsForRange(sessions, prevRange.from, prevRange.to),
    label: curRange.label,
  }
}

export interface NewRecord {
  exerciseId: string
  exerciseName: string
  weight: number
  date: string
}

/** Übungen, bei denen innerhalb des Zeitraums ein neuer Allzeit-Bestwert (Gewicht) erzielt wurde. */
export function getNewRecordsInRange(sessions: WorkoutSession[], from: number, to: number): NewRecord[] {
  // Älteste zuerst, damit "bisheriger Bestwert" korrekt fortgeschrieben wird.
  const chronological = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const bestBefore = new Map<string, number>()
  const records: NewRecord[] = []

  for (const session of chronological) {
    const t = new Date(session.date).getTime()
    const inRange = t >= from && t <= to
    for (const entry of session.exercises) {
      const working = workingSets(entry.sets)
      if (working.length === 0) continue
      const maxWeight = Math.max(...working.map((s) => s.weight))
      const prior = bestBefore.get(entry.exerciseId) ?? 0
      if (inRange && maxWeight > prior) {
        records.push({ exerciseId: entry.exerciseId, exerciseName: entry.exerciseName, weight: maxWeight, date: session.date })
      }
      if (maxWeight > prior) bestBefore.set(entry.exerciseId, maxWeight)
    }
  }
  return records
}
