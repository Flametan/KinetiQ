export interface WarmupSuggestion {
  weight: number
  reps: number
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2
}

/** Schlägt 2-3 Aufwärmsätze auf Basis des Arbeitsgewichts vor (40/60/80 %). */
export function suggestWarmupSets(workingWeight: number): WarmupSuggestion[] {
  if (workingWeight <= 0) return []
  const steps: { pct: number; reps: number }[] = [
    { pct: 0.4, reps: 10 },
    { pct: 0.6, reps: 6 },
    { pct: 0.8, reps: 3 },
  ]
  return steps
    .map(({ pct, reps }) => ({ weight: roundToHalf(workingWeight * pct), reps }))
    .filter((s) => s.weight > 0 && s.weight < workingWeight)
}
