import { useCallback, useRef, useState } from 'react'

interface Props {
  hue: number
  onChange: (hue: number) => void
}

/** Kreisförmiger Farbton-Wähler ("Farbrad") – entlang des Rings ziehen wählt den Hue (0-360°). */
export default function ColorWheel({ hue, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const angle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI
      onChange(Math.round((angle + 360) % 360))
    },
    [onChange],
  )

  function handlePointerDown(e: React.PointerEvent) {
    setDragging(true)
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    updateFromPoint(e.clientX, e.clientY)
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    updateFromPoint(e.clientX, e.clientY)
  }
  function handlePointerUp() {
    setDragging(false)
  }

  const rad = (hue * Math.PI) / 180
  const knobLeft = 50 + 42 * Math.cos(rad)
  const knobTop = 50 + 42 * Math.sin(rad)

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative mx-auto h-44 w-44 shrink-0 touch-none select-none rounded-full shadow-inner"
      style={{
        background:
          'conic-gradient(from 0deg, hsl(0 80% 55%), hsl(60 80% 55%), hsl(120 80% 55%), hsl(180 80% 55%), hsl(240 80% 55%), hsl(300 80% 55%), hsl(360 80% 55%))',
      }}
    >
      <div
        className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-lg"
        style={{ left: `${knobLeft}%`, top: `${knobTop}%`, background: `hsl(${hue} 80% 55%)` }}
      />
    </div>
  )
}
