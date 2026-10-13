import Dexie, { type Table } from 'dexie'
import type { AppSettings, BodyWeightEntry, CustomExercise, ExerciseNote, UserPlan, WorkoutSession } from '../types'

export class KinetiqDB extends Dexie {
  plans!: Table<UserPlan, string>
  customExercises!: Table<CustomExercise, string>
  sessions!: Table<WorkoutSession, string>
  bodyWeights!: Table<BodyWeightEntry, string>
  exerciseNotes!: Table<ExerciseNote, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super('kinetiq')
    this.version(1).stores({
      plans: 'id, active, createdAt',
      customExercises: 'id, movementPatternId, createdAt',
      sessions: 'id, planId, planDayId, date, startedAt',
    })
    this.version(2).stores({
      plans: 'id, active, createdAt',
      customExercises: 'id, movementPatternId, createdAt',
      sessions: 'id, planId, planDayId, date, startedAt',
      bodyWeights: 'id, date, createdAt',
    })
    this.version(3).stores({
      plans: 'id, active, createdAt',
      customExercises: 'id, movementPatternId, createdAt',
      sessions: 'id, planId, planDayId, date, startedAt',
      bodyWeights: 'id, date, createdAt',
      exerciseNotes: 'exerciseId, updatedAt',
      settings: 'id',
    })
  }
}

export const db = new KinetiqDB()
