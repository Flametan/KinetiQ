import type { WeightUnit } from '../types'

const KG_PER_LB = 0.45359237

/** Rundet auf das nächste Vielfache von `step`. */
function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

/** Rohe Umrechnung kg -> Einheit, ohne Rundung (z.B. für Volumen-Summen). */
export function kgToUnit(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB
}

/** Wandelt einen kanonisch in kg gespeicherten Wert in die Anzeige-Einheit um (auf 0.5 gerundet). */
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return roundToStep(kgToUnit(kg, unit), 0.5)
}

/** Wandelt einen vom Nutzer eingegebenen Wert in der Anzeige-Einheit zurück in kg (kanonisch). */
export function displayToKg(value: number, unit: WeightUnit): number {
  if (unit === 'kg') return value
  return value * KG_PER_LB
}

export function unitLabel(unit: WeightUnit): string {
  return unit === 'kg' ? 'kg' : 'lb'
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  const display = kgToDisplay(kg, unit)
  return `${display} ${unitLabel(unit)}`
}

/** Standard-Scheibensätze (pro Seite verfügbar) je Einheit. */
export const PLATE_SETS: Record<WeightUnit, number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5],
  lb: [45, 35, 25, 10, 5, 2.5],
}

/** Standard-Langhantelgewicht je Einheit. */
export const DEFAULT_BAR_WEIGHT: Record<WeightUnit, number> = {
  kg: 20,
  lb: 45,
}
