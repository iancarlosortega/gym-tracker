/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addedEntry, moved, RoutineEditor } from './routine-editor.tsx'

afterEach(cleanup)

const entry = (id: string, exerciseId: string, position: number) => ({
  id,
  exerciseId,
  equipmentId: null,
  position,
  targetSets: 3,
  targetReps: '10',
  restSeconds: 90,
})

const legs = {
  id: 'r-1',
  name: 'Legs',
  archived: false,
  entries: [entry('n-1', 'e-1', 1), entry('n-2', 'e-2', 2), entry('n-3', 'e-3', 3)],
}
const names = new Map([
  ['e-1', 'Squat'],
  ['e-2', 'Leg curl'],
  ['e-3', 'Calf raise'],
])
const catalog = [
  { id: 'e-1', name: 'Squat', defaultMode: 'TOTAL' as const, archived: false },
  { id: 'e-4', name: 'Lunge', defaultMode: 'TOTAL' as const, archived: false },
  { id: 'e-5', name: 'Old press', defaultMode: 'TOTAL' as const, archived: true },
]

const handlers = () => ({
  onReorder: vi.fn(),
  onEditEntry: vi.fn(),
  onAdd: vi.fn(),
  onRename: vi.fn(),
  onDone: vi.fn(),
})

describe('moved', () => {
  it('moves an entry up or down and keeps every other one', () => {
    expect(moved(['a', 'b', 'c'], 'c', -1)).toEqual(['a', 'c', 'b'])
    expect(moved(['a', 'b', 'c'], 'a', 1)).toEqual(['b', 'a', 'c'])
  })

  it('stays put at either end', () => {
    expect(moved(['a', 'b'], 'a', -1)).toEqual(['a', 'b'])
    expect(moved(['a', 'b'], 'b', 1)).toEqual(['a', 'b'])
  })
})

describe('RoutineEditor', () => {
  const props = { routine: legs, exerciseNames: names, exercises: catalog, pending: false }

  it('reorders with large up and down buttons', async () => {
    const on = handlers()
    render(<RoutineEditor {...props} {...on} />)

    await userEvent.click(screen.getByRole('button', { name: 'Move Leg curl up' }))

    expect(on.onReorder).toHaveBeenCalledWith(['n-2', 'n-1', 'n-3'])
    expect(screen.getByRole('button', { name: 'Move Squat up' }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('opens an entry to change its targets', async () => {
    const on = handlers()
    render(<RoutineEditor {...props} {...on} />)

    await userEvent.click(screen.getByRole('button', { name: 'Edit Calf raise' }))

    expect(on.onEditEntry).toHaveBeenCalledWith(legs.entries[2])
  })

  it('adds an exercise from the catalog, never an archived one', async () => {
    const on = handlers()
    render(<RoutineEditor {...props} {...on} />)

    await userEvent.click(screen.getByRole('button', { name: 'Add an exercise' }))
    expect(screen.queryByRole('button', { name: 'Add Old press' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add Squat' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Add Lunge' }))

    expect(on.onAdd).toHaveBeenCalledWith('e-4')
  })

  it('finishes editing', async () => {
    const on = handlers()
    render(<RoutineEditor {...props} {...on} />)

    await userEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(on.onDone).toHaveBeenCalledOnce()
  })
})

describe('addedEntry', () => {
  it('finds the entry an add created, so its targets can be set straight away', () => {
    const after = { ...legs, entries: [...legs.entries, entry('n-4', 'e-4', 4)] }

    expect(addedEntry(legs, after)?.id).toBe('n-4')
  })

  it('is nothing when the add created no entry', () => {
    expect(addedEntry(legs, legs)).toBeNull()
  })
})
