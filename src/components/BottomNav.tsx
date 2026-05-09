'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Music2, BookOpen, User } from 'lucide-react'

const TABS = [
  { href: '/',          label: 'Home',     Icon: Home },
  { href: '/discover',  label: 'Discover', Icon: Compass },
  { href: '/player',    label: 'Player',   Icon: Music2 },
  { href: '/deck',      label: 'Deck',     Icon: BookOpen },
  { href: '/profile',   label: 'Profile',  Icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur border-t border-slate-800">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {TABS.map(({ href, label, Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              data-active={isActive}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
