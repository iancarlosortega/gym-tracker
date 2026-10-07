import { ChevronLeft, ChevronRight, ListChecks, Play, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { lastDoneLabel } from '../last-done'
import { UpNextTag } from './routine-views'

interface NamedRoutine {
  readonly id: string
  readonly name: string
}

const primaryClass = 'min-h-touch text-base'

/** From a Home row: a tap there opens this, never a start on its own. */
export const RoutineStartChoices = ({
  routine,
  starting,
  onStart,
}: {
  readonly routine: NamedRoutine
  readonly starting: boolean
  readonly onStart: () => void
}) => (
  <div className="grid gap-3">
    <Button className={primaryClass} disabled={starting} onClick={onStart}>
      <Play className="size-5" />
      Start {routine.name}
    </Button>
    <Link
      href={`/routines/${routine.id}`}
      className="flex min-h-touch items-center justify-center gap-2 rounded-lg border font-medium"
    >
      <ListChecks className="size-5" />
      See the plan
    </Link>
  </div>
)

/** A routine as the start menu needs it: what it is, how long it is, when it was last done. */
export interface StartableRoutine extends NamedRoutine {
  readonly entries: readonly unknown[]
  readonly lastDoneAt: string | null
}

/** From this many routines on, the picker offers a search; fewer fit at a glance. */
export const SEARCH_FROM = 8

/** The routine up next first, the rest in the user's order, narrowed to names that match. */
export const pickableRoutines = <T extends NamedRoutine>(
  routines: readonly T[],
  upNextId: string | null,
  query: string,
): readonly T[] => {
  const needle = query.trim().toLowerCase()
  return [...routines]
    .sort((left, right) => Number(right.id === upNextId) - Number(left.id === upNextId))
    .filter((routine) => routine.name.toLowerCase().includes(needle))
}

const exerciseCount = (routine: StartableRoutine) =>
  routine.entries.length === 1 ? '1 exercise' : `${routine.entries.length} exercises`

const rowClass = 'min-h-touch w-full justify-start gap-3 px-3 text-base'

export interface StartMenuProps {
  readonly upNext: StartableRoutine | null
  readonly starting: boolean
  readonly onStartUpNext: () => void
  readonly onPickAnother: () => void
  readonly onStartEmpty: () => void
}

/** The + is a quick action: choosing an item is the intent, so it starts at once. */
export const StartMenu = ({
  upNext,
  starting,
  onStartUpNext,
  onPickAnother,
  onStartEmpty,
}: StartMenuProps) => (
  <div className="grid gap-1">
    {upNext !== null && (
      <>
        <Button
          className="mb-1 h-auto min-h-touch justify-start gap-3 px-3.5 py-2.5 text-left"
          disabled={starting}
          onClick={onStartUpNext}
        >
          <Play className="size-5 fill-current" />
          <span className="grid">
            <span className="font-semibold text-base">Start {upNext.name}</span>
            <span className="font-normal text-xs opacity-70">
              Up next · {exerciseCount(upNext)}
            </span>
          </span>
        </Button>
        <Button variant="ghost" className={rowClass} disabled={starting} onClick={onPickAnother}>
          <ListChecks className="size-5 text-muted-foreground" />
          Pick another routine
          <ChevronRight className="ml-auto size-4 text-muted-foreground" />
        </Button>
      </>
    )}
    <Button variant="ghost" className={rowClass} disabled={starting} onClick={onStartEmpty}>
      <Plus className="size-5 text-muted-foreground" />
      Empty workout
    </Button>
  </div>
)

export interface RoutinePickerProps {
  readonly routines: readonly StartableRoutine[]
  readonly upNextId: string | null
  readonly starting: boolean
  readonly now: Date
  readonly timeZone?: string
  readonly onStart: (routineId: string) => void
  readonly onBack: () => void
  /** Leaving for the Routines screen; the menu closes on the way. */
  readonly onManage?: () => void
}

/** Every routine, in a bounded list that scrolls on its own; a long one gets a search. */
export const RoutinePicker = ({
  routines,
  upNextId,
  starting,
  now,
  timeZone,
  onStart,
  onBack,
  onManage,
}: RoutinePickerProps) => {
  const [query, setQuery] = useState('')
  const shown = pickableRoutines(routines, upNextId, query)

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-lg" aria-label="Back" onClick={onBack}>
          <ChevronLeft className="size-5" />
        </Button>
        <p className="font-medium text-muted-foreground text-sm">Start which routine?</p>
      </div>
      {routines.length >= SEARCH_FROM && (
        <label className="mx-1 mb-1 flex items-center gap-2 rounded-lg bg-muted px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-live">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            aria-label="Find a routine"
            placeholder="Find a routine"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none"
          />
        </label>
      )}
      <div className="max-h-[40dvh] overflow-y-auto overscroll-contain">
        {shown.length === 0 ? (
          <p className="px-3 py-3 text-muted-foreground text-sm">No routine matches that.</p>
        ) : (
          <ul className="grid gap-0.5">
            {shown.map((routine) => (
              <li key={routine.id}>
                <Button
                  variant="ghost"
                  className="h-auto min-h-touch w-full justify-between gap-3 px-3 py-2 text-left"
                  disabled={starting}
                  onClick={() => onStart(routine.id)}
                >
                  <span className="grid min-w-0">
                    <span className="truncate font-medium text-base">{routine.name}</span>
                    <span className="font-normal text-muted-foreground text-xs tabular-nums">
                      {exerciseCount(routine)} · {lastDoneLabel(routine.lastDoneAt, now, timeZone)}
                    </span>
                  </span>
                  {routine.id === upNextId && <UpNextTag />}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        href="/routines"
        onClick={() => onManage?.()}
        className="mt-1 flex min-h-11 items-center justify-center gap-1 border-t font-medium text-muted-foreground text-sm"
      >
        Manage routines
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
