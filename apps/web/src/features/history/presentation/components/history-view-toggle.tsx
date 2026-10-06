import { CalendarDays, List } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HistoryView = 'list' | 'calendar'

const views = [
  { id: 'list', label: 'List', icon: List },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
] as const

export const HistoryViewToggle = ({
  view,
  onChange,
}: {
  readonly view: HistoryView
  readonly onChange: (view: HistoryView) => void
}) => (
  <div className="flex gap-1 rounded-lg bg-muted p-1">
    {views.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type="button"
        aria-pressed={view === id}
        aria-label={label}
        onClick={() => onChange(id)}
        className={cn(
          'flex size-11 items-center justify-center rounded-md',
          view === id ? 'bg-card shadow-sm' : 'text-muted-foreground',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    ))}
  </div>
)
