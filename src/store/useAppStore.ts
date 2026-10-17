import { create } from 'zustand'
import { localRepository as repo } from '../db/repository'
import type {
  AppSettings,
  BodyMeasurement,
  BodyWeightEntry,
  CustomExercise,
  DataExport,
  ExerciseNote,
  ProgressPhoto,
  UserPlan,
  WorkoutSession,
} from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface AppState {
  loading: boolean
  activePlan: UserPlan | null
  allPlans: UserPlan[]
  customExercises: CustomExercise[]
  sessions: WorkoutSession[]
  bodyWeights: BodyWeightEntry[]
  bodyMeasurements: BodyMeasurement[]
  progressPhotos: ProgressPhoto[]
  exerciseNotes: ExerciseNote[]
  settings: AppSettings
  init: () => Promise<void>
  setPlan: (plan: UserPlan) => Promise<void>
  updatePlan: (updater: (plan: UserPlan) => UserPlan) => Promise<void>
  switchPlan: (id: string) => Promise<void>
  removePlan: (id: string) => Promise<void>
  clearPlan: () => Promise<void>
  addCustomExercise: (exercise: CustomExercise) => Promise<void>
  removeCustomExercise: (id: string) => Promise<void>
  addSession: (session: WorkoutSession) => Promise<void>
  removeSession: (id: string) => Promise<void>
  addBodyWeight: (entry: BodyWeightEntry) => Promise<void>
  removeBodyWeight: (id: string) => Promise<void>
  addBodyMeasurement: (entry: BodyMeasurement) => Promise<void>
  removeBodyMeasurement: (id: string) => Promise<void>
  addProgressPhoto: (entry: ProgressPhoto) => Promise<void>
  removeProgressPhoto: (id: string) => Promise<void>
  setExerciseNote: (exerciseId: string, note: string) => Promise<void>
  removeExerciseNote: (exerciseId: string) => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  exportAll: () => Promise<DataExport>
  importAll: (data: DataExport) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  loading: true,
  activePlan: null,
  allPlans: [],
  customExercises: [],
  sessions: [],
  bodyWeights: [],
  bodyMeasurements: [],
  progressPhotos: [],
  exerciseNotes: [],
  settings: DEFAULT_SETTINGS,

  init: async () => {
    const [
      plan,
      allPlans,
      customExercises,
      sessions,
      bodyWeights,
      exerciseNotes,
      settings,
      bodyMeasurements,
      progressPhotos,
    ] = await Promise.all([
      repo.getActivePlan(),
      repo.getAllPlans(),
      repo.getCustomExercises(),
      repo.getSessions(),
      repo.getBodyWeights(),
      repo.getExerciseNotes(),
      repo.getSettings(),
      repo.getBodyMeasurements(),
      repo.getProgressPhotos(),
    ])
    set({
      activePlan: plan ?? null,
      allPlans,
      customExercises,
      sessions,
      bodyWeights,
      exerciseNotes,
      settings,
      bodyMeasurements,
      progressPhotos,
      loading: false,
    })
  },

  setPlan: async (plan) => {
    await repo.savePlan(plan)
    await repo.setActivePlan(plan.id)
    set((s) => ({
      activePlan: plan,
      allPlans: [plan, ...s.allPlans.filter((p) => p.id !== plan.id)].map((p) =>
        p.id === plan.id ? plan : { ...p, active: false },
      ),
    }))
  },

  updatePlan: async (updater) => {
    const current = get().activePlan
    if (!current) return
    const updated = updater(current)
    await repo.savePlan(updated)
    set((s) => ({
      activePlan: updated,
      allPlans: s.allPlans.map((p) => (p.id === updated.id ? updated : p)),
    }))
  },

  switchPlan: async (id) => {
    const target = get().allPlans.find((p) => p.id === id)
    if (!target) return
    await repo.setActivePlan(id)
    set((s) => ({
      activePlan: { ...target, active: true },
      allPlans: s.allPlans.map((p) => ({ ...p, active: p.id === id })),
    }))
  },

  removePlan: async (id) => {
    await repo.deletePlan(id)
    const remaining = get().allPlans.filter((p) => p.id !== id)
    const wasActive = get().activePlan?.id === id
    if (wasActive && remaining.length > 0) {
      await repo.setActivePlan(remaining[0].id)
      set({
        allPlans: remaining.map((p, i) => ({ ...p, active: i === 0 })),
        activePlan: { ...remaining[0], active: true },
      })
    } else {
      set({ allPlans: remaining, activePlan: wasActive ? null : get().activePlan })
    }
  },

  clearPlan: async () => {
    const current = get().activePlan
    if (current) {
      await repo.deletePlan(current.id)
    }
    set((s) => ({ activePlan: null, allPlans: s.allPlans.filter((p) => p.id !== current?.id) }))
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

  addBodyWeight: async (entry) => {
    await repo.saveBodyWeight(entry)
    set((s) => ({ bodyWeights: [...s.bodyWeights.filter((b) => b.id !== entry.id), entry].sort((a, b) => a.date.localeCompare(b.date)) }))
  },

  removeBodyWeight: async (id) => {
    await repo.deleteBodyWeight(id)
    set((s) => ({ bodyWeights: s.bodyWeights.filter((b) => b.id !== id) }))
  },

  addBodyMeasurement: async (entry) => {
    await repo.saveBodyMeasurement(entry)
    set((s) => ({
      bodyMeasurements: [...s.bodyMeasurements.filter((b) => b.id !== entry.id), entry].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }))
  },

  removeBodyMeasurement: async (id) => {
    await repo.deleteBodyMeasurement(id)
    set((s) => ({ bodyMeasurements: s.bodyMeasurements.filter((b) => b.id !== id) }))
  },

  addProgressPhoto: async (entry) => {
    await repo.saveProgressPhoto(entry)
    set((s) => ({
      progressPhotos: [...s.progressPhotos.filter((p) => p.id !== entry.id), entry].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }))
  },

  removeProgressPhoto: async (id) => {
    await repo.deleteProgressPhoto(id)
    set((s) => ({ progressPhotos: s.progressPhotos.filter((p) => p.id !== id) }))
  },

  setExerciseNote: async (exerciseId, note) => {
    const entry: ExerciseNote = { exerciseId, note, updatedAt: Date.now() }
    if (note.trim() === '') {
      await repo.deleteExerciseNote(exerciseId)
      set((s) => ({ exerciseNotes: s.exerciseNotes.filter((n) => n.exerciseId !== exerciseId) }))
      return
    }
    await repo.saveExerciseNote(entry)
    set((s) => ({ exerciseNotes: [...s.exerciseNotes.filter((n) => n.exerciseId !== exerciseId), entry] }))
  },

  removeExerciseNote: async (exerciseId) => {
    await repo.deleteExerciseNote(exerciseId)
    set((s) => ({ exerciseNotes: s.exerciseNotes.filter((n) => n.exerciseId !== exerciseId) }))
  },

  updateSettings: async (patch) => {
    const updated = { ...get().settings, ...patch }
    await repo.saveSettings(updated)
    set({ settings: updated })
  },

  exportAll: () => repo.exportAll(),

  importAll: async (data) => {
    await repo.importAll(data)
    await get().init()
  },
}))
