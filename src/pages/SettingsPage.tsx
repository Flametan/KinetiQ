import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { movementPatternById } from '../data/movementPatterns'
import { db } from '../db/db'
import ConfirmDialog from '../components/ConfirmDialog'
import Snackbar from '../components/Snackbar'
import { useUndoableDelete } from '../hooks/useUndoableDelete'
import type { CustomExercise, DataExport, ThemePreference, WeightUnit } from '../types'

export default function SettingsPage() {
  const customExercises = useAppStore((s) => s.customExercises)
  const removeCustomExercise = useAppStore((s) => s.removeCustomExercise)
  const plan = useAppStore((s) => s.activePlan)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const init = useAppStore((s) => s.init)
  const exportAll = useAppStore((s) => s.exportAll)
  const importAll = useAppStore((s) => s.importAll)
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [notifyError, setNotifyError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<DataExport | null>(null)
  const exerciseDelete = useUndoableDelete<CustomExercise>((ex) => removeCustomExercise(ex.id))

  async function resetAll() {
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
      setPendingImport(data)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import fehlgeschlagen.')
    }
  }

  async function confirmImport() {
    if (!pendingImport) return
    await importAll(pendingImport)
    setPendingImport(null)
    setImportSuccess(true)
    navigate('/plan')
  }

  async function toggleReminders(enabled: boolean) {
    setNotifyError(null)
    if (enabled) {
      if (typeof Notification === 'undefined') {
        setNotifyError('Benachrichtigungen werden auf diesem Gerät nicht unterstützt.')
        return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setNotifyError('Benachrichtigungen wurden nicht erlaubt. Du kannst das in den Browser-/App-Einstellungen ändern.')
        return
      }
    }
    await updateSettings({ remindersEnabled: enabled })
  }

  const visibleCustomExercises = customExercises.filter((ex) => !exerciseDelete.isPending(ex.id))

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="pt-2">
        <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">Einstellungen</p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-[0.95] text-ink">Mehr</h1>
      </header>

      {plan && (
        <section className="border border-line bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-dim">Aktueller Plan</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {plan.splitLabel} · {plan.variantName}
          </p>
        </section>
      )}

      <section className="border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-semibold text-ink">Einheiten & Darstellung</p>

        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-dim">Gewichtseinheit</p>
        <SegmentedControl
          value={settings.weightUnit}
          options={[
            { value: 'kg', label: 'Kilogramm (kg)' },
            { value: 'lb', label: 'Pfund (lb)' },
          ]}
          onChange={(weightUnit) => updateSettings({ weightUnit: weightUnit as WeightUnit })}
        />

        <p className="mt-4 mb-1.5 text-xs font-bold uppercase tracking-wide text-dim">Darstellung</p>
        <SegmentedControl
          value={settings.theme}
          options={[
            { value: 'light', label: 'Hell' },
            { value: 'dark', label: 'Dunkel' },
            { value: 'system', label: 'System' },
          ]}
          onChange={(theme) => updateSettings({ theme: theme as ThemePreference })}
        />
      </section>

      <section className="border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Deload-Wochen</p>
            <p className="mt-1 text-xs text-dim">
              Jede {settings.deloadIntervalWeeks}. Woche automatisch als Erholungswoche markieren,
              Gewichtsvorschläge dann ~10% reduziert.
            </p>
          </div>
          <ToggleSwitch checked={settings.deloadEnabled} onChange={(v) => updateSettings({ deloadEnabled: v })} />
        </div>
        {settings.deloadEnabled && (
          <div className="mt-3 flex gap-2">
            {[3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => updateSettings({ deloadIntervalWeeks: n })}
                className={`flex-1 border py-2 text-sm font-semibold ${
                  settings.deloadIntervalWeeks === n ? 'border-ink bg-ink text-on-ink' : 'border-line text-ink hover:border-ink'
                }`}
              >
                {n} Wo.
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Trainingserinnerung</p>
            <p className="mt-1 text-xs text-dim">
              Zeigt einen Hinweis, wenn heute laut Plan ein Trainingstag ansteht und noch nicht trainiert
              wurde. Funktioniert nur, während die App geöffnet ist – echte Push-Benachrichtigungen bei
              geschlossener App erfordern einen Server und sind bewusst nicht Teil dieser lokalen App.
            </p>
          </div>
          <ToggleSwitch checked={settings.remindersEnabled} onChange={toggleReminders} />
        </div>
        {notifyError && <p className="mt-2 text-xs text-brand-400">{notifyError}</p>}
      </section>

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-dim">
          Eigene Übungen ({visibleCustomExercises.length})
        </p>
        {visibleCustomExercises.length === 0 ? (
          <p className="border border-line bg-surface p-4 text-sm text-dim">
            Du hast noch keine eigenen Übungen angelegt. Das geht direkt bei der Übungsauswahl im Plan.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleCustomExercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between border border-line bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{ex.name}</p>
                  <p className="text-xs text-dim">{movementPatternById.get(ex.movementPatternId)?.name}</p>
                </div>
                <button
                  onClick={() => exerciseDelete.triggerDelete(ex)}
                  className="icon-btn press text-dim hover:bg-panel2 hover:text-brand-400"
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

      <section className="border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-ink">Daten sichern</p>
        <p className="mt-1 text-xs text-dim">
          Alle Daten liegen nur lokal auf diesem Gerät. Exportiere regelmäßig ein Backup oder übertrage
          deine Daten auf ein neues Gerät per Export/Import.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink hover:border-ink"
          >
            Exportieren
          </button>
          <button
            onClick={handleImportClick}
            className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink hover:border-ink"
          >
            Importieren
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
        {importError && <p className="mt-2 text-xs text-brand-400">{importError}</p>}
        {importSuccess && <p className="mt-2 text-xs text-brand-400">Import erfolgreich.</p>}
      </section>

      <section className="border-2 border-ink bg-surface p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-ink">Gefahrenzone</p>
        <p className="mt-1 text-xs text-dim">
          Löscht Plan, eigene Übungen und den gesamten Trainingsverlauf von diesem Gerät.
        </p>
        <button
          onClick={() => setConfirmReset(true)}
          className="press mt-3 w-full rounded-full border border-ink bg-ink py-2.5 text-sm font-bold text-on-ink hover:bg-brand-500 hover:text-white"
        >
          Alle Daten zurücksetzen
        </button>
      </section>

      <p className="text-center text-xs text-dim">
        KinetiQ · Daten werden lokal auf diesem Gerät gespeichert
      </p>

      <ConfirmDialog
        open={confirmReset}
        title="Wirklich alle Daten löschen?"
        message="Plan, eigene Übungen und dein kompletter Trainingsverlauf gehen unwiderruflich verloren."
        confirmLabel="Löschen"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          resetAll()
        }}
      />

      <ConfirmDialog
        open={!!pendingImport}
        title="Daten importieren?"
        message="Import ersetzt ALLE aktuellen Daten auf diesem Gerät durch den Inhalt der Datei."
        confirmLabel="Importieren"
        danger
        onCancel={() => setPendingImport(null)}
        onConfirm={confirmImport}
      />

      {exerciseDelete.pending && (
        <Snackbar
          message={`"${exerciseDelete.pending.name}" gelöscht`}
          actionLabel="Rückgängig"
          onAction={exerciseDelete.undo}
        />
      )}
    </div>
  )
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-full border border-line">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 border-r border-line py-2 text-xs font-semibold last:border-r-0 ${
            value === opt.value ? 'bg-ink text-on-ink' : 'bg-surface text-ink hover:bg-panel2'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`press relative h-6 w-11 shrink-0 border transition-colors ${checked ? 'border-ink bg-ink' : 'border-line bg-surface'}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface transition-transform ${checked ? 'translate-x-[22px] bg-paper' : 'translate-x-0.5 bg-ink'}`}
      />
    </button>
  )
}
