import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type {
  RecomputePreviewResponse,
  SetChangeResponse,
} from '../../infrastructure/http-recompute.gateway'

export interface RecomputeConsequencesProps {
  readonly preview: RecomputePreviewResponse
  readonly exerciseNames: ReadonlyMap<string, string>
}

/**
 * What this correction would do, in the order that matters.
 *
 * The record leads, because the count is the least useful number here: "42
 * sets will change" means nothing to anyone, while "your bench record was
 * never a hundred" means everything. The counts follow as reassurance, and
 * the one that reassures most is the one that says nothing is deleted.
 */
export const RecomputeConsequences = ({ preview, exerciseNames }: RecomputeConsequencesProps) => {
  const record = preview.records[0]

  return (
    <div className="grid gap-5">
      {record === undefined ? (
        <Card>
          <CardContent className="grid gap-2">
            <strong className="text-lg">No personal record changes</strong>
            <span className="text-muted-foreground text-sm">
              The figures move, but your best lifts stay where they are.
            </span>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-destructive">
          <CardContent className="grid gap-3">
            <span className="text-muted-foreground text-sm">
              Your {exerciseNames.get(record.exerciseId) ?? 'best lift'} record
            </span>
            <div className="flex items-baseline gap-3">
              <span className="font-bold text-3xl text-muted-foreground line-through tabular-nums">
                {record.fromKilograms}
              </span>
              <ArrowRight aria-hidden="true" className="size-5 text-destructive" />
              <span className="font-bold text-4xl text-destructive tabular-nums">
                {record.toKilograms} kg
              </span>
            </div>
            <span className="text-sm">
              It was never {record.fromKilograms}. The bar was recorded heavier than it is.
            </span>
          </CardContent>
        </Card>
      )}

      <ul className="m-0 grid list-none gap-2 p-0">
        <Consequence count={preview.affectedSets}>
          sets get a new figure. Every per-side set logged on this bar.
        </Consequence>
        <Consequence count={preview.records.length}>
          {preview.records.length === 1 ? 'exercise shows' : 'exercises show'} lower numbers than
          you remember.
        </Consequence>
        <Consequence count={0}>sets are deleted. Your reps and dates are untouched.</Consequence>
      </ul>
    </div>
  )
}

const Consequence = ({
  count,
  children,
}: {
  readonly count: number
  readonly children: React.ReactNode
}) => (
  <li className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
    <span className="min-w-11 font-bold text-2xl tabular-nums">{count}</span>
    <span className="text-sm">{children}</span>
  </li>
)

export interface SetChangeListProps {
  readonly changes: readonly SetChangeResponse[]
  readonly exerciseNames: ReadonlyMap<string, string>
}

/** The full ledger, for anyone who wants to check the work. */
export const SetChangeList = ({ changes, exerciseNames }: SetChangeListProps) => (
  <ul className="m-0 grid list-none gap-2 p-0">
    {changes.map((change) => (
      <li
        className="flex min-h-11 items-center gap-3 rounded-md border border-border px-4 py-2"
        key={change.setId}
      >
        <span className="grow text-muted-foreground text-sm">
          {new Date(change.loggedAt).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
          })}{' '}
          · {exerciseNames.get(change.exerciseId) ?? 'Exercise'}
        </span>
        <span className="text-muted-foreground text-sm line-through tabular-nums">
          {change.fromKilograms}
        </span>
        <span className="font-bold tabular-nums">{change.toKilograms} kg</span>
      </li>
    ))}
  </ul>
)
