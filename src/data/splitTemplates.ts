import type { DayTemplate, SplitOption } from '../types'
import { MP } from './movementPatterns'

type Row = [label: string, sets: number, repsMin: number, repsMax: number, patterns: string[]]

function buildDay(id: string, name: string, rows: Row[]): DayTemplate {
  return {
    id,
    name,
    slots: rows.map(([label, sets, repsMin, repsMax, patterns], i) => ({
      id: `${id}-s${i + 1}`,
      label,
      sets,
      repsMin,
      repsMax,
      movementPatternIds: patterns,
    })),
  }
}

const FREE: string[] = []

/* ---------------------------------- 2 Trainingstage ---------------------------------- */

const d2GkA = buildDay('d2-gkA', 'Ganzkörper A', [
  ['Horizontale Druckbewegung', 2, 6, 10, [MP.horizontalDruck]],
  ['Vertikale Zugbewegung breit', 2, 6, 10, [MP.vertikalZugBreit]],
  ['Vertikale Druckbewegung', 2, 6, 10, [MP.vertikalDruck]],
  ['Horizontale Zugbewegung breit', 2, 6, 10, [MP.horizontalZugBreit]],
  ['Beinpresse Variation', 2, 6, 8, [MP.beinpresse]],
  ['Beinbeuger Isolation', 2, 8, 12, [MP.beinbeuger]],
  ['Übung deiner Wahl', 2, 8, 12, FREE],
  ['Übung deiner Wahl', 2, 8, 12, FREE],
])

const d2GkB = buildDay('d2-gkB', 'Ganzkörper B', [
  ['Kreuzhebevariante', 3, 5, 8, [MP.kreuzheben]],
  ['Beinstrecker', 2, 6, 8, [MP.beinstrecker]],
  ['Flyvariante', 2, 6, 10, [MP.fly]],
  ['Vertikale Zugbewegung eng', 2, 6, 10, [MP.vertikalZugEng]],
  ['Horizontale Zugbewegung breit', 2, 6, 10, [MP.horizontalZugBreit]],
  ['Seithebevariante', 2, 8, 12, [MP.seithebe]],
  ['Übung deiner Wahl', 2, 8, 12, FREE],
  ['Übung deiner Wahl', 2, 8, 12, FREE],
])

const split2: SplitOption = {
  daysPerWeek: 2,
  label: '2 Trainingstage',
  variants: [
    {
      id: '2-v1',
      name: 'Ganzkörper-Split',
      schedule: [d2GkA.id, null, null, d2GkB.id, null, null, null],
      days: [d2GkA, d2GkB],
    },
  ],
}

/* ---------------------------------- 3 Trainingstage ---------------------------------- */

const d3v1GkA = buildDay('d3v1-gkA', 'Ganzkörper A', [
  ['Kniebeugevariation', 3, 6, 8, [MP.kniebeuge]],
  ['Horizontale Druckbewegung', 3, 6, 10, [MP.horizontalDruck]],
  ['Vertikale Zugbewegung breit', 2, 6, 10, [MP.vertikalZugBreit]],
  ['Horizontale Zugbewegung breit', 2, 8, 12, [MP.horizontalZugBreit]],
  ['Seithebevariante', 3, 8, 12, [MP.seithebe]],
  ['Beinbeuger Isolation', 2, 8, 12, [MP.beinbeuger]],
  ['Bizeps Isolation', 2, 6, 10, [MP.bizeps]],
])

const d3v1GkB = buildDay('d3v1-gkB', 'Ganzkörper B', [
  ['Kreuzhebevariante', 3, 5, 8, [MP.kreuzheben]],
  ['Vertikale Druckbewegung', 3, 6, 8, [MP.vertikalDruck]],
  ['Beinpresse Variation', 2, 6, 10, [MP.beinpresse]],
  ['Horizontale Zugbewegung eng', 3, 8, 12, [MP.horizontalZugEng]],
  ['Flyvariante', 2, 8, 12, [MP.fly]],
  ['Hintere Schulter Isolation', 2, 8, 12, [MP.hintereSchulter]],
  ['Trizeps Isolation', 3, 8, 12, [MP.trizeps]],
])

const d3v1GkC = buildDay('d3v1-gkC', 'Ganzkörper C', [
  ['Schrägbankvariante', 3, 6, 8, [MP.schraegbank]],
  ['Vertikale Zugbewegung eng', 3, 6, 10, [MP.vertikalZugEng]],
  ['Beinstrecker', 2, 8, 12, [MP.beinstrecker]],
  ['Seithebevariante', 3, 10, 12, [MP.seithebe]],
  ['Bizeps Isolation', 2, 8, 12, [MP.bizeps]],
  ['Waden Isolation', 3, 8, 12, [MP.waden]],
  ['Bauch Isolation', 3, 6, 10, [MP.bauch]],
])

const d3v2Ok = buildDay('d3v2-ok', 'Oberkörper', [
  ['Horizontale Druckbewegung', 3, 6, 8, [MP.horizontalDruck]],
  ['Vertikale Zugbewegung breit', 3, 6, 8, [MP.vertikalZugBreit]],
  ['Seithebevariante', 3, 8, 12, [MP.seithebe]],
  ['Horizontale Zugbewegung breit', 2, 6, 10, [MP.horizontalZugBreit]],
  ['Bizeps Isolation', 2, 6, 10, [MP.bizeps]],
  ['Trizeps Isolation', 2, 6, 10, [MP.trizeps]],
])

const d3v2Uk = buildDay('d3v2-uk', 'Unterkörper', [
  ['Beinbeuger Isolation', 3, 6, 10, [MP.beinbeuger]],
  ['Kniebeugevariation / Beinpresse', 2, 5, 8, [MP.kniebeuge, MP.beinpresse]],
  ['Adduktoren', 2, 8, 12, [MP.adduktoren]],
  ['Beinstrecker', 2, 6, 10, [MP.beinstrecker]],
  ['Waden Isolation', 3, 8, 12, [MP.waden]],
  ['Bauch Isolation', 3, 6, 10, [MP.bauch]],
])

const d3v2Gk = buildDay('d3v2-gk', 'Ganzkörper', [
  ['Kreuzhebevariante', 3, 5, 8, [MP.kreuzheben]],
  ['Flyvariante', 3, 6, 10, [MP.fly]],
  ['Vertikale Zugbewegung eng', 2, 8, 12, [MP.vertikalZugEng]],
  ['Beinpresse Variation', 2, 6, 8, [MP.beinpresse]],
  ['Vertikale Druckbewegung', 2, 6, 10, [MP.vertikalDruck]],
  ['Isolationsübung deiner Wahl', 2, 6, 10, FREE],
  ['Isolationsübung deiner Wahl', 2, 6, 10, FREE],
])

const split3: SplitOption = {
  daysPerWeek: 3,
  label: '3 Trainingstage',
  variants: [
    {
      id: '3-v1',
      name: 'Ganzkörper-Split',
      schedule: [d3v1GkA.id, null, null, d3v1GkB.id, null, d3v1GkC.id, null],
      days: [d3v1GkA, d3v1GkB, d3v1GkC],
    },
    {
      id: '3-v2',
      name: 'Oberkörper / Unterkörper / Ganzkörper',
      schedule: [d3v2Ok.id, null, d3v2Uk.id, null, null, d3v2Gk.id, null],
      days: [d3v2Ok, d3v2Uk, d3v2Gk],
    },
  ],
}

/* ---------------------------------- 4 Trainingstage ---------------------------------- */

const d4v1OkA = buildDay('d4v1-okA', 'Oberkörper A', [
  ['Horizontale Druckbewegung', 3, 6, 10, [MP.horizontalDruck]],
  ['Horizontale Zugbewegung breit', 3, 6, 10, [MP.horizontalZugBreit]],
  ['Vertikale Druckbewegung', 3, 8, 12, [MP.vertikalDruck]],
  ['Vertikale Zugbewegung breit', 2, 8, 12, [MP.vertikalZugBreit]],
  ['Seithebevariante', 3, 8, 12, [MP.seithebe]],
  ['Trizeps Isolation', 2, 8, 12, [MP.trizeps]],
  ['Bizeps Isolation', 2, 8, 12, [MP.bizeps]],
])

const d4v1UkA = buildDay('d4v1-ukA', 'Unterkörper A', [
  ['Beinbeuger Isolation', 3, 6, 10, [MP.beinbeuger]],
  ['Kniebeugevariation', 2, 6, 8, [MP.kniebeuge]],
  ['Beinstrecker', 3, 6, 10, [MP.beinstrecker]],
  ['Hyperextensions', 2, 6, 10, [MP.hueftstreck]],
  ['Waden Isolation', 3, 8, 12, [MP.waden]],
])

const d4v1OkB = buildDay('d4v1-okB', 'Oberkörper B', [
  ['Vertikale Zugbewegung breit', 3, 6, 10, [MP.vertikalZugBreit]],
  ['Schrägbankvariante', 3, 6, 10, [MP.schraegbank]],
  ['Horizontale Zugbewegung eng', 2, 6, 10, [MP.horizontalZugEng]],
  ['Flyvariante', 2, 6, 10, [MP.fly]],
  ['Seithebevariante', 3, 8, 12, [MP.seithebe]],
  ['Bizeps Isolation', 2, 8, 12, [MP.bizeps]],
  ['Trizeps Isolation', 2, 8, 12, [MP.trizeps]],
])

const d4v1UkB = buildDay('d4v1-ukB', 'Unterkörper B', [
  ['Kreuzhebevariante', 3, 6, 8, [MP.kreuzheben]],
  ['Beinpresse Variation', 3, 6, 8, [MP.beinpresse]],
  ['Beinbeuger Isolation', 2, 8, 12, [MP.beinbeuger]],
  ['Adduktoren', 2, 8, 12, [MP.adduktoren]],
  ['Waden Isolation', 2, 6, 10, [MP.waden]],
  ['Bauch Isolation', 3, 8, 12, [MP.bauch]],
])

const d4v2PushFb = buildDay('d4v2-pushfb', 'Push Fullbody', [
  ['Horizontale Druckbewegung', 3, 6, 8, [MP.horizontalDruck]],
  ['Seithebevariante', 3, 8, 12, [MP.seithebe]],
  ['Flyvariante schräg', 2, 6, 10, [MP.flySchraeg]],
  ['Trizeps Isolation', 2, 8, 12, [MP.trizeps]],
  ['Beinpresse Variation', 2, 6, 8, [MP.beinpresse]],
  ['Beinstrecker', 2, 6, 10, [MP.beinstrecker]],
  ['Wadenheben stehend', 3, 6, 10, [MP.waden]],
])

const d4v2PullFb = buildDay('d4v2-pullfb', 'Pull Fullbody', [
  ['Vertikale Zugbewegung breit', 2, 6, 10, [MP.vertikalZugBreit]],
  ['Horizontale Zugbewegung breit', 3, 6, 10, [MP.horizontalZugBreit]],
  ['Horizontale Zugbewegung eng', 2, 6, 10, [MP.horizontalZugEng]],
  ['Bizeps Isolation', 3, 6, 10, [MP.bizeps]],
  ['Beinbeuger Isolation', 3, 6, 10, [MP.beinbeuger]],
  ['Bauch Isolation', 3, 6, 10, [MP.bauch]],
])

const d4v2PushFb2 = buildDay('d4v2-pushfb2', 'Push Fullbody 2', [
  ['Dips', 3, 5, 8, [MP.trizeps]],
  ['Vertikale Druckbewegung', 3, 6, 10, [MP.vertikalDruck]],
  ['Flybewegung', 2, 6, 10, [MP.fly]],
  ['Trizeps Isolation', 2, 6, 10, [MP.trizeps]],
  ['Beinstrecker', 3, 6, 10, [MP.beinstrecker]],
  ['Wadenheben', 3, 6, 10, [MP.waden]],
])

const d4v2PullFb2 = buildDay('d4v2-pullfb2', 'Pull Fullbody 2', [
  ['Kreuzhebevariante', 3, 5, 8, [MP.kreuzheben]],
  ['Vertikale Zugbewegung eng', 3, 6, 10, [MP.vertikalZugEng]],
  ['Horizontale Zugbewegung breit', 2, 6, 10, [MP.horizontalZugBreit]],
  ['Beinbeuger / Po Isolation', 2, 6, 10, [MP.beinbeuger, MP.hueftstreck]],
  ['Preacher Curls', 2, 6, 10, [MP.bizeps]],
  ['Hammer Curls', 2, 6, 10, [MP.bizeps]],
])

const split4: SplitOption = {
  daysPerWeek: 4,
  label: '4 Trainingstage',
  variants: [
    {
      id: '4-v1',
      name: 'Oberkörper / Unterkörper',
      schedule: [d4v1OkA.id, d4v1UkA.id, null, d4v1OkB.id, d4v1UkB.id, null, null],
      days: [d4v1OkA, d4v1UkA, d4v1OkB, d4v1UkB],
    },
    {
      id: '4-v2',
      name: 'Push Fullbody / Pull Fullbody',
      schedule: [d4v2PushFb.id, d4v2PullFb.id, null, null, d4v2PushFb2.id, d4v2PullFb2.id, null],
      days: [d4v2PushFb, d4v2PullFb, d4v2PushFb2, d4v2PullFb2],
    },
  ],
}

/* ---------------------------------- 5 Trainingstage ---------------------------------- */

const d5v1Pull = buildDay('d5v1-pull', 'Pull', [
  ['Horizontale Zugbewegung breit', 3, 6, 10, [MP.horizontalZugBreit]],
  ['Vertikale Zugbewegung eng', 3, 8, 12, [MP.vertikalZugEng]],
  ['Horizontale Zugbewegung eng', 2, 12, 15, [MP.horizontalZugEng]],
  ['Vertikale Zugbewegung breit', 2, 12, 15, [MP.vertikalZugBreit]],
  ['Preacher Curls', 2, 6, 10, [MP.bizeps]],
  ['Hammer Curls', 2, 6, 10, [MP.bizeps]],
])

const d5v1Push = buildDay('d5v1-push', 'Push', [
  ['Horizontale Druckbewegung', 3, 6, 8, [MP.horizontalDruck]],
  ['Schräge Flyvariante', 2, 6, 10, [MP.flySchraeg]],
  ['Dips', 2, 6, 8, [MP.trizeps]],
  ['Seithebevariante', 3, 8, 12, [MP.seithebe]],
  ['Trizeps Isolation', 2, 8, 12, [MP.trizeps]],
])

const d5v1Beine = buildDay('d5v1-beine', 'Beine', [
  ['Kreuzhebevariante', 3, 5, 8, [MP.kreuzheben]],
  ['Beinpresse Variation', 3, 6, 8, [MP.beinpresse]],
  ['Beinbeuger Isolation', 3, 6, 10, [MP.beinbeuger]],
  ['Beinstrecker', 2, 8, 12, [MP.beinstrecker]],
  ['Waden Isolation', 3, 6, 10, [MP.waden]],
])

const d5v1Ok = buildDay('d5v1-ok', 'Oberkörper', [
  ['Vertikale Zugbewegung breit', 3, 6, 10, [MP.vertikalZugBreit]],
  ['Vertikale Druckbewegung', 2, 6, 10, [MP.vertikalDruck]],
  ['Horizontale Zugbewegung breit', 3, 6, 10, [MP.horizontalZugBreit]],
  ['Flyvariante', 2, 6, 10, [MP.fly]],
  ['Seithebevariante', 2, 8, 12, [MP.seithebe]],
  ['Bizeps Isolation', 2, 8, 12, [MP.bizeps]],
  ['Trizeps Isolation', 2, 8, 12, [MP.trizeps]],
])

const d5v1Uk = buildDay('d5v1-uk', 'Unterkörper', [
  ['Kniebeuge / Beinpresse Variation', 2, 6, 8, [MP.kniebeuge, MP.beinpresse]],
  ['Beinbeuger Isolation', 3, 6, 10, [MP.beinbeuger]],
  ['Beinstrecker', 3, 6, 10, [MP.beinstrecker]],
  ['Hüftstreckvariation', 2, 6, 10, [MP.hueftstreck]],
  ['Waden Isolation', 3, 8, 12, [MP.waden]],
  ['Bauch Isolation', 3, 6, 10, [MP.bauch]],
])

const split5: SplitOption = {
  daysPerWeek: 5,
  label: '5 Trainingstage',
  variants: [
    {
      id: '5-v1',
      name: 'Pull / Push / Beine / Oberkörper / Unterkörper',
      schedule: [
        d5v1Pull.id,
        d5v1Push.id,
        d5v1Beine.id,
        null,
        d5v1Ok.id,
        d5v1Uk.id,
        null,
      ],
      days: [d5v1Pull, d5v1Push, d5v1Beine, d5v1Ok, d5v1Uk],
    },
  ],
}

/* ---------------------------------- 6 Trainingstage ---------------------------------- */

const d6v1Beine1 = buildDay('d6v1-beine1', 'Beine 1', [
  ['Kniebeugevariation', 3, 6, 8, [MP.kniebeuge]],
  ['Beinbeuger Isolation', 3, 10, 15, [MP.beinbeuger]],
  ['Beinstrecker', 2, 6, 10, [MP.beinstrecker]],
  ['Waden Isolation', 3, 6, 10, [MP.waden]],
  ['Bauch Isolation', 3, 6, 10, [MP.bauch]],
])

const d6v1Push1 = buildDay('d6v1-push1', 'Push 1', [
  ['Horizontale Druckbewegung', 3, 6, 8, [MP.horizontalDruck]],
  ['Schräge Flyvariante', 2, 6, 10, [MP.flySchraeg]],
  ['Dips', 2, 6, 8, [MP.trizeps]],
  ['Seithebevariante', 3, 8, 12, [MP.seithebe]],
  ['Trizeps Isolation', 2, 8, 12, [MP.trizeps]],
])

const d6v1Pull1 = buildDay('d6v1-pull1', 'Pull 1', [
  ['Horizontale Zugbewegung breit', 3, 6, 10, [MP.horizontalZugBreit]],
  ['Vertikale Zugbewegung eng', 3, 8, 12, [MP.vertikalZugEng]],
  ['Horizontale Zugbewegung eng', 2, 12, 15, [MP.horizontalZugEng]],
  ['Vertikale Zugbewegung breit', 2, 12, 15, [MP.vertikalZugBreit]],
  ['Preacher Curls', 2, 6, 10, [MP.bizeps]],
  ['Hammer Curls', 2, 6, 10, [MP.bizeps]],
])

const d6v1Beine2 = buildDay('d6v1-beine2', 'Beine 2', [
  ['Kreuzhebevariante', 3, 5, 8, [MP.kreuzheben]],
  ['Beinpresse Variation', 2, 6, 10, [MP.beinpresse]],
  ['Beinbeuger Isolation', 2, 6, 10, [MP.beinbeuger]],
  ['Beinstrecker', 2, 6, 10, [MP.beinstrecker]],
  ['Waden Isolation', 3, 6, 10, [MP.waden]],
])

const d6v1Push2 = buildDay('d6v1-push2', 'Push 2', [
  ['Schrägbankvariante', 2, 6, 8, [MP.schraegbank]],
  ['Flyvariante', 2, 6, 10, [MP.fly]],
  ['Seithebevariante', 3, 8, 12, [MP.seithebe]],
  ['Trizeps Isolation', 3, 6, 10, [MP.trizeps]],
])

const d6v1Pull2 = buildDay('d6v1-pull2', 'Pull 2', [
  ['Vertikale Zugbewegung eng', 2, 6, 10, [MP.vertikalZugEng]],
  ['Horizontale Zugbewegung breit', 2, 6, 10, [MP.horizontalZugBreit]],
  ['Vertikale Zugbewegung breit', 2, 6, 10, [MP.vertikalZugBreit]],
  ['Hintere Schulter Isolation', 3, 8, 12, [MP.hintereSchulter]],
  ['Bizeps Isolation', 3, 6, 10, [MP.bizeps]],
])

const split6: SplitOption = {
  daysPerWeek: 6,
  label: '6 Trainingstage',
  variants: [
    {
      id: '6-v1',
      name: 'Beine / Push / Pull (2x)',
      schedule: [
        d6v1Beine1.id,
        d6v1Push1.id,
        d6v1Pull1.id,
        null,
        d6v1Beine2.id,
        d6v1Push2.id,
        d6v1Pull2.id,
      ],
      days: [d6v1Beine1, d6v1Push1, d6v1Pull1, d6v1Beine2, d6v1Push2, d6v1Pull2],
    },
  ],
}

export const splitOptions: SplitOption[] = [split2, split3, split4, split5, split6]

export function getSplitOption(daysPerWeek: number): SplitOption | undefined {
  return splitOptions.find((s) => s.daysPerWeek === daysPerWeek)
}
