# [KinetiQ](https://flametan.github.io/KinetiQ/)

Eine Fitness-App, die individuelle Trainingspläne auf Basis eines bewährten
Bewegungsmuster-Systems erstellt und deinen kompletten Trainingsfortschritt
lokal auf dem Gerät trackt.

🔗 **Live:** [flametan.github.io/KinetiQ](https://flametan.github.io/KinetiQ/) –
im Handy-Browser öffnen und per "Zum Startbildschirm hinzufügen" installieren.

---

## Features

- **Plan-Generator**: Wähle 2–6 Trainingstage/Woche, KinetiQ schlägt passende
  Splits vor (Ganzkörper, Oberkörper/Unterkörper, Push/Pull, Torso/Limbs …),
  jeweils basierend auf Bewegungsmustern (z. B. "Horizontale Druckbewegung")
  mit Satz-/Wiederholungsvorgaben.
- **Übungsauswahl**: Jedes Bewegungsmuster hat mehrere vorgeschlagene
  Übungen mit Fotos, durchsuchbar und nach Equipment filterbar, frei
  tauschbar – zusätzlich lassen sich jederzeit eigene Übungen anlegen.
- **Workout-Logging**: Pro Übung werden Sätze mit Wiederholungen und Gewicht
  erfasst, vorbelegt mit den Werten der letzten Session inkl. progressiver
  Gewichtsvorschläge. Dazu persistente Übungs- und Session-Notizen,
  Plattenrechner und frei einstellbare Reihenfolge/Supersätze pro Tag.
- **Deload-Wochen**: Erholungswochen in frei wählbarem Intervall, mit
  automatisch reduzierten Gewichtsvorschlägen.
- **Zirkel/EMOM-Timer**: Eigenständiger Intervall-Trainingsmodus,
  unabhängig vom Trainingsplan.
- **Fortschritt**: Charts je Übung (Gewicht/geschätztes 1RM), komplette
  Trainingshistorie, Kalender-Heatmap, Muskelgruppen-Balance,
  Körpergewichtsverlauf.
- **Mehrere Pläne**: Pläne parallel anlegen und wechseln, archivierte Pläne
  bleiben erhalten.
- **kg/lb, Hell/Dunkel**: Umschaltbare Gewichtseinheit und Darstellung
  (System/Hell/Dunkel).
- **Lokale Trainingserinnerung**: Hinweis, wenn laut Plan heute ein
  Trainingstag ansteht und noch nicht trainiert wurde (nur bei geöffneter
  App – kein Server, keine Push-Benachrichtigung).
- **Daten-Export/Import**: Backup als JSON, geräteübergreifend übertragbar.
- **Lokal & offline**: Alle Daten werden in IndexedDB auf dem Gerät
  gespeichert (Dexie.js) – kein Login, kein Server, keine Accounts. Jede
  Person, die sich die App installiert, hat automatisch ihre eigenen,
  getrennten Daten auf ihrem Gerät. Die Datenzugriffe laufen über eine
  `DataRepository`-Abstraktion (`src/db/repository.ts`).
- **PWA**: installierbar auf dem Homescreen, funktioniert offline
  (Service Worker via `vite-plugin-pwa`), live gehostet auf GitHub Pages.
- **Android-App**: Capacitor-Projekt für eine native APK ist mit dabei
  (`android/`), wird bei jedem Push automatisch als GitHub-Release-Artifact
  gebaut.

## Tech-Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · Dexie (IndexedDB)
· React Router · Recharts · vite-plugin-pwa · Capacitor

## Entwicklung

```bash
npm install
npm run dev
```

```bash
npm run build      # Typecheck + Produktionsbuild nach dist/
npm run preview    # Produktionsbuild lokal ansehen
npm run lint
```

## Deployment

**GitHub Pages:** Jeder Push auf den Entwicklungs-Branch baut die App
automatisch (`.github/workflows/gh-pages.yml`) und veröffentlicht sie unter
[flametan.github.io/KinetiQ](https://flametan.github.io/KinetiQ/). Da die
App dort unter einem Repo-Unterpfad statt im Domain-Root läuft, wird der
Build mit `VITE_BASE_PATH=/KinetiQ/` ausgeführt (Default ohne die Variable:
`/`, für den Capacitor-/lokalen Build).

**Android-APK:** Wird ebenfalls bei jedem Push automatisch gebaut
(`.github/workflows/android-apk.yml`) und als GitHub-Release unter dem Tag
`android-apk-latest` veröffentlicht.

### Android-APK lokal bauen

Das native Android-Projekt liegt fertig eingerichtet unter `android/`
(App-ID `de.kinetiq.app`). Zum Bauen wird lokal das Android SDK
(Android Studio oder Command-Line-Tools, `compileSdk 36`) benötigt:

```bash
npm run android:build     # baut dist/, synced nach android/, erzeugt Debug-APK
# APK liegt danach unter android/app/build/outputs/apk/debug/app-debug.apk
```

Alternativ in Android Studio öffnen:

```bash
npm run android:open
```

Nach Code-Änderungen einfach `npm run cap:sync` ausführen, um den aktuellen
Web-Build ins native Projekt zu übernehmen.

## Datenmodell & Struktur

- `src/data/` – Bewegungsmuster, Übungsauswahl, Split-Templates und
  Übungsbild-Zuordnung (Quelle: `free-exercise-db`, Unlicense)
- `src/types.ts` – Domain-Typen
- `src/lib/planBuilder.ts` – erzeugt aus einem Split-Template einen
  bearbeitbaren Nutzerplan
- `src/lib/history.ts` – Auswertung des Trainingsverlaufs für Vorbelegung &
  Fortschritts-Charts
- `src/lib/schedule.ts` – Wochenzyklus, Deload-Logik
- `src/db/` – Dexie-Schema + Repository-Abstraktion
- `src/store/useAppStore.ts` – zentraler App-State (Zustand)
- `src/pages/` – Onboarding, Plan, Training/Workout, Fortschritt,
  Einstellungen, Intervall-Timer

### Bekannte Lücke in den Trainingsplan-Daten

Aus den Screenshots des PDFs fehlen die vollständigen Übungslisten für
**"4 Trainingstage – Variante 3 (Torso/Limbs)"** und
**"5 Trainingstage – Variante 2 (Brust/Rücken …)"** – dort waren nur die
Split-Tabellen, aber nicht die Satz-/Wiederholungs-Details sichtbar. Diese
zwei Varianten fehlen daher aktuell im Plan-Generator. Mit den vollständigen
Seiten lassen sie sich in `src/data/splitTemplates.ts` leicht ergänzen.
