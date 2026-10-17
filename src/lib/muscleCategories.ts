import { movementPatternById, MP } from '../data/movementPatterns'
import { exerciseOptions } from '../data/exerciseOptions'
import type { CustomExercise, WorkoutSession } from '../types'

export type MuscleCategory = 'Rücken' | 'Brust' | 'Core' | 'Schultern' | 'Arme' | 'Beine'

export const MUSCLE_CATEGORIES: MuscleCategory[] = ['Rücken', 'Brust', 'Core', 'Schultern', 'Arme', 'Beine']

/** Ordnet jedes der 22 Bewegungsmuster einer von 6 groben Muskelkategorien zu
 * (für Radar-Chart & Körper-Wärmebild – beide nutzen dieselbe Einteilung). */
export const muscleCategoryByPattern: Record<string, MuscleCategory> = {
  [MP.horizontalDruck]: 'Brust',
  [MP.schraegbank]: 'Brust',
  [MP.fly]: 'Brust',
  [MP.flySchraeg]: 'Brust',
  [MP.vertikalDruck]: 'Schultern',
  [MP.seithebe]: 'Schultern',
  [MP.hintereSchulter]: 'Schultern',
  [MP.vertikalZugEng]: 'Rücken',
  [MP.vertikalZugBreit]: 'Rücken',
  [MP.horizontalZugEng]: 'Rücken',
  [MP.horizontalZugBreit]: 'Rücken',
  [MP.bizeps]: 'Arme',
  [MP.trizeps]: 'Arme',
  [MP.kniebeuge]: 'Beine',
  [MP.kreuzheben]: 'Beine',
  [MP.beinpresse]: 'Beine',
  [MP.hueftstreck]: 'Beine',
  [MP.beinbeuger]: 'Beine',
  [MP.beinstrecker]: 'Beine',
  [MP.waden]: 'Beine',
  [MP.adduktoren]: 'Beine',
  [MP.bauch]: 'Core',
}

const exercisePatternById = new Map(exerciseOptions.map((e) => [e.id, e.movementPatternId]))

function resolvePatternId(exerciseId: string, customExercises: CustomExercise[]): string | undefined {
  return exercisePatternById.get(exerciseId) ?? customExercises.find((c) => c.id === exerciseId)?.movementPatternId
}

function workingSetCount(sets: WorkoutSession['exercises'][number]['sets']) {
  return sets.filter((s) => s.completed && s.type !== 'warmup').length
}

/** Arbeitssätze je Muskelkategorie innerhalb eines Zeitfensters (für Radar-Chart & Wärmebild). */
export function getMuscleCategoryTotals(
  sessions: WorkoutSession[],
  customExercises: CustomExercise[],
  fromMs: number,
  toMs: number = Date.now(),
): Record<MuscleCategory, number> {
  const totals: Record<MuscleCategory, number> = { Rücken: 0, Brust: 0, Core: 0, Schultern: 0, Arme: 0, Beine: 0 }
  for (const session of sessions) {
    const t = new Date(session.date).getTime()
    if (t < fromMs || t > toMs) continue
    for (const entry of session.exercises) {
      const patternId = resolvePatternId(entry.exerciseId, customExercises)
      if (!patternId) continue
      const category = muscleCategoryByPattern[patternId]
      if (!category) continue
      totals[category] += workingSetCount(entry.sets)
    }
  }
  return totals
}

export function movementPatternCategoryName(patternId: string): string | undefined {
  return movementPatternById.get(patternId)?.name
}
