import { NavLink } from 'react-router-dom'
import { ChartIcon, ClipboardIcon, DumbbellIcon, GearIcon } from './NavIcons'

const items = [
  { to: '/plan', label: 'Plan', icon: ClipboardIcon },
  { to: '/training', label: 'Training', icon: DumbbellIcon },
  { to: '/progress', label: 'Fortschritt', icon: ChartIcon },
  { to: '/settings', label: 'Mehr', icon: GearIcon },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `press flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
                isActive ? 'text-brand-400' : 'text-dim hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
