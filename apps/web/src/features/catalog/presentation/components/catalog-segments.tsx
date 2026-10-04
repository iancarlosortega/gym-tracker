import Link from 'next/link'
import { cn } from '@/lib/utils'

export type CatalogSegment = 'routines' | 'exercises' | 'equipment'

const SEGMENTS: readonly { readonly segment: CatalogSegment; readonly label: string }[] = [
  { segment: 'routines', label: 'Routines' },
  { segment: 'exercises', label: 'Exercises' },
  { segment: 'equipment', label: 'Equipment' },
]

export const currentSegment = (pathname: string): CatalogSegment => {
  if (pathname.startsWith('/exercises')) return 'exercises'
  if (pathname.startsWith('/equipment')) return 'equipment'
  return 'routines'
}

/**
 * Routines, exercises and equipment share the Routines tab; this switches
 * between them. Links, not tabs, because each one is its own route.
 */
export const CatalogSegments = ({ pathname }: { readonly pathname: string }) => {
  const current = currentSegment(pathname)

  return (
    <nav aria-label="Catalog" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
      {SEGMENTS.map(({ segment, label }) => (
        <Link
          key={segment}
          href={`/${segment}`}
          aria-current={segment === current ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center justify-center rounded-lg font-medium text-sm',
            segment === current ? 'bg-background shadow-sm' : 'text-muted-foreground',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
