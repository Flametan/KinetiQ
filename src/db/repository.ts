import { db } from './db'
import type { BodyWeightEntry, CustomExercise, DataExport, UserPlan, WorkoutSession } from '../types'

/**
 * Abstraktion über die Datenhaltung. Aktuell rein lokal (IndexedDB via Dexie).
 * Ein späteres Backend kann dieselbe Schnittstelle implementieren (REST/Sync),
 * ohne dass UI-Code oder der Store angepasst werden müssen.
 */
export interface DataRepository {
  getActivePlan(): Promise<UserPlan | undefined>
  getAllPlans(): Promise<UserPlan[]>
  savePlan(plan: UserPlan): Promise<void>
  deletePlan(id: string): Promise<void>
  setActivePlan(id: string): Promise<void>

  getCustomExercises(): Promise<CustomExercise[]>
  addCustomExercise(exercise: CustomExercise): Promise<void>
  deleteCustomExercise(id: string): Promise<void>

  getSessions(): Promise<WorkoutSession[]>
  saveSession(session: WorkoutSession): Promise<void>
  deleteSession(id: string): Promise<void>

  getBodyWeights(): Promise<BodyWeightEntry[]>
  saveBodyWeight(entry: BodyWeightEntry): Promise<void>
  deleteBodyWeight(id: string): Promise<void>

  exportAll(): Promise<DataExport>
  importAll(data: DataExport): Promise<void>
}

export const localRepository: DataRepository = {
  async getActivePlan() {
    return db.plans.filter((p) => p.active).first()
  },

  async getAllPlans() {
    return db.plans.orderBy('createdAt').reverse().toArray()
  },

  async savePlan(plan) {
    await db.plans.put(plan)
  },

  async deletePlan(id) {
    await db.plans.delete(id)
  },

  async setActivePlan(id) {
    await db.transaction('rw', db.plans, async () => {
      const all = await db.plans.toArray()
      await Promise.all(
        all.map((p) => db.plans.update(p.id, { active: p.id === id })),
      )
    })
  },

  async getCustomExercises() {
    return db.customExercises.orderBy('createdAt').toArray()
  },

  async addCustomExercise(exercise) {
    await db.customExercises.put(exercise)
  },

  async deleteCustomExercise(id) {
    await db.customExercises.delete(id)
  },

  async getSessions() {
    return db.sessions.orderBy('startedAt').reverse().toArray()
  },

  async saveSession(session) {
    await db.sessions.put(session)
  },

  async deleteSession(id) {
    await db.sessions.delete(id)
  },

  async getBodyWeights() {
    return db.bodyWeights.orderBy('date').toArray()
  },

  async saveBodyWeight(entry) {
    await db.bodyWeights.put(entry)
  },

  async deleteBodyWeight(id) {
    await db.bodyWeights.delete(id)
  },

  async exportAll() {
    const [plans, customExercises, sessions, bodyWeights] = await Promise.all([
      db.plans.toArray(),
      db.customExercises.toArray(),
      db.sessions.toArray(),
      db.bodyWeights.toArray(),
    ])
    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      plans,
      customExercises,
      sessions,
      bodyWeights,
    }
  },

  async importAll(data) {
    await db.transaction('rw', db.plans, db.customExercises, db.sessions, db.bodyWeights, async () => {
      await Promise.all([
        db.plans.clear(),
        db.customExercises.clear(),
        db.sessions.clear(),
        db.bodyWeights.clear(),
      ])
      await Promise.all([
        db.plans.bulkPut(data.plans ?? []),
        db.customExercises.bulkPut(data.customExercises ?? []),
        db.sessions.bulkPut(data.sessions ?? []),
        db.bodyWeights.bulkPut(data.bodyWeights ?? []),
      ])
    })
  },
}
