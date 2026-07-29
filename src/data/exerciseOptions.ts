import type { ExerciseOption } from '../types'
import { MP } from './movementPatterns'

let n = 0
const id = () => `ex-${++n}`

function group(movementPatternId: string, names: string[]): ExerciseOption[] {
  return names.map((name) => ({ id: id(), name, movementPatternId }))
}

/**
 * Übungsauswahl je Bewegungsmuster – Quelle: "Übungsauswahl"-Seiten aus dem PDF.
 * Bei Beinstrecker/Adduktoren/Bauch Isolation listet das PDF keine separaten
 * Varianten auf (dort ist das Bewegungsmuster praktisch die Maschine selbst);
 * hier um gängige Alternativen ergänzt, damit auch dort eine echte Auswahl besteht.
 */
export const exerciseOptions: ExerciseOption[] = [
  ...group(MP.horizontalDruck, [
    'Bankdrücken Langhantel',
    'Bankdrücken Kurzhantel',
    'Multipresse Bankdrücken',
    'Brustpresse Maschine',
    'Cable Press',
  ]),
  ...group(MP.vertikalDruck, [
    'Schulterdrücken Kurzhantel',
    'Schulterdrücken Langhantel',
    'Schulterdrücken Maschine',
  ]),
  ...group(MP.vertikalZugEng, [
    'Chin Ups',
    'Latziehen eng',
    'Latzugmaschine eng',
    'High Row mit engem Griff',
  ]),
  ...group(MP.vertikalZugBreit, ['Latziehen breit', 'Latzugmaschine breit', 'Klimmzüge breit']),
  ...group(MP.horizontalZugEng, [
    'Rudern eng am Kabelzug',
    'Rudern eng Kurzhantel',
    'Rudern eng Langhantel',
    'Brustgestützte Rudermaschine eng',
  ]),
  ...group(MP.horizontalZugBreit, [
    'Rudern breit am Kabelzug',
    'Rudern breit Kurzhantel',
    'Rudern breit Langhantel',
    'Brustgestützte Rudermaschine breit',
    'T-Bar Rudern',
  ]),
  ...group(MP.seithebe, ['Seitheben Kurzhantel', 'Seitheben am Kabelzug', 'Seitheben Maschine']),
  ...group(MP.schraegbank, [
    'Schrägbankdrücken Langhantel',
    'Schrägbankdrücken Kurzhantel',
    'Schrägbankdrücken Maschine',
  ]),
  ...group(MP.fly, ['Fly am Kabelzug', 'Butterfly Maschine', 'Fly mit Kurzhanteln']),
  ...group(MP.flySchraeg, ['Schrägzug am Kabelzug', 'Schrägzug mit Kurzhanteln']),
  ...group(MP.hintereSchulter, [
    'Rear Delt Row',
    'Butterfly Reverse am Kabelzug',
    'Butterfly Reverse Maschine',
  ]),
  ...group(MP.bizeps, [
    'Preacher Curls Maschine',
    'Preacher Curls Kurzhantel',
    'Kurzhantelcurls stehend',
    'Kurzhantelcurls sitzend',
    'Curls am Kabelzug',
    'Hammer Curls',
  ]),
  ...group(MP.trizeps, [
    'Trizepsdrücken Überkopf am Kabel',
    'Trizepsdrücken Überkopf Kurzhantel',
    'Trizepspushdowns am Seil',
    'Katana Extensions',
    'French Press',
    'Skull Crusher',
    'Dips',
  ]),
  ...group(MP.kniebeuge, [
    'Kniebeuge frei',
    'Kniebeuge Multipresse',
    'Hack Squat',
    'Pendulum Squat Maschine',
    'Split Squat',
  ]),
  ...group(MP.kreuzheben, [
    'Rumänisches Kreuzheben',
    'Stiff Leg Deadlift',
    'Konventionelles Kreuzheben',
  ]),
  ...group(MP.beinpresse, [
    'Liegende Beinpresse',
    'Sitzende Beinpresse',
    '45-Grad-Beinpresse',
    'Einbeinige Beinpresse',
  ]),
  ...group(MP.hueftstreck, ['Hyperextensions', 'Good Mornings', 'Hip Thrusts']),
  ...group(MP.beinbeuger, ['Beinbeuger sitzend', 'Beinbeuger liegend']),
  ...group(MP.beinstrecker, ['Beinstrecker Maschine', 'Einbeinige Beinstrecker']),
  ...group(MP.waden, ['Wadenheben stehend', 'Wadenheben sitzend']),
  ...group(MP.adduktoren, ['Adduktorenmaschine', 'Adduktion am Kabelzug']),
  ...group(MP.bauch, ['Cable Crunches', 'Crunches', 'Sit-ups', 'Beinheben hängend', 'Ab Wheel Rollout']),
]

export const exerciseOptionsByPattern = exerciseOptions.reduce<Record<string, ExerciseOption[]>>(
  (acc, ex) => {
    ;(acc[ex.movementPatternId] ??= []).push(ex)
    return acc
  },
  {},
)
