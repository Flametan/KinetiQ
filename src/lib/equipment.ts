export type Equipment = 'Langhantel' | 'Kurzhantel' | 'Kabelzug' | 'Maschine' | 'Eigengewicht' | 'Sonstiges'

export const EQUIPMENT_OPTIONS: Equipment[] = [
  'Langhantel',
  'Kurzhantel',
  'Kabelzug',
  'Maschine',
  'Eigengewicht',
  'Sonstiges',
]

const RULES: [RegExp, Equipment][] = [
  [/langhantel|barbell/i, 'Langhantel'],
  [/kurzhantel|dumbbell/i, 'Kurzhantel'],
  [/kabelzug|cable|seil/i, 'Kabelzug'],
  [/multipresse|maschine|machine|presse/i, 'Maschine'],
  [
    /klimmzüge|chin ups|dips|crunches|sit-ups|beinheben|rollout|ab wheel|hyperextensions|good mornings|split squat/i,
    'Eigengewicht',
  ],
]

/** Leitet die Ausrüstungskategorie aus dem Übungsnamen her (keine separate Datenpflege nötig). */
export function inferEquipment(name: string): Equipment {
  for (const [pattern, equipment] of RULES) {
    if (pattern.test(name)) return equipment
  }
  return 'Sonstiges'
}
