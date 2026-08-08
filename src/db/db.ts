import Dexie, { type Table } from 'dexie'
import type { BodyWeightEntry, CustomExercise, UserPlan, WorkoutSession } from '../types'

export class KinetiqDB extends Dexie {
  plans!: Table<UserPlan, string>
  customExercises!: Table<CustomExercise, string>
  sessions!: Table<WorkoutSession, string>
  bodyWeights!: Table<BodyWeightEntry, string>

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
  }
}

export const db = new KinetiqDB()
