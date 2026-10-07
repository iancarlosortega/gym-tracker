'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  RoutinePicker,
  type StartableRoutine,
  StartMenu,
} from '../../../routines/presentation/components/start-sheets'

type View = 'menu' | 'picker'

export interface StartPopoverProps {
  readonly upNext: StartableRoutine | null
  readonly routines: readonly StartableRoutine[]
  readonly starting: boolean
  /** The last start did not reach the server. */
  readonly failed: boolean
  readonly now: Date
  readonly timeZone?: string
  /** A routine id, or nothing for an empty workout. */
  readonly onStart: (routineId?: string) => void
  readonly onOpenChange?: (open: boolean) => void
}

/** The + and the start choices that grow out of it; picking another routine stays inside. */
export const StartPopover = ({
  upNext,
  routines,
  starting,
  failed,
  now,
  timeZone,
  onStart,
  onOpenChange,
}: StartPopoverProps) => {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('menu')

  const changeOpen = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }

  const start = (routineId?: string) => {
    changeOpen(false)
    onStart(routineId)
  }

  return (
    <Popover
      open={open}
      onOpenChange={changeOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setView('menu')
      }}
    >
      {/* The circle itself is the anchor, so the popup measures from what the eye sees. */}
      <div className="flex justify-center">
        <PopoverTrigger
          aria-label="Start a workout"
          className="group -mt-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Plus
            className="size-7 transition-transform duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)] group-aria-expanded:rotate-[135deg] motion-reduce:transition-none"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-[min(17rem,calc(100vw-2rem))]">
        <PopoverTitle className="sr-only">Start a workout</PopoverTitle>
        {/* Clips the sliding views without clipping the caret, which hangs below the popup. */}
        <div className="overflow-hidden rounded-[inherit]">
          <div
            className={cn(
              'flex w-[200%] items-start transition-transform duration-300 ease-[cubic-bezier(0.4,1.1,0.5,1)] motion-reduce:transition-none',
              view === 'picker' && '-translate-x-1/2',
            )}
          >
            <div className="w-1/2 p-2" inert={view !== 'menu'}>
              <StartMenu
                upNext={upNext}
                starting={starting}
                onStartUpNext={() => start(upNext?.id)}
                onPickAnother={() => setView('picker')}
                onStartEmpty={() => start()}
              />
            </div>
            <div className="w-1/2 p-2" inert={view !== 'picker'}>
              {view === 'picker' && (
                <RoutinePicker
                  routines={routines}
                  upNextId={upNext?.id ?? null}
                  starting={starting}
                  now={now}
                  {...(timeZone === undefined ? {} : { timeZone })}
                  onStart={start}
                  onBack={() => setView('menu')}
                  onManage={() => changeOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
        {failed && (
          <p role="alert" className="px-4 pb-3 text-destructive text-sm">
            Could not start it. Try again once you're online.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
