import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { playRestEndSound } from '../lib/sound'

type Mode = 'circuit' | 'emom'

interface Segment {
  label: string
  seconds: number
  kind: 'work' | 'rest'
}

function buildCircuitSegments(stations: string[], rounds: number, workSeconds: number, restSeconds: number): Segment[] {
  const segments: Segment[] = []
  for (let round = 1; round <= rounds; round++) {
    stations.forEach((station, i) => {
      segments.push({ label: `${station} · Runde ${round}/${rounds}`, seconds: workSeconds, kind: 'work' })
      const isLastOfAll = round === rounds && i === stations.length - 1
      if (!isLastOfAll) segments.push({ label: 'Pause', seconds: restSeconds, kind: 'rest' })
    })
  }
  return segments
}

function buildEmomSegments(stations: string[], totalRounds: number, intervalSeconds: number): Segment[] {
  const segments: Segment[] = []
  for (let round = 1; round <= totalRounds; round++) {
    const station = stations[(round - 1) % stations.length] ?? 'Übung'
    segments.push({ label: `${station} · Minute ${round}/${totalRounds}`, seconds: intervalSeconds, kind: 'work' })
  }
  return segments
}

export default function IntervalPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('circuit')
  const [stationInput, setStationInput] = useState('')
  const [stations, setStations] = useState<string[]>([])
  const [rounds, setRounds] = useState(3)
  const [workSeconds, setWorkSeconds] = useState(40)
  const [restSeconds, setRestSeconds] = useState(20)
  const [emomRounds, setEmomRounds] = useState(10)
  const [emomInterval, setEmomInterval] = useState(60)

  const [running, setRunning] = useState(false)
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)

  const segments = useMemo(() => {
    if (stations.length === 0) return []
    return mode === 'circuit'
      ? buildCircuitSegments(stations, rounds, workSeconds, restSeconds)
      : buildEmomSegments(stations, emomRounds, emomInterval)
  }, [mode, stations, rounds, workSeconds, restSeconds, emomRounds, emomInterval])

  useEffect(() => {
    if (!running || paused || done) return
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1
        playRestEndSound()
        setSegmentIndex((idx) => {
          const next = idx + 1
          if (next >= segments.length) {
            setDone(true)
            setRunning(false)
            return idx
          }
          setRemaining(segments[next].seconds)
          return next
        })
        return r
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [running, paused, done, segments])

  function addStation() {
    const name = stationInput.trim()
    if (!name) return
    setStations((s) => [...s, name])
    setStationInput('')
  }

  function removeStation(i: number) {
    setStations((s) => s.filter((_, idx) => idx !== i))
  }

  function start() {
    if (segments.length === 0) return
    setSegmentIndex(0)
    setRemaining(segments[0].seconds)
    setDone(false)
    setRunning(true)
    setPaused(false)
  }

  function stop() {
    setRunning(false)
    setDone(false)
    setPaused(false)
  }

  if (running || done) {
    const current = segments[segmentIndex]
    return (
      <div className="-mx-4 -mt-6 flex min-h-[calc(100dvh-5.5rem)] flex-col items-center justify-center gap-6 px-4 text-center">
        {done ? (
          <>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-brand-400">Fertig</p>
            <h1 className="font-display text-3xl uppercase text-ink">Intervall-Training beendet</h1>
            <button onClick={stop} className="mt-4 bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wide text-on-ink">
              Zurück
            </button>
          </>
        ) : (
          <>
            <p className={`text-xs font-bold uppercase tracking-[.14em] ${current.kind === 'rest' ? 'text-dim' : 'text-brand-400'}`}>
              {current.kind === 'rest' ? 'Pause' : 'Aktiv'}
            </p>
            <h1 className="font-display text-2xl uppercase text-ink">{current.label}</h1>
            <p className="font-display text-7xl text-ink">{remaining}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPaused((p) => !p)}
                className="border border-ink px-5 py-2.5 text-sm font-bold text-ink hover:bg-panel2"
              >
                {paused ? 'Weiter' : 'Pause'}
              </button>
              <button onClick={stop} className="border border-line px-5 py-2.5 text-sm font-bold text-dim hover:text-ink">
                Abbrechen
              </button>
            </div>
            <p className="text-xs text-dim">
              Segment {segmentIndex + 1} / {segments.length}
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="pt-2">
        <p className="text-xs font-bold uppercase tracking-[.1em] text-brand-400">Alternatives Format</p>
        <h1 className="font-display mt-1 text-[26px] uppercase leading-[0.95] text-ink">Zirkel / EMOM</h1>
        <p className="mt-2 text-sm text-dim">
          Eigenständiger Intervall-Timer, unabhängig vom Trainingsplan – wird nicht im Trainingsverlauf
          gespeichert.
        </p>
      </header>

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-dim">Format</p>
        <div className="flex border border-line">
          <button
            onClick={() => setMode('circuit')}
            className={`flex-1 border-r border-line py-2.5 text-sm font-semibold ${mode === 'circuit' ? 'bg-ink text-on-ink' : 'text-ink hover:bg-panel2'}`}
          >
            Zirkel
          </button>
          <button
            onClick={() => setMode('emom')}
            className={`flex-1 py-2.5 text-sm font-semibold ${mode === 'emom' ? 'bg-ink text-on-ink' : 'text-ink hover:bg-panel2'}`}
          >
            EMOM
          </button>
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-dim">Übungen / Stationen</p>
        <div className="flex gap-2">
          <input
            value={stationInput}
            onChange={(e) => setStationInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addStation()}
            placeholder="z.B. Burpees"
            className="flex-1 border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-dim focus:border-ink focus:outline-none"
          />
          <button onClick={addStation} className="bg-ink px-4 text-sm font-bold text-on-ink">
            +
          </button>
        </div>
        {stations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stations.map((s, i) => (
              <span key={i} className="flex items-center gap-1.5 border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink">
                {s}
                <button onClick={() => removeStation(i)} className="text-dim hover:text-brand-400" aria-label="Entfernen">
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {mode === 'circuit' ? (
        <section className="grid grid-cols-3 gap-3">
          <NumberField label="Runden" value={rounds} onChange={setRounds} />
          <NumberField label="Arbeit (s)" value={workSeconds} onChange={setWorkSeconds} />
          <NumberField label="Pause (s)" value={restSeconds} onChange={setRestSeconds} />
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3">
          <NumberField label="Runden" value={emomRounds} onChange={setEmomRounds} />
          <NumberField label="Intervall (s)" value={emomInterval} onChange={setEmomInterval} />
        </section>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 border border-line py-3 text-sm font-semibold text-dim hover:border-ink hover:text-ink"
        >
          Zurück
        </button>
        <button
          onClick={start}
          disabled={stations.length === 0}
          className="flex-1 bg-ink py-3 text-sm font-bold uppercase tracking-wide text-on-ink disabled:opacity-40"
        >
          Starten
        </button>
      </div>
    </div>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-dim">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
        className="border border-line bg-surface px-2 py-2 text-center text-sm font-bold text-ink focus:border-ink focus:outline-none"
      />
    </label>
  )
}
