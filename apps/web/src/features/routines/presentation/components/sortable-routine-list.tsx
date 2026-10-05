'use client'

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { RoutineResponse } from '../../infrastructure/routines.api'

export interface SortableRoutineListProps {
  readonly routines: readonly RoutineResponse[]
  /** The card each row shows between its handle and its arrows. */
  readonly card: (routine: RoutineResponse) => ReactNode
  readonly onReorder: (routineIds: string[]) => void
}

const moveButton =
  'flex flex-1 items-center justify-center rounded-lg text-muted-foreground disabled:opacity-30'

const SortableRoutineRow = ({
  routine,
  index,
  count,
  card,
  onMove,
}: {
  readonly routine: RoutineResponse
  readonly index: number
  readonly count: number
  readonly card: ReactNode
  readonly onMove: (from: number, to: number) => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: routine.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-stretch gap-1', isDragging && 'relative z-10 opacity-90 shadow-lg')}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Drag ${routine.name} to reorder`}
        // The handle alone takes the gesture, so a swipe anywhere else on the row scrolls.
        className="flex w-10 shrink-0 cursor-grab touch-none select-none items-center justify-center text-muted-foreground [-webkit-touch-callout:none]"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>
      {card}
      <div className="flex w-10 shrink-0 flex-col gap-1">
        <button
          type="button"
          aria-label={`Move ${routine.name} up`}
          className={moveButton}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ChevronUp className="size-5" />
        </button>
        <button
          type="button"
          aria-label={`Move ${routine.name} down`}
          className={moveButton}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ChevronDown className="size-5" />
        </button>
      </div>
    </li>
  )
}

/**
 * The routines in the user's own order: drag a row by its handle, or move it
 * one place with its arrows, which also serve VoiceOver.
 *
 * A finger has to rest on the handle briefly before it drags, so a quick
 * swipe still scrolls the list; a mouse drags after a few pixels.
 */
export const SortableRoutineList = ({ routines, card, onReorder }: SortableRoutineListProps) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = routines.map((routine) => routine.id)
  const nameOf = (id: string | number) =>
    routines.find((routine) => routine.id === id)?.name ?? 'Routine'
  const placeOf = (id: string | number) => ids.indexOf(String(id)) + 1

  const move = (from: number, to: number) => onReorder(arrayMove(ids, from, to))

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over === null || active.id === over.id) return
    move(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
          onDragOver: ({ active, over }) =>
            over === null
              ? `${nameOf(active.id)} is not over a place.`
              : `${nameOf(active.id)} is at place ${placeOf(over.id)} of ${ids.length}.`,
          onDragEnd: ({ active, over }) =>
            over === null
              ? `${nameOf(active.id)} was dropped back.`
              : `${nameOf(active.id)} dropped at place ${placeOf(over.id)} of ${ids.length}.`,
          onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="grid gap-2">
          {routines.map((routine, index) => (
            <SortableRoutineRow
              key={routine.id}
              routine={routine}
              index={index}
              count={routines.length}
              card={card(routine)}
              onMove={move}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
