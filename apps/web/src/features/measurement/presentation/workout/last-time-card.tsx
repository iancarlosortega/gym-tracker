import { History } from 'lucide-react'
import type { LastSet, LastTimeState } from './workout-plan'

export const lastSetLabel = (set: LastSet): string => {
  switch (set.mode) {
    case 'PER_SIDE':
      return `${set.value} kg/side × ${set.reps}`
    case 'STACK_POSITION':
      return `Pin ${set.value} × ${set.reps}`
    case 'TOTAL':
      return `${set.value} kg × ${set.reps}`
  }
}

const message = (state: LastTimeState): { title: string; body: string | null } => {
  switch (state.kind) {
    case 'value':
      return { title: `Last time · set ${state.set.setNumber}`, body: lastSetLabel(state.set) }
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
export const LastTimeCard = ({ state }: { readonly state: LastTimeState }) => {
  const { title, body } = message(state)

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
