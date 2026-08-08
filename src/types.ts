export type Category = 'Oberkörper' | 'Unterkörper'

export interface MovementPattern {
  id: string
  name: string
  category: Category
}

export interface ExerciseOption {
  id: string
  name: string
  movementPatternId: string
}

/** Ein Platzhalter innerhalb eines Trainingstags-Templates (noch ohne konkrete Übung). */
export interface SlotTemplate {
  id: string
  label: string
  sets: number
  repsMin: number
  repsMax: number
  /** Welche Bewegungsmuster für diesen Slot infrage kommen. Leer = komplett freie Wahl. */
  movementPatternIds: string[]
}

export interface DayTemplate {
  id: string
  name: string
  slots: SlotTemplate[]
}

export interface SplitVariant {
  id: string
  name: string
  /** 7 Einträge (Tag 1-7), dayTemplateId === null bedeutet Restday. */
  schedule: (string | null)[]
  days: DayTemplate[]
}

export interface SplitOption {
  daysPerWeek: number
  label: string
  variants: SplitVariant[]
}

/** Vom Nutzer gewählte Übung für einen Plan-Slot inkl. seiner aktuellen Zielwerte. */
export interface UserPlanSlot {
  slotId: string
  label: string
  sets: number
  repsMin: number
  repsMax: number
  movementPatternIds: string[]
  exerciseId: string | null
  exerciseName: string | null
  /** Individuelle Pausenzeit in Sekunden; unset = Standardwert verwenden. */
  restSeconds?: number
  /** Slots mit derselben ID werden als Superset ohne volle Pause dazwischen behandelt. */
  supersetGroup?: string | null
}

export interface UserPlanDay {
  id: string
  dayTemplateId: string
  name: string
  slots: UserPlanSlot[]
}

export interface UserPlan {
  id: string
  createdAt: number
  daysPerWeek: number
  splitLabel: string
  variantId: string
  variantName: string
  schedule: (string | null)[]
  days: UserPlanDay[]
  active: boolean
}

export interface CustomExercise {
  id: string
  name: string
  movementPatternId: string
  createdAt: number
}

export type SetType = 'normal' | 'warmup' | 'failure' | 'dropset'

export interface SetEntry {
  setNumber: number
  reps: number
  weight: number
  completed: boolean
  type?: SetType
  /** Rate of Perceived Exertion, 1-10 (optional). */
  rpe?: number
}

export interface ExerciseLogEntry {
  slotId: string
  exerciseId: string
  exerciseName: string
  label: string
  targetSets: number
  repsMin: number
  repsMax: number
  sets: SetEntry[]
  notes?: string
  supersetGroup?: string | null
}

export interface WorkoutSession {
  id: string
  planId: string
  planDayId: string
  dayName: string
  date: string
  startedAt: number
  finishedAt: number | null
  exercises: ExerciseLogEntry[]
}

export interface BodyWeightEntry {
  id: string
  date: string
  weight: number
  createdAt: number
}

/** Vollständiger Export aller lokalen Nutzerdaten (für Backup/Übertragung). */
export interface DataExport {
  exportedAt: string
  version: 1
  plans: UserPlan[]
  customExercises: CustomExercise[]
  sessions: WorkoutSession[]
  bodyWeights: BodyWeightEntry[]
}
