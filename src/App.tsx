import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import Layout from './components/Layout'
import OnboardingPage from './pages/OnboardingPage'
import PlanPage from './pages/PlanPage'
import TrainingPage from './pages/TrainingPage'
import WorkoutPage from './pages/WorkoutPage'
import SettingsPage from './pages/SettingsPage'
import IntervalPage from './pages/IntervalPage'

const ProgressPage = lazy(() => import('./pages/ProgressPage'))

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper">
      <div className="font-display text-2xl tracking-tight text-ink">
        Kineti<span className="text-brand-400">Q</span>
      </div>
      <div className="h-1 w-24 overflow-hidden bg-line">
        <div className="h-full w-1/2 animate-pulse bg-brand-500" />
      </div>
    </div>
  )
}

function Home() {
  const activePlan = useAppStore((s) => s.activePlan)
  return <Navigate to={activePlan ? '/plan' : '/onboarding'} replace />
}

export default function App() {
  const loading = useAppStore((s) => s.loading)
  const init = useAppStore((s) => s.init)
  const theme = useAppStore((s) => s.settings.theme)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
    const prefersDark =
      theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', prefersDark ? '#141316' : '#fafaf8')
  }, [theme])

  if (loading) return <Splash />

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/training/:dayId" element={<WorkoutPage />} />
          <Route path="/interval" element={<IntervalPage />} />
          <Route
            path="/progress"
            element={
              <Suspense fallback={<div className="pt-10 text-center text-sm text-dim">Lädt…</div>}>
                <ProgressPage />
              </Suspense>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
