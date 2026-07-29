import Dexie, { type Table } from 'dexie'
import type { CustomExercise, UserPlan, WorkoutSession } from '../types'

export class KinetiqDB extends Dexie {
  plans!: Table<UserPlan, string>
  customExercises!: Table<CustomExercise, string>
  sessions!: Table<WorkoutSession, string>

  constructor() {
    super('kinetiq')
    this.version(1).stores({
      plans: 'id, active, createdAt',
      customExercises: 'id, movementPatternId, createdAt',
      sessions: 'id, planId, planDayId, date, startedAt',
    })
  }
}

export const db = new KinetiqDB()
