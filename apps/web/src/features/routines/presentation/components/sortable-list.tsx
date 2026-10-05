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

export interface SortableListProps<T extends { readonly id: string }> {
  readonly items: readonly T[]
  /** How a row is named to VoiceOver: "Drag Push day to reorder", "Move Squat up". */
  readonly label: (item: T) => string
  /** The card each row shows between its handle and its arrows. */
  readonly card: (item: T) => ReactNode
  /** Every item id, in the new order. */
  readonly onReorder: (ids: string[]) => void
}

const moveButton =
  'flex flex-1 items-center justify-center rounded-lg text-muted-foreground disabled:opacity-30'

const SortableRow = ({
  id,
  name,
  index,
  count,
  card,
  onMove,
}: {
  readonly id: string
  readonly name: string
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
  } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-stretch gap-1', isDragging && 'relative z-10 opacity-90 shadow-lg')}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Drag ${name} to reorder`}
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
          aria-label={`Move ${name} up`}
          className={moveButton}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ChevronUp className="size-5" />
        </button>
        <button
          type="button"
          aria-label={`Move ${name} down`}
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
 * A list in the user's own order: drag a row by its handle, or move it one
 * place with its arrows, which also serve VoiceOver.
 *
 * A finger has to rest on the handle briefly before it drags, so a quick
 * swipe still scrolls the list; a mouse drags after a few pixels.
 */
export const SortableList = <T extends { readonly id: string }>({
  items,
  label,
  card,
  onReorder,
}: SortableListProps<T>) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = items.map((item) => item.id)
  const nameOf = (id: string | number) => {
    const item = items.find((candidate) => candidate.id === id)
    return item === undefined ? 'Item' : label(item)
  }
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
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              id={item.id}
              name={label(item)}
              index={index}
              count={items.length}
              card={card(item)}
              onMove={move}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
