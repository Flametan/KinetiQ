import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper pt-[env(safe-area-inset-top)]">
      <div className="mx-auto min-h-dvh max-w-md bg-paper pb-24">
        <main className="px-4 pt-6">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
