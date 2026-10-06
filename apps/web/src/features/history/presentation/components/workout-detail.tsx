'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { type DoneRow, DoneSetList } from '../../../measurement/presentation/workout/workout-views'

export interface ExerciseSets {
  readonly exerciseId: string
  readonly name: string
  readonly equipmentName: string | null
  readonly rows: readonly DoneRow[]
}

export interface WorkoutDetailProps {
  readonly title: string
  /** "Thu, Oct 1", in the phone's zone. */
  readonly day: string
  /** "18:10 – 19:05", or "from 18:05" while in progress. */
  readonly times: string
  readonly setCount: number
  /** Still in progress. */
  readonly open: boolean
  readonly groups: readonly ExerciseSets[]
  readonly deleting: boolean
  readonly deleteFailed: boolean
  readonly onEdit: (setId: string) => void
  readonly onDelete: () => void
}

const setsLabel = (count: number) => `${count} ${count === 1 ? 'set' : 'sets'}`

/** One workout set by set; any set opens for correcting, and the whole workout can go. */
export const WorkoutDetail = ({
  title,
  day,
  times,
  setCount,
  open,
  groups,
  deleting,
  deleteFailed,
  onEdit,
  onDelete,
}: WorkoutDetailProps) => {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="grid gap-5">
      <header className="grid gap-1">
        <h1 className="font-bold text-2xl">{title}</h1>
        <p className="text-muted-foreground text-sm tabular-nums">
          {day} · {times}
        </p>
        <p className="text-muted-foreground text-sm tabular-nums">
          {open ? `${setsLabel(setCount)} so far · in progress` : setsLabel(setCount)}
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="text-muted-foreground">No sets logged.</p>
      ) : (
        groups.map((group) => (
          <section key={group.exerciseId} aria-label={group.name} className="grid gap-2">
            <h2 className="flex items-baseline justify-between font-semibold">
              {group.name}
              {group.equipmentName !== null && (
                <span className="font-normal text-muted-foreground text-xs">
                  {group.equipmentName}
                </span>
              )}
            </h2>
            <DoneSetList rows={group.rows} onEdit={onEdit} />
          </section>
        ))
      )}

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="delete-workout-title"
          className="grid gap-3 rounded-xl border border-destructive/40 p-4"
        >
          <h2 id="delete-workout-title" className="font-semibold">
            Delete {title}?
          </h2>
          <p className="text-muted-foreground text-sm">
            {day} and its {setsLabel(setCount)} are removed from your history and your progress.
            This cannot be undone.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="min-h-touch" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-touch"
              onClick={() => {
                setConfirming(false)
                onDelete()
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="destructive"
          className="min-h-touch"
          disabled={deleting}
          onClick={() => setConfirming(true)}
        >
          {deleting ? 'Deleting…' : 'Delete workout'}
        </Button>
      )}
      {deleteFailed && (
        <p role="alert" className="text-destructive text-sm">
          The workout was not deleted. Check your connection and try again.
        </p>
      )}
    </div>
  )
}
