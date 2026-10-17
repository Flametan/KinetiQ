interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Ersetzt native confirm()-Dialoge durch ein zum Design passendes Bestätigungs-Sheet. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  danger,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg text-ink">{title}</h2>
        <p className="mt-2 text-sm text-dim">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="press flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink hover:border-ink"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`press flex-1 rounded-full py-2.5 text-sm font-bold ${danger ? 'bg-brand-500 text-white' : 'bg-ink text-on-ink'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
