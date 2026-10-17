import { NavLink } from 'react-router-dom'
import { ChartIcon, ClipboardIcon, DumbbellIcon, GearIcon } from './NavIcons'
import Barbell from './Barbell'

const items = [
  { to: '/plan', label: 'Plan', icon: ClipboardIcon },
  { to: '/training', label: 'Training', icon: DumbbellIcon },
  { to: '/progress', label: 'Fortschritt', icon: ChartIcon },
  { to: '/settings', label: 'Mehr', icon: GearIcon },
]

/** Linke Navigationsleiste für breite Bildschirme (Desktop-Browser) – ersetzt dort die BottomNav. */
export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Barbell plates={0} size="sm" />
        <span className="font-display text-lg text-ink">
          Kineti<span className="text-brand-400">Q</span>
        </span>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `press flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive ? 'bg-ink text-on-ink' : 'text-dim hover:bg-panel2 hover:text-ink'
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
      </nav>
    </aside>
  )
}
