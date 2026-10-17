interface Props {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function Snackbar({ message, actionLabel, onAction }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
      <div className="flex w-full max-w-sm items-center justify-between gap-3 border border-ink bg-ink px-4 py-3 text-on-ink shadow-2xl">
        <span className="text-sm font-medium">{message}</span>
        {actionLabel && onAction && (
          <button onClick={onAction} className="press shrink-0 text-sm font-bold text-brand-400">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
