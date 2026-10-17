import { useRef, useState } from 'react'

interface Pending<T> {
  item: T
  timeoutId: ReturnType<typeof setTimeout>
}

/**
 * Löscht sofort optisch (Item sollte via isPending() aus der gerenderten Liste
 * gefiltert werden), führt die eigentliche Löschung aber erst nach `delayMs`
 * aus – ruft man in der Zwischenzeit undo() auf, passiert nichts.
 */
export function useUndoableDelete<T extends { id: string }>(
  deleteFn: (item: T) => void | Promise<void>,
  delayMs = 4000,
) {
  const [pending, setPending] = useState<T | null>(null)
  const pendingRef = useRef<Pending<T> | null>(null)

  function triggerDelete(item: T) {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timeoutId)
      deleteFn(pendingRef.current.item)
    }
    const timeoutId = setTimeout(() => {
      deleteFn(item)
      pendingRef.current = null
      setPending(null)
    }, delayMs)
    pendingRef.current = { item, timeoutId }
    setPending(item)
  }

  function undo() {
    if (!pendingRef.current) return
    clearTimeout(pendingRef.current.timeoutId)
    pendingRef.current = null
    setPending(null)
  }

  function isPending(id: string) {
    return pending?.id === id
  }

  return { pending, isPending, triggerDelete, undo }
}
