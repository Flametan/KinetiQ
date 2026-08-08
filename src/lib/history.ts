import { exerciseOptions } from '../data/exerciseOptions'
import { movementPatternById } from '../data/movementPatterns'
import type { CustomExercise, SetEntry, WorkoutSession } from '../types'

const exercisePatternById = new Map(exerciseOptions.map((e) => [e.id, e.movementPatternId]))

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

/** Geschätztes 1-Rep-Max nach der Epley-Formel. */
export function calculateE1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

function workingSets(entrySets: SetEntry[]) {
  return entrySets.filter((s) => s.completed && s.reps > 0 && s.weight > 0 && s.type !== 'warmup')
}

export interface ProgressPoint {
  date: string
  sessionId: string
  maxWeight: number
  totalVolume: number
  bestReps: number
  estimated1RM: number
}

export function getProgressForExercise(
  sessions: WorkoutSession[],
  exerciseId: string,
): ProgressPoint[] {
  const points: ProgressPoint[] = []
  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId)
    if (!entry) continue
    const completedSets = workingSets(entry.sets)
    if (completedSets.length === 0) continue
    points.push({
      date: session.date,
      sessionId: session.id,
      maxWeight: Math.max(...completedSets.map((s) => s.weight)),
      totalVolume: completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0),
      bestReps: Math.max(...completedSets.map((s) => s.reps)),
      estimated1RM: Math.max(...completedSets.map((s) => calculateE1RM(s.weight, s.reps))),
    })
  }
  return points.reverse()
}

export interface PersonalRecords {
  bestWeight: number
  bestWeightDate: string | null
  bestReps: number
  bestRepsDate: string | null
  best1RM: number
  best1RMDate: string | null
}

const EMPTY_RECORDS: PersonalRecords = {
  bestWeight: 0,
  bestWeightDate: null,
  bestReps: 0,
  bestRepsDate: null,
  best1RM: 0,
  best1RMDate: null,
}

/** Bestwerte einer Übung über alle Sessions hinweg (Warm-up-Sätze ausgenommen). */
export function getPersonalRecords(sessions: WorkoutSession[], exerciseId: string): PersonalRecords {
  const records = { ...EMPTY_RECORDS }
  for (const session of sessions) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId)
    if (!entry) continue
    for (const set of workingSets(entry.sets)) {
      if (set.weight > records.bestWeight) {
        records.bestWeight = set.weight
        records.bestWeightDate = session.date
      }
      if (set.reps > records.bestReps) {
        records.bestReps = set.reps
        records.bestRepsDate = session.date
      }
      const e1rm = calculateE1RM(set.weight, set.reps)
      if (e1rm > records.best1RM) {
        records.best1RM = e1rm
        records.best1RMDate = session.date
      }
    }
  }
  return records
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

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Aktuelle Serie an aufeinanderfolgenden Tagen mit mindestens einem Training. */
export function computeStreak(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0
  const trainedDays = new Set(sessions.map((s) => startOfDay(new Date(s.date).getTime())))
  const oneDay = 86_400_000
  let cursor = startOfDay(Date.now())
  if (!trainedDays.has(cursor)) cursor -= oneDay
  let streak = 0
  while (trainedDays.has(cursor)) {
    streak++
    cursor -= oneDay
  }
  return streak
}

/** Set von Kalendertagen (toDateString-kompatible Zeitstempel), an denen trainiert wurde. */
export function getTrainedDaySet(sessions: WorkoutSession[]): Set<number> {
  return new Set(sessions.map((s) => startOfDay(new Date(s.date).getTime())))
}

function resolveMovementPatternId(exerciseId: string, customExercises: CustomExercise[]): string | undefined {
  return exercisePatternById.get(exerciseId) ?? customExercises.find((c) => c.id === exerciseId)?.movementPatternId
}

export interface MuscleBalanceEntry {
  movementPatternId: string
  name: string
  category: 'Oberkörper' | 'Unterkörper'
  sets: number
  volume: number
}

/** Anzahl Arbeitssätze & Volumen je Bewegungsmuster in den letzten `days` Tagen. */
export function getMuscleBalance(
  sessions: WorkoutSession[],
  customExercises: CustomExercise[],
  days = 7,
): MuscleBalanceEntry[] {
  const cutoff = Date.now() - days * 86_400_000
  const totals = new Map<string, { sets: number; volume: number }>()

  for (const session of sessions) {
    if (new Date(session.date).getTime() < cutoff) continue
    for (const entry of session.exercises) {
      const patternId = resolveMovementPatternId(entry.exerciseId, customExercises)
      if (!patternId) continue
      const sets = workingSets(entry.sets)
      if (sets.length === 0) continue
      const current = totals.get(patternId) ?? { sets: 0, volume: 0 }
      current.sets += sets.length
      current.volume += sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
      totals.set(patternId, current)
    }
  }

  return Array.from(totals, ([movementPatternId, { sets, volume }]) => {
    const pattern = movementPatternById.get(movementPatternId)
    return {
      movementPatternId,
      name: pattern?.name ?? movementPatternId,
      category: pattern?.category ?? 'Oberkörper',
      sets,
      volume,
    }
  }).sort((a, b) => b.volume - a.volume)
}
