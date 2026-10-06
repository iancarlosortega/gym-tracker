import { ChevronRight, History } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/** The way into History from Home and Profile; History itself lives under Progress. */
export const HistoryLink = ({ className }: { readonly className?: string }) => (
  <Link
    href="/statistics/history"
    className={cn(
      'flex min-h-touch items-center gap-3 rounded-xl bg-card px-4 font-medium',
      className,
    )}
  >
    <History className="size-5 text-muted-foreground" aria-hidden="true" />
    <span className="grow">Workout history</span>
    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
  </Link>
)
