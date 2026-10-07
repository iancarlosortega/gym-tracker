import { CircleUser, ClipboardList, House, type LucideIcon, Timer, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Tab = 'home' | 'progress' | 'routines' | 'profile'

/** The catalog lives with routines, so exercises and equipment light the Routines tab. */
export const activeTab = (pathname: string): Tab | null => {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/statistics')) return 'progress'
  if (['/routines', '/exercises', '/equipment'].some((root) => pathname.startsWith(root))) {
    return 'routines'
  }
  if (pathname.startsWith('/profile')) return 'profile'
  return null
}

interface TabLinkProps {
  readonly href: string
  readonly label: string
  readonly icon: LucideIcon
  readonly current: boolean
}

const TabLink = ({ href, label, icon: Icon, current }: TabLinkProps) => (
  <Link
    href={href}
    aria-current={current ? 'page' : undefined}
    className={cn(
      'flex min-h-13 flex-col items-center justify-center gap-1 font-medium text-[11px]',
      current ? 'font-semibold text-foreground' : 'text-muted-foreground',
    )}
  >
    <Icon className="size-6" aria-hidden="true" />
    {label}
  </Link>
)

export interface TabBarProps {
  readonly pathname: string
  /** While a workout runs, the middle button goes back to it instead of starting another. */
  readonly workoutOpen?: boolean
  /** The middle button and the start choices it opens; a start is a choice, not a navigation. */
  readonly startMenu: ReactNode
}

export const TabBar = ({ pathname, workoutOpen = false, startMenu }: TabBarProps) => {
  const current = activeTab(pathname)

  return (
    <nav
      aria-label="Main"
      className="grid grid-cols-5 items-end border-border border-t bg-background px-2 pt-2 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
    >
      <TabLink href="/" label="Home" icon={House} current={current === 'home'} />
      <TabLink
        href="/statistics"
        label="Progress"
        icon={TrendingUp}
        current={current === 'progress'}
      />
      {workoutOpen ? (
        <Link href="/workout" aria-label="Back to the workout" className="flex justify-center">
          <span className="-mt-6 flex size-16 items-center justify-center rounded-full bg-live text-background">
            <Timer className="size-7" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </Link>
      ) : (
        startMenu
      )}
      <TabLink
        href="/routines"
        label="Routines"
        icon={ClipboardList}
        current={current === 'routines'}
      />
      <TabLink href="/profile" label="Profile" icon={CircleUser} current={current === 'profile'} />
    </nav>
  )
}
