import { Card, CardContent } from '@/components/ui/card'
import type { WeekSummaryResponse } from '../../infrastructure/http-statistics.gateway'

export interface WeekHeadlineProps {
  readonly current: WeekSummaryResponse
  readonly previous: WeekSummaryResponse
}

/**
 * The week in four figures, each read against the week before it.
 *
 * Sets lead rather than tonnage. A set counts the same whether it was a
 * barbell or a pin position, so it is the one headline that needs no
 * exclusion notice attached to it — and a number that has to apologise for
 * itself is a poor thing to open a page with.
 */
export const WeekHeadline = ({ current, previous }: WeekHeadlineProps) => (
  <Card>
    <CardContent className="grid gap-4">
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-5xl tabular-nums tracking-tight">{current.sets}</span>
        <span className="text-muted-foreground">sets</span>
        <span className="ml-auto font-bold text-sm">
          <Delta value={current.sets - previous.sets} suffix="on last week" />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 border-border border-t pt-4">
        <Figure value={String(current.workouts)} label="workouts">
          <Delta value={current.workouts - previous.workouts} suffix="" />
        </Figure>

        <Figure
          value={
            current.plan === null
              ? '—'
              : `${current.plan.completedSets}/${current.plan.plannedSets}`
          }
          label={current.plan === null ? 'no plan followed' : 'plan completed'}
        >
          {current.plan !== null && previous.plan !== null && (
            <span className="text-muted-foreground text-xs">
              was {previous.plan.completedSets}/{previous.plan.plannedSets}
            </span>
          )}
        </Figure>

        <Figure value={String(current.liftsUp)} label="lifts up">
          <span className="text-muted-foreground text-xs">
            {current.liftsDown} down, {current.liftsHeld} held
          </span>
        </Figure>
      </div>
    </CardContent>
  </Card>
)

const Figure = ({
  value,
  label,
  children,
}: {
  readonly value: string
  readonly label: string
  readonly children?: React.ReactNode
}) => (
  <div className="grid gap-0.5">
    <span className="font-bold text-2xl tabular-nums">{value}</span>
    <span className="text-muted-foreground text-xs">{label}</span>
    {children}
  </div>
)

/** Green up, red down, muted when nothing moved — and it says so in words. */
const Delta = ({ value, suffix }: { readonly value: number; readonly suffix: string }) => {
  if (value === 0) {
    return <span className="text-muted-foreground text-xs">same as last</span>
  }

  return (
    <span className={value > 0 ? 'text-primary' : 'text-destructive'}>
      {value > 0 ? '+' : ''}
      {value} {suffix}
    </span>
  )
}
