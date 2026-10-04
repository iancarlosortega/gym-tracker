import { ChevronDown, ChevronLeft, ChevronRight, CloudUpload, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const WorkoutHeader = ({
  title,
  elapsed,
  finishing,
  onFinish,
}: {
  readonly title: string
  readonly elapsed: string
  readonly finishing: boolean
  readonly onFinish: () => void
}) => (
  <header className="flex items-center justify-between gap-3">
    <Link
      href="/"
      aria-label="Minimize workout"
      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card"
    >
      <ChevronDown className="size-5" aria-hidden="true" />
    </Link>
    <h1 className="truncate font-semibold">
      {title} · <span className="tabular-nums">{elapsed}</span>
    </h1>
    <Button
      variant="ghost"
      className="min-h-11 font-semibold"
      disabled={finishing}
      onClick={onFinish}
    >
      Finish
    </Button>
  </header>
)

export interface ExerciseFocusProps {
  /** 1-based. */
  readonly position: number
  readonly count: number
  /** "4 × 6–8", or null when the exercise is not in the plan. */
  readonly plan: string | null
  readonly name: string
  readonly done: number
  readonly target: number | null
  readonly equipmentName: string | null
  readonly onPickEquipment: () => void
}

export const ExerciseFocus = ({
  position,
  count,
  plan,
  name,
  done,
  target,
  equipmentName,
  onPickEquipment,
}: ExerciseFocusProps) => {
  const goal = Math.max(target ?? done, done, 1)

  return (
    <section className="grid gap-2">
      <span className="text-muted-foreground text-sm">
        Exercise {position} of {count}
        {plan !== null && ` · ${plan}`}
      </span>
      <h2 className="font-extrabold text-3xl tracking-tight">{name}</h2>
      <div
        role="progressbar"
        aria-label="Sets done"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={done}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full bg-live" style={{ width: `${(done / goal) * 100}%` }} />
      </div>
      <button
        type="button"
        aria-label={
          equipmentName === null ? 'Pick the equipment' : `Equipment: ${equipmentName}. Change`
        }
        onClick={onPickEquipment}
        className={cn(
          'flex min-h-11 items-center gap-2 justify-self-start rounded-full border px-3 text-sm',
          equipmentName === null
            ? 'border-primary text-primary'
            : 'border-border text-muted-foreground',
        )}
      >
        <Dumbbell className="size-4" aria-hidden="true" />
        {equipmentName ?? 'Pick the equipment'}
      </button>
    </section>
  )
}

export interface DoneRow {
  readonly id: string
  readonly setNumber: number
  readonly label: string
  /** Still in the phone's queue, not yet confirmed by the server. */
  readonly pending: boolean
}

export const DoneSets = ({ rows }: { readonly rows: readonly DoneRow[] }) =>
  rows.length === 0 ? null : (
    <section className="grid gap-2">
      <h3 className="font-semibold text-muted-foreground text-sm">Done</h3>
      <ol className="grid gap-1">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3 rounded-xl bg-card px-4 py-2.5">
            <span className="w-5 font-semibold text-muted-foreground">{row.setNumber}</span>
            <span className="grow font-medium">{row.label}</span>
            {row.pending && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <CloudUpload className="size-3.5" aria-hidden="true" />
                waiting to sync
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )

export interface LogRowProps {
  readonly setNumber: number
  readonly canLog: boolean
  readonly hasPrevious: boolean
  readonly hasNext: boolean
  readonly onLog: () => void
  readonly onPrevious: () => void
  readonly onNext: () => void
}

const stepClass = 'size-16 shrink-0 rounded-2xl'

export const LogRow = ({
  setNumber,
  canLog,
  hasPrevious,
  hasNext,
  onLog,
  onPrevious,
  onNext,
}: LogRowProps) => (
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      className={stepClass}
      aria-label="Previous exercise"
      disabled={!hasPrevious}
      onClick={onPrevious}
    >
      <ChevronLeft className="size-6" />
    </Button>
    <Button className="h-16 grow rounded-2xl font-bold text-lg" disabled={!canLog} onClick={onLog}>
      Log set {setNumber}
    </Button>
    <Button
      variant="outline"
      className={stepClass}
      aria-label="Next exercise"
      disabled={!hasNext}
      onClick={onNext}
    >
      <ChevronRight className="size-6" />
    </Button>
  </div>
)
