import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const RADIUS = 112
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export interface RestCountdownProps {
  readonly remainingSeconds: number
  readonly totalSeconds: number
  readonly exerciseName: string
  /** What was just performed, already formatted. */
  readonly lastSet: string
  readonly onAdjust: (seconds: number) => void
  readonly onSkip: () => void
}

/**
 * The rest countdown, owning the whole screen.
 *
 * It takes over deliberately. The number has to be readable at arm's length
 * from a bench with the phone propped against a plate, which is the only
 * moment it is ever looked at, and that is also what the wake lock is for.
 * Everything else on the page can wait the two minutes.
 */
export const RestCountdown = ({
  remainingSeconds,
  totalSeconds,
  exerciseName,
  lastSet,
  onAdjust,
  onSkip,
}: RestCountdownProps) => {
  const elapsed = totalSeconds === 0 ? 0 : (totalSeconds - remainingSeconds) / totalSeconds

  return (
    <section className="flex min-h-[70vh] flex-col gap-6" aria-labelledby="rest-heading">
      <header className="flex min-h-11 items-center justify-between text-sm text-muted-foreground">
        <span id="rest-heading">Resting after {exerciseName}</span>
        <span>{lastSet}</span>
      </header>

      <div className="relative flex grow items-center justify-center">
        <svg
          className="-rotate-90"
          width="260"
          height="260"
          viewBox="0 0 260 260"
          aria-hidden="true"
        >
          <circle cx="130" cy="130" r={RADIUS} fill="none" stroke="var(--muted)" strokeWidth="14" />
          <circle
            cx="130"
            cy="130"
            r={RADIUS}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * elapsed}
          />
        </svg>

        <div className="absolute flex flex-col items-center gap-1">
          {/* The remaining time is announced as it changes, not on every tick. */}
          <output
            className="font-bold text-7xl tabular-nums tracking-tight"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatRemaining(remainingSeconds)}
          </output>
          <span className="text-sm text-muted-foreground">
            of {formatRemaining(totalSeconds)} rest
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          aria-label="Rest thirty seconds less"
          className="min-h-touch grow text-lg"
          variant="outline"
          type="button"
          onClick={() => onAdjust(-30)}
        >
          <Minus /> 30s
        </Button>
        <Button
          aria-label="Rest thirty seconds more"
          className="min-h-touch grow text-lg"
          variant="outline"
          type="button"
          onClick={() => onAdjust(30)}
        >
          <Plus /> 30s
        </Button>
      </div>

      <Button className="min-h-touch-lg text-xl" type="button" onClick={onSkip}>
        Skip rest
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        The screen stays awake while you rest.
      </p>
    </section>
  )
}

/** m:ss, because nobody reads 143 seconds as two and a bit minutes. */
const formatRemaining = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return `${minutes}:${String(rest).padStart(2, '0')}`
}
