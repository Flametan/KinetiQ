import type { MovementPattern } from '../types'

/**
 * Bewegungsmuster-IDs, wie sie in den Split-Templates referenziert werden.
 * Quelle: "Trainingsplanerstellung" PDF.
 */
export const MP = {
  horizontalDruck: 'mp-horizontal-druck',
  vertikalDruck: 'mp-vertikal-druck',
  vertikalZugEng: 'mp-vertikal-zug-eng',
  vertikalZugBreit: 'mp-vertikal-zug-breit',
  horizontalZugEng: 'mp-horizontal-zug-eng',
  horizontalZugBreit: 'mp-horizontal-zug-breit',
  seithebe: 'mp-seithebe',
  schraegbank: 'mp-schraegbank',
  fly: 'mp-fly',
  flySchraeg: 'mp-fly-schraeg',
  hintereSchulter: 'mp-hintere-schulter',
  bizeps: 'mp-bizeps',
  trizeps: 'mp-trizeps',
  kniebeuge: 'mp-kniebeuge',
  kreuzheben: 'mp-kreuzheben',
  beinpresse: 'mp-beinpresse',
  hueftstreck: 'mp-hueftstreck',
  beinbeuger: 'mp-beinbeuger',
  beinstrecker: 'mp-beinstrecker',
  waden: 'mp-waden',
  adduktoren: 'mp-adduktoren',
  bauch: 'mp-bauch',
} as const

export const movementPatterns: MovementPattern[] = [
  { id: MP.horizontalDruck, name: 'Horizontale Druckbewegung', category: 'Oberkörper' },
  { id: MP.vertikalDruck, name: 'Vertikale Druckbewegung', category: 'Oberkörper' },
  { id: MP.vertikalZugEng, name: 'Vertikale Zugbewegung eng', category: 'Oberkörper' },
  { id: MP.vertikalZugBreit, name: 'Vertikale Zugbewegung breit', category: 'Oberkörper' },
  { id: MP.horizontalZugEng, name: 'Horizontale Zugbewegung eng', category: 'Oberkörper' },
  { id: MP.horizontalZugBreit, name: 'Horizontale Zugbewegung breit', category: 'Oberkörper' },
  { id: MP.seithebe, name: 'Seithebevariante', category: 'Oberkörper' },
  { id: MP.schraegbank, name: 'Schrägbankvariante', category: 'Oberkörper' },
  { id: MP.fly, name: 'Flyvariante', category: 'Oberkörper' },
  { id: MP.flySchraeg, name: 'Flyvariante schräg', category: 'Oberkörper' },
  { id: MP.hintereSchulter, name: 'Hintere Schulter Isolation', category: 'Oberkörper' },
  { id: MP.bizeps, name: 'Bizeps Isolation', category: 'Oberkörper' },
  { id: MP.trizeps, name: 'Trizeps Isolation', category: 'Oberkörper' },
  { id: MP.kniebeuge, name: 'Kniebeugevariation', category: 'Unterkörper' },
  { id: MP.kreuzheben, name: 'Kreuzhebevariante', category: 'Unterkörper' },
  { id: MP.beinpresse, name: 'Beinpresse Variation', category: 'Unterkörper' },
  { id: MP.hueftstreck, name: 'Hüftstreckvariation', category: 'Unterkörper' },
  { id: MP.beinbeuger, name: 'Beinbeuger Isolation', category: 'Unterkörper' },
  { id: MP.beinstrecker, name: 'Beinstrecker', category: 'Unterkörper' },
  { id: MP.waden, name: 'Waden Isolation', category: 'Unterkörper' },
  { id: MP.adduktoren, name: 'Adduktoren', category: 'Unterkörper' },
  { id: MP.bauch, name: 'Bauch Isolation', category: 'Unterkörper' },
]

export const movementPatternById = new Map(movementPatterns.map((mp) => [mp.id, mp]))
