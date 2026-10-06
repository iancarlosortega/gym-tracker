import Link from 'next/link'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'progress', label: 'Progress', href: '/statistics' },
  { id: 'history', label: 'History', href: '/statistics/history' },
] as const

/** Progress and History are two views of one tab, switched in place. */
export const ProgressTabs = ({ current }: { readonly current: 'progress' | 'history' }) => (
  <nav aria-label="Progress views" className="grid grid-cols-2 rounded-xl bg-muted p-1">
    {tabs.map((tab) => (
      <Link
        key={tab.id}
        href={tab.href}
        aria-current={tab.id === current ? 'page' : undefined}
        className={cn(
          'flex min-h-touch items-center justify-center rounded-lg font-semibold text-sm',
          tab.id === current ? 'bg-card shadow-sm' : 'text-muted-foreground',
        )}
      >
        {tab.label}
      </Link>
    ))}
  </nav>
)
