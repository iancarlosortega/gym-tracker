import { CircleUser, ClipboardList, House, type LucideIcon, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
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
}

export const TabBar = ({ pathname }: TabBarProps) => {
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
      <Link href="/workout" aria-label="Start a workout" className="flex justify-center">
        <span className="-mt-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Plus className="size-7" strokeWidth={2.5} aria-hidden="true" />
        </span>
      </Link>
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
