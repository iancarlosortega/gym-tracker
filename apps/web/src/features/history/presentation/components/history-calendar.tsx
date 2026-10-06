import type { LocalDate } from '@gym/domain/shared/services/local-calendar'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WorkoutHistoryEntry } from '../../infrastructure/history.api'
import type { CalendarCell } from '../history-calendar'
import { WorkoutRow } from './workout-row'

export interface HistoryCalendarProps {
  readonly title: string
  readonly weeks: readonly (readonly CalendarCell[])[]
  readonly trained: ReadonlySet<LocalDate>
  readonly today: LocalDate
  readonly selected: LocalDate | null
  /** The selected day's workouts. */
  readonly dayEntries: readonly WorkoutHistoryEntry[]
  readonly zone: string
  readonly onSelect: (date: LocalDate) => void
  readonly onPrevious: () => void
  readonly onNext: () => void
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const longDate = (date: LocalDate, options: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' })

const dayLabel = (date: LocalDate, today: boolean, trained: boolean) =>
  [longDate(date, { month: 'long', day: 'numeric' }), today && 'today', trained && 'trained']
    .filter(Boolean)
    .join(', ')

/** A month at a glance: a dot on each day trained, and that day's workouts below. */
export const HistoryCalendar = ({
  title,
  weeks,
  trained,
  today,
  selected,
  dayEntries,
  zone,
  onSelect,
  onPrevious,
  onNext,
}: HistoryCalendarProps) => (
  <div className="grid gap-4">
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        aria-label="Previous month"
        onClick={onPrevious}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <h2 className="font-semibold">{title}</h2>
      <Button
        variant="ghost"
        size="icon"
        className="size-11"
        aria-label="Next month"
        onClick={onNext}
      >
        <ChevronRight className="size-5" />
      </Button>
    </div>

    <fieldset className="grid grid-cols-7 gap-y-1 border-0 p-0 text-center">
      <legend className="sr-only">{title}</legend>
      {WEEKDAYS.map((weekday, index) => (
        <span
          // Two days share each initial, so the column is the key.
          // biome-ignore lint/suspicious/noArrayIndexKey: the weekday columns never reorder
          key={index}
          aria-hidden="true"
          className="font-semibold text-[0.65rem] text-muted-foreground"
        >
          {weekday}
        </span>
      ))}
      {weeks.flat().map((cell) => {
        const isTrained = trained.has(cell.date)
        const isSelected = cell.date === selected
        return (
          <button
            key={cell.date}
            type="button"
            aria-pressed={isSelected}
            aria-label={dayLabel(cell.date, cell.date === today, isTrained)}
            onClick={() => onSelect(cell.date)}
            className={cn(
              'relative mx-auto flex size-11 items-center justify-center rounded-lg text-sm tabular-nums',
              !cell.inMonth && 'text-muted-foreground/50',
              cell.date === today && !isSelected && 'ring-1 ring-muted-foreground',
              isSelected && 'bg-primary font-bold text-primary-foreground',
            )}
          >
            {Number(cell.date.slice(8, 10))}
            {isTrained && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute bottom-1 size-1 rounded-full',
                  isSelected ? 'bg-primary-foreground' : 'bg-foreground',
                )}
              />
            )}
          </button>
        )
      })}
    </fieldset>

    {selected !== null && (
      <section
        aria-label={longDate(selected, { weekday: 'long', month: 'short', day: 'numeric' })}
        className="grid gap-2"
      >
        <h3 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
          {longDate(selected, { weekday: 'long', month: 'short', day: 'numeric' })}
        </h3>
        {dayEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No workout that day.</p>
        ) : (
          <ol className="grid gap-1.5">
            {dayEntries.map((entry) => (
              <li key={entry.id}>
                <WorkoutRow entry={entry} zone={zone} />
              </li>
            ))}
          </ol>
        )}
      </section>
    )}
  </div>
)
