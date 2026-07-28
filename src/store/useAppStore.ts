import { create } from 'zustand'
import { localRepository as repo } from '../db/repository'
import type { CustomExercise, UserPlan, WorkoutSession } from '../types'

interface AppState {
  loading: boolean
  activePlan: UserPlan | null
  customExercises: CustomExercise[]
  sessions: WorkoutSession[]
  init: () => Promise<void>
  setPlan: (plan: UserPlan) => Promise<void>
  updatePlan: (updater: (plan: UserPlan) => UserPlan) => Promise<void>
  clearPlan: () => Promise<void>
  addCustomExercise: (exercise: CustomExercise) => Promise<void>
  removeCustomExercise: (id: string) => Promise<void>
  addSession: (session: WorkoutSession) => Promise<void>
  removeSession: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: true,
  activePlan: null,
  customExercises: [],
  sessions: [],

  init: async () => {
    const [plan, customExercises, sessions] = await Promise.all([
      repo.getActivePlan(),
      repo.getCustomExercises(),
      repo.getSessions(),
    ])
    set({ activePlan: plan ?? null, customExercises, sessions, loading: false })
  },

  setPlan: async (plan) => {
    await repo.savePlan(plan)
    await repo.setActivePlan(plan.id)
    set({ activePlan: plan })
  },

  updatePlan: async (updater) => {
    const current = get().activePlan
    if (!current) return
    const updated = updater(current)
    await repo.savePlan(updated)
    set({ activePlan: updated })
  },

  clearPlan: async () => {
    const current = get().activePlan
    if (current) {
      await repo.deletePlan(current.id)
    }
    set({ activePlan: null })
  },

  addCustomExercise: async (exercise) => {
    await repo.addCustomExercise(exercise)
    set((s) => ({ customExercises: [...s.customExercises, exercise] }))
  },

  removeCustomExercise: async (id) => {
    await repo.deleteCustomExercise(id)
    set((s) => ({ customExercises: s.customExercises.filter((e) => e.id !== id) }))
  },

  addSession: async (session) => {
    await repo.saveSession(session)
    set((s) => ({ sessions: [session, ...s.sessions] }))
  },

  removeSession: async (id) => {
    await repo.deleteSession(id)
    set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }))
  },
}))
