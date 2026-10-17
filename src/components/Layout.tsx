import type { ReactNode } from 'react'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper pt-[env(safe-area-inset-top)] lg:flex lg:pt-0">
      <Sidebar />
      <div className="mx-auto min-h-dvh w-full max-w-md bg-paper pb-24 lg:max-w-none lg:flex-1 lg:pb-0">
        <main className="px-4 pt-6 lg:mx-auto lg:max-w-2xl lg:px-10 lg:py-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
