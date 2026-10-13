import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { movementPatternById } from '../data/movementPatterns'
import { db } from '../db/db'
import type { DataExport } from '../types'

export default function SettingsPage() {
  const customExercises = useAppStore((s) => s.customExercises)
  const removeCustomExercise = useAppStore((s) => s.removeCustomExercise)
  const plan = useAppStore((s) => s.activePlan)
  const init = useAppStore((s) => s.init)
  const exportAll = useAppStore((s) => s.exportAll)
  const importAll = useAppStore((s) => s.importAll)
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  async function resetAll() {
    if (!confirm('Wirklich ALLE Daten löschen? Plan, eigene Übungen und dein kompletter Trainingsverlauf gehen unwiderruflich verloren.')) {
      return
    }
    await db.delete()
    await db.open()
    await init()
    navigate('/onboarding')
  }

  async function handleExport() {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `kinetiq-export-${date}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    setImportError(null)
    setImportSuccess(false)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as DataExport
      if (!data || typeof data !== 'object' || !Array.isArray(data.sessions)) {
        throw new Error('Datei hat kein gültiges KinetiQ-Export-Format.')
      }
      if (
        !confirm(
          'Import ersetzt ALLE aktuellen Daten auf diesem Gerät durch den Inhalt der Datei. Fortfahren?',
        )
      ) {
        return
      }
      await importAll(data)
      setImportSuccess(true)
      navigate('/plan')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import fehlgeschlagen.')
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="pt-2">
        <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">Einstellungen</p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-[0.95] text-ink">Mehr</h1>
      </header>

      {plan && (
        <section className="border border-line bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-dim">Aktueller Plan</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {plan.splitLabel} · {plan.variantName}
          </p>
        </section>
      )}

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-dim">
          Eigene Übungen ({customExercises.length})
        </p>
        {customExercises.length === 0 ? (
          <p className="border border-line bg-white p-4 text-sm text-dim">
            Du hast noch keine eigenen Übungen angelegt. Das geht direkt bei der Übungsauswahl im Plan.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {customExercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between border border-line bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{ex.name}</p>
                  <p className="text-xs text-dim">{movementPatternById.get(ex.movementPatternId)?.name}</p>
                </div>
                <button
                  onClick={() => removeCustomExercise(ex.id)}
                  className="rounded-full p-2 text-dim hover:bg-panel2 hover:text-brand-400"
                  aria-label="Löschen"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-line bg-white p-4">
        <p className="text-sm font-semibold text-ink">Daten sichern</p>
        <p className="mt-1 text-xs text-dim">
          Alle Daten liegen nur lokal auf diesem Gerät. Exportiere regelmäßig ein Backup oder übertrage
          deine Daten auf ein neues Gerät per Export/Import.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 border border-line py-2.5 text-sm font-semibold text-ink hover:border-ink"
          >
            Exportieren
          </button>
          <button
            onClick={handleImportClick}
            className="flex-1 border border-line py-2.5 text-sm font-semibold text-ink hover:border-ink"
          >
            Importieren
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
        {importError && <p className="mt-2 text-xs text-brand-400">{importError}</p>}
        {importSuccess && <p className="mt-2 text-xs text-brand-400">Import erfolgreich.</p>}
      </section>

      <section className="border-2 border-ink bg-white p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-ink">Gefahrenzone</p>
        <p className="mt-1 text-xs text-dim">
          Löscht Plan, eigene Übungen und den gesamten Trainingsverlauf von diesem Gerät.
        </p>
        <button
          onClick={resetAll}
          className="mt-3 w-full border border-ink bg-ink py-2.5 text-sm font-bold text-white hover:bg-brand-500"
        >
          Alle Daten zurücksetzen
        </button>
      </section>

      <p className="text-center text-xs text-dim">
        KinetiQ · Daten werden lokal auf diesem Gerät gespeichert
      </p>
    </div>
  )
}
