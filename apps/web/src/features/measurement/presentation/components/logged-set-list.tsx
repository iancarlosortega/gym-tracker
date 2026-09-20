import { X } from 'lucide-react'
import { Card } from '@/components/ui/card'

export interface LoggedSetRow {
  readonly id: string
  readonly exerciseName: string
  /** Already formatted: an ordinal reads as a position, a mass as a weight. */
  readonly load: string
  readonly reps: number
}

export interface LoggedSetListProps {
  readonly sets: readonly LoggedSetRow[]
}

/** What has been logged this session, newest first. Pure. */
export const LoggedSetList = ({ sets }: LoggedSetListProps) => {
  if (sets.length === 0) {
    return <p className="text-muted-foreground">No sets logged yet.</p>
  }

  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {sets.map((set) => (
        <li key={set.id}>
          <Card className="flex min-h-12 flex-row items-center justify-between gap-4 px-4 py-3">
            <span>{set.exerciseName}</span>
            <span className="flex items-center gap-1.5 text-xl font-bold">
              {set.load}
              <X aria-label="by" className="size-4 text-muted-foreground" />
              {set.reps}
            </span>
          </Card>
        </li>
      ))}
    </ul>
  )
}
