import { History } from 'lucide-react'
import { type DisplayUnit, kilogramsToDisplay, unitLabel } from '@/lib/units'
import type { LastSet, LastTimeState } from './workout-plan'

/** Per side, or per hand on dumbbells; values arrive in kilograms and read in the user's unit. */
export const lastSetLabel = (set: LastSet, unit: DisplayUnit = 'KG', perHand = false): string => {
  const weight = `${kilogramsToDisplay(set.value, unit)} ${unitLabel(unit)}`
  switch (set.mode) {
    case 'PER_SIDE':
      return `${weight}/${perHand ? 'hand' : 'side'} × ${set.reps}`
    case 'STACK_POSITION':
      return `Pin ${set.value} × ${set.reps}`
    case 'TOTAL':
      return `${weight} × ${set.reps}`
  }
}

const message = (
  state: LastTimeState,
  unit: DisplayUnit,
  perHand: boolean,
): { title: string; body: string | null } => {
  switch (state.kind) {
    case 'value':
      return {
        title: `Last time · set ${state.set.setNumber}`,
        body: lastSetLabel(state.set, unit, perHand),
      }
    case 'no-set':
      return { title: `No set ${state.setNumber} last time`, body: null }
    case 'none':
      return { title: 'First time doing this one', body: null }
    case 'offline':
      return { title: 'Offline · last time unavailable', body: null }
    case 'loading':
      return { title: 'Reading last time…', body: null }
  }
}

/** Always takes the same space, so the tiles below never jump. */
export const LastTimeCard = ({
  state,
  unit = 'KG',
  perHand = false,
}: {
  readonly state: LastTimeState
  readonly unit?: DisplayUnit
  readonly perHand?: boolean
}) => {
  const { title, body } = message(state, unit, perHand)

  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl bg-card px-4 py-3">
      <History className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="grid">
        <span className="text-muted-foreground text-sm">{title}</span>
        {body !== null && <strong className="text-lg">{body}</strong>}
      </div>
    </div>
  )
}
