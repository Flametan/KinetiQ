import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Fängt Laufzeitfehler ab, damit die App nicht als leere weiße Seite endet. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('KinetiQ crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-brand-400">Fehler</p>
          <h1 className="font-display text-2xl uppercase text-ink">Etwas ist schiefgelaufen</h1>
          <p className="max-w-xs text-sm text-dim">
            Die App ist auf einen unerwarteten Fehler gestoßen. Deine Daten sind davon nicht betroffen.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="press bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wide text-on-ink"
          >
            Neu laden
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
