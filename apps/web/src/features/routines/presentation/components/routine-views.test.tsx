/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RoutineCards, RoutinePlan, restLabel, targetLabel } from './routine-views.tsx'

afterEach(cleanup)

const entry = (id: string, exerciseId: string, position: number, extra = {}) => ({
  id,
  exerciseId,
  equipmentId: null,
  position,
  targetSets: 4,
  targetReps: '6-8',
  restSeconds: 180,
  ...extra,
})

const names = new Map([
  ['e-1', 'Squat'],
  ['e-2', 'Leg curl'],
])

const legs = {
  id: 'r-1',
  name: 'Legs',
  archived: false,
  entries: [
    entry('n-2', 'e-2', 2, { targetSets: 3, targetReps: '12', restSeconds: 90 }),
    entry('n-1', 'e-1', 1),
  ],
}

describe('restLabel', () => {
  it.each([
    [180, '3:00'],
    [90, '1:30'],
    [45, '0:45'],
  ])('reads %i seconds as %s', (seconds, label) => {
    expect(restLabel(seconds)).toBe(label)
  })
})

describe('targetLabel', () => {
  it.each([
    [4, '6-8', '4 × 6–8'],
    [3, '12', '3 × 12'],
    [null, null, 'No target'],
    [3, null, '3 sets'],
  ])('reads %s sets of %s as "%s"', (sets, reps, label) => {
    expect(targetLabel(sets, reps)).toBe(label)
  })
})

describe('RoutineCards', () => {
  it('shows each routine with its exercises and links to its plan', () => {
    render(<RoutineCards routines={[legs]} exerciseNames={names} onNew={vi.fn()} />)

    const card = screen.getByRole('link', { name: /legs/i })
    expect(card.getAttribute('href')).toBe('/routines/r-1')
    expect(card.textContent).toMatch(/Squat · Leg curl/)
    expect(card.textContent).toMatch(/2 exercises/)
  })

  it('hides archived routines', () => {
    render(
      <RoutineCards
        routines={[{ ...legs, archived: true }]}
        exerciseNames={names}
        onNew={vi.fn()}
      />,
    )

    expect(screen.queryByRole('link', { name: /legs/i })).toBeNull()
  })

  it('offers making the first routine', async () => {
    const onNew = vi.fn()
    render(<RoutineCards routines={[]} exerciseNames={names} onNew={onNew} />)

    await userEvent.click(screen.getByRole('button', { name: 'Make your first routine' }))

    expect(onNew).toHaveBeenCalledOnce()
  })
})

describe('RoutinePlan', () => {
  const props = { routine: legs, exerciseNames: names, starting: false, startFailed: false }

  it('reads each exercise in order with its sets, reps and rest', () => {
    render(<RoutinePlan {...props} onStart={vi.fn()} onEdit={vi.fn()} onAddExercises={vi.fn()} />)

    const rows = screen.getAllByRole('listitem').map((row) => row.textContent)
    expect(rows[0]).toMatch(/1.*Squat.*4 × 6–8.*rest 3:00/)
    expect(rows[1]).toMatch(/2.*Leg curl.*3 × 12.*rest 1:30/)
  })

  it('starts the routine', async () => {
    const onStart = vi.fn()
    render(<RoutinePlan {...props} onStart={onStart} onEdit={vi.fn()} onAddExercises={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Start Legs' }))

    expect(onStart).toHaveBeenCalledOnce()
  })

  it('says why a start did not go through', () => {
    render(
      <RoutinePlan
        {...props}
        startFailed
        onStart={vi.fn()}
        onEdit={vi.fn()}
        onAddExercises={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('opens editing', async () => {
    const onEdit = vi.fn()
    render(<RoutinePlan {...props} onStart={vi.fn()} onEdit={onEdit} onAddExercises={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledOnce()
  })
})

describe('RoutinePlan without exercises', () => {
  it('offers adding exercises straight away', async () => {
    const onAddExercises = vi.fn()
    render(
      <RoutinePlan
        routine={{ ...legs, entries: [] }}
        exerciseNames={names}
        starting={false}
        startFailed={false}
        onStart={vi.fn()}
        onEdit={vi.fn()}
        onAddExercises={onAddExercises}
      />,
    )

    expect(screen.getByText('No exercises yet.')).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'Add exercises' }))
    expect(onAddExercises).toHaveBeenCalledOnce()
  })
})

describe('RoutineCards up next', () => {
  it('tags the routine that is up next', () => {
    const push = { ...legs, id: 'r-9', name: 'Push day' }
    render(
      <RoutineCards routines={[legs, push]} upNextId="r-9" exerciseNames={names} onNew={vi.fn()} />,
    )

    expect(screen.getByRole('link', { name: /push day/i }).textContent).toMatch(/Up next/)
    expect(screen.getByRole('link', { name: /legs/i }).textContent).not.toMatch(/Up next/)
  })
})

describe("RoutineCards in the user's order", () => {
  const push = { ...legs, id: 'r-2', name: 'Push day' }
  const pull = { ...legs, id: 'r-3', name: 'Pull day' }

  it('moves a routine up or down one place without dragging', async () => {
    const onReorder = vi.fn()
    render(
      <RoutineCards
        routines={[legs, pull, push]}
        exerciseNames={names}
        onNew={vi.fn()}
        onReorder={onReorder}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Move Push day up' }))
    expect(onReorder).toHaveBeenLastCalledWith(['r-1', 'r-2', 'r-3'])

    await userEvent.click(screen.getByRole('button', { name: 'Move Legs down' }))
    expect(onReorder).toHaveBeenLastCalledWith(['r-3', 'r-1', 'r-2'])
  })

  it('cannot move the first routine up or the last one down', () => {
    render(
      <RoutineCards
        routines={[legs, push]}
        exerciseNames={names}
        onNew={vi.fn()}
        onReorder={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Move Legs up' }).hasAttribute('disabled')).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Move Push day down' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('drags only from the handle, so the rest of the row still scrolls and opens', () => {
    render(
      <RoutineCards
        routines={[legs, push]}
        exerciseNames={names}
        onNew={vi.fn()}
        onReorder={vi.fn()}
      />,
    )

    const handle = screen.getByRole('button', { name: 'Drag Legs to reorder' })
    expect(handle.className).toMatch(/touch-none/)
    expect(screen.getByRole('link', { name: /legs/i }).className).not.toMatch(/touch-none/)
  })
})
