/**
 * Erzeugt eine vollständige Brand-Farbskala (50-900) aus einem einzelnen Farbton (Hue).
 * 300-600 fallen im Dunkel-Modus etwas heller/kräftiger aus als im Hellen, analog zur
 * fest kodierten Rot-Rampe in index.css (bessere Lesbarkeit auf dunklem Hintergrund).
 */
function hsl(h: number, s: number, l: number) {
  return `hsl(${h} ${s}% ${l}%)`
}

const BRAND_TOKENS = [
  '--color-brand-50',
  '--color-brand-100',
  '--color-brand-200',
  '--color-brand-300',
  '--color-brand-400',
  '--color-brand-500',
  '--color-brand-600',
  '--color-brand-700',
  '--color-brand-800',
  '--color-brand-900',
] as const

export function buildBrandPalette(hue: number, dark: boolean): Record<(typeof BRAND_TOKENS)[number], string> {
  const h = ((hue % 360) + 360) % 360
  return {
    '--color-brand-50': hsl(h, 72, 92),
    '--color-brand-100': hsl(h, 64, 84),
    '--color-brand-200': hsl(h, 58, 72),
    '--color-brand-300': dark ? hsl(h, 62, 72) : hsl(h, 60, 60),
    '--color-brand-400': dark ? hsl(h, 68, 60) : hsl(h, 66, 42),
    '--color-brand-500': hsl(h, 70, 45),
    '--color-brand-600': dark ? hsl(h, 62, 52) : hsl(h, 64, 38),
    '--color-brand-700': hsl(h, 64, 30),
    '--color-brand-800': hsl(h, 64, 22),
    '--color-brand-900': hsl(h, 64, 15),
  }
}

/** Setzt die Akzentfarbe zur Laufzeit (null = entfernt die Überschreibung, Standard-Rot aus index.css greift wieder). */
export function applyAccentColor(hue: number | null, dark: boolean) {
  const root = document.documentElement
  if (hue === null) {
    for (const token of BRAND_TOKENS) root.style.removeProperty(token)
    return
  }
  const palette = buildBrandPalette(hue, dark)
  for (const token of BRAND_TOKENS) root.style.setProperty(token, palette[token])
}
