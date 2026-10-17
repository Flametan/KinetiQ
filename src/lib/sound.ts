/** Kurzer Signalton fürs Pausentimer-Ende, ohne externe Audio-Datei (Web Audio API). */
export function playRestEndSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.start()
    osc.stop(ctx.currentTime + 0.45)
    osc.onended = () => ctx.close()
  } catch {
    // Web Audio nicht verfügbar – einfach kein Ton.
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(200)
  }
}
