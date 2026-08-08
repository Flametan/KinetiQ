const AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5]

export interface PlateBreakdown {
  perSide: number
  plates: number[]
  remainder: number
}

/** Welche Scheiben (pro Seite) für ein Zielgewicht an einer Langhantel aufgelegt werden müssen. */
export function calculatePlates(targetWeight: number, barWeight = 20): PlateBreakdown {
  const perSide = Math.max(0, (targetWeight - barWeight) / 2)
  let remaining = Math.round(perSide * 1000) / 1000
  const plates: number[] = []
  for (const plate of AVAILABLE_PLATES) {
    while (remaining + 1e-6 >= plate) {
      plates.push(plate)
      remaining = Math.round((remaining - plate) * 1000) / 1000
    }
  }
  return { perSide, plates, remainder: Math.max(0, remaining) }
}
