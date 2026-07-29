# KinetiQ

Eine Fitness-App, die individuelle Trainingspläne auf Basis eines bewährten
Bewegungsmuster-Systems erstellt und deinen kompletten Trainingsfortschritt
lokal auf dem Gerät trackt.

## Features

- **Plan-Generator**: Wähle 2–6 Trainingstage/Woche, KinetiQ schlägt passende
  Splits vor (Ganzkörper, Oberkörper/Unterkörper, Push/Pull, Torso/Limbs …),
  jeweils basierend auf Bewegungsmustern (z. B. "Horizontale Druckbewegung")
  mit Satz-/Wiederholungsvorgaben.
- **Übungsauswahl**: Jedes Bewegungsmuster hat mehrere vorgeschlagene
  Übungen (z. B. Bankdrücken, Kurzhantel- oder Maschinenvarianten), die frei
  getauscht werden können – zusätzlich lassen sich jederzeit eigene Übungen
  anlegen.
- **Workout-Logging**: Pro Übung werden Sätze mit manuell einstellbaren
  Wiederholungen und Gewicht erfasst, vorbelegt mit den Werten der letzten
  Session (progressive Overload).
- **Fortschritt**: Verlauf & Chart (Maximalgewicht pro Training) je Übung,
  komplette Trainingshistorie.
- **Lokal & offline**: Alle Daten werden in IndexedDB auf dem Gerät
  gespeichert (Dexie.js) – kein Login nötig. Die Datenzugriffe laufen über
  eine `DataRepository`-Abstraktion (`src/db/repository.ts`), damit später
  ein Backend/Sync ergänzt werden kann, ohne UI-Code anzufassen.
- **PWA**: installierbar auf dem Homescreen, funktioniert offline
  (Service Worker via `vite-plugin-pwa`).
- **Android-App**: Capacitor-Projekt für eine native APK ist mit dabei
  (`android/`).

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

## Android-APK bauen

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

- `src/data/` – Bewegungsmuster, Übungsauswahl und alle Split-Templates
  (Quelle: Trainingsplan-PDF)
- `src/types.ts` – Domain-Typen
- `src/lib/planBuilder.ts` – erzeugt aus einem Split-Template einen
  bearbeitbaren Nutzerplan
- `src/lib/history.ts` – Auswertung des Trainingsverlaufs für Vorbelegung &
  Fortschritts-Charts
- `src/db/` – Dexie-Schema + Repository-Abstraktion
- `src/store/useAppStore.ts` – zentraler App-State (Zustand)
- `src/pages/` – Onboarding, Plan, Training/Workout, Fortschritt, Einstellungen

### Bekannte Lücke in den Trainingsplan-Daten

Aus den Screenshots des PDFs fehlen die vollständigen Übungslisten für
**"4 Trainingstage – Variante 3 (Torso/Limbs)"** und
**"5 Trainingstage – Variante 2 (Brust/Rücken …)"** – dort waren nur die
Split-Tabellen, aber nicht die Satz-/Wiederholungs-Details sichtbar. Diese
zwei Varianten fehlen daher aktuell im Plan-Generator. Mit den vollständigen
Seiten lassen sie sich in `src/data/splitTemplates.ts` leicht ergänzen.
