import type { SetEntry, WorkoutSession } from '../types'

/** Sätze der letzten Session, in der diese Übung vorkam (sessions muss neueste zuerst sortiert sein). */
export function getLastSetsForExercise(
  sessions: WorkoutSession[],
  exerciseId: string,
): SetEntry[] | null {
  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId)
    if (entry) return entry.sets
  }
  return null
}

export interface ProgressPoint {
  date: string
  sessionId: string
  maxWeight: number
  totalVolume: number
  bestReps: number
}

export function getProgressForExercise(
  sessions: WorkoutSession[],
  exerciseId: string,
): ProgressPoint[] {
  const points: ProgressPoint[] = []
  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId)
    if (!entry) continue
    const completedSets = entry.sets.filter((s) => s.completed && s.reps > 0 && s.type !== 'warmup')
    if (completedSets.length === 0) continue
    points.push({
      date: session.date,
      sessionId: session.id,
      maxWeight: Math.max(...completedSets.map((s) => s.weight)),
      totalVolume: completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0),
      bestReps: Math.max(...completedSets.map((s) => s.reps)),
    })
  }
  return points.reverse()
}

export function listLoggedExerciseIds(sessions: WorkoutSession[]): { id: string; name: string }[] {
  const map = new Map<string, string>()
  for (const session of sessions) {
    for (const entry of session.exercises) {
      if (!map.has(entry.exerciseId)) map.set(entry.exerciseId, entry.exerciseName)
    }
  }
  return Array.from(map, ([id, name]) => ({ id, name }))
}
