/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  pickableRoutines,
  RoutinePicker,
  RoutineStartChoices,
  SEARCH_FROM,
  type StartableRoutine,
  StartMenu,
} from './start-sheets.tsx'

afterEach(cleanup)

const now = new Date('2026-10-04T10:00:00Z') // a Sunday

const routine = (
  id: string,
  name: string,
  exercises = 3,
  lastDoneAt: string | null = null,
): StartableRoutine => ({
  id,
  name,
  lastDoneAt,
  entries: Array.from({ length: exercises }, (_, index) => ({ id: `${id}-e${index}` })),
})

const push = routine('r-1', 'Push day', 6, '2026-09-28T08:00:00Z')
const legs = routine('r-2', 'Legs', 1)

const many = (count: number) =>
  Array.from({ length: count }, (_, index) => routine(`m-${index}`, `Routine ${index}`))

describe('RoutineStartChoices', () => {
  it('starts the routine or shows its plan', async () => {
    const onStart = vi.fn()
    render(<RoutineStartChoices routine={legs} starting={false} onStart={onStart} />)

    await userEvent.click(screen.getByRole('button', { name: 'Start Legs' }))

    expect(onStart).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'See the plan' }).getAttribute('href')).toBe(
      '/routines/r-2',
    )
  })
})

describe('pickableRoutines', () => {
  const upper = routine('r-3', 'Upper body')

  it('puts the routine up next first and keeps the rest in order', () => {
    expect(pickableRoutines([push, upper, legs], 'r-2', '').map((r) => r.id)).toEqual([
      'r-2',
      'r-1',
      'r-3',
    ])
  })

  it('matches names ignoring case and surrounding spaces', () => {
    expect(pickableRoutines([push, upper, legs], null, '  UP ').map((r) => r.id)).toEqual(['r-3'])
  })

  it('finds nothing when no name matches', () => {
    expect(pickableRoutines([push, legs], null, 'arms')).toEqual([])
  })
})

describe('StartMenu', () => {
  it('starts the routine up next directly, or another, or an empty workout', async () => {
    const handlers = { onStartUpNext: vi.fn(), onPickAnother: vi.fn(), onStartEmpty: vi.fn() }
    render(<StartMenu upNext={push} starting={false} {...handlers} />)

    await userEvent.click(screen.getByRole('button', { name: /Start Push day/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Pick another routine' }))
    await userEvent.click(screen.getByRole('button', { name: 'Empty workout' }))

    expect(handlers.onStartUpNext).toHaveBeenCalledOnce()
    expect(handlers.onPickAnother).toHaveBeenCalledOnce()
    expect(handlers.onStartEmpty).toHaveBeenCalledOnce()
  })

  it('says the start is up next and how many exercises it has', () => {
    const { rerender } = render(
      <StartMenu
        upNext={push}
        starting={false}
        onStartUpNext={vi.fn()}
        onPickAnother={vi.fn()}
        onStartEmpty={vi.fn()}
      />,
    )
    expect(screen.getByText('Up next · 6 exercises')).toBeDefined()

    rerender(
      <StartMenu
        upNext={legs}
        starting={false}
        onStartUpNext={vi.fn()}
        onPickAnother={vi.fn()}
        onStartEmpty={vi.fn()}
      />,
    )
    expect(screen.getByText('Up next · 1 exercise')).toBeDefined()
  })

  it('offers only an empty workout without routines', () => {
    render(
      <StartMenu
        upNext={null}
        starting={false}
        onStartUpNext={vi.fn()}
        onPickAnother={vi.fn()}
        onStartEmpty={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /pick another/i })).toBeNull()
    expect(screen.getByRole('button', { name: 'Empty workout' })).toBeDefined()
  })
})

describe('RoutinePicker', () => {
  const props = {
    upNextId: 'r-2',
    starting: false,
    now,
    onStart: vi.fn(),
    onBack: vi.fn(),
  }

  it('lists the routine up next first and tagged, and starts on tap', async () => {
    const onStart = vi.fn()
    render(<RoutinePicker {...props} routines={[push, legs]} onStart={onStart} />)

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]?.textContent).toMatch(/Legs.*Up next/)

    await userEvent.click(screen.getByRole('button', { name: /push day/i }))

    expect(onStart).toHaveBeenCalledWith('r-1')
  })

  it('shows how many exercises each routine has and when it was last done', () => {
    render(<RoutinePicker {...props} routines={[push, legs]} />)

    expect(screen.getByText('6 exercises · Last done Monday')).toBeDefined()
    expect(screen.getByText('1 exercise · Never done')).toBeDefined()
  })

  it('goes back to the menu', async () => {
    const onBack = vi.fn()
    render(<RoutinePicker {...props} routines={[push]} onBack={onBack} />)

    await userEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(onBack).toHaveBeenCalledOnce()
  })

  it('offers no search for a short list', () => {
    render(<RoutinePicker {...props} routines={many(SEARCH_FROM - 1)} />)

    expect(screen.queryByRole('searchbox')).toBeNull()
  })

  it('filters a long list by name, and says when nothing matches', async () => {
    render(<RoutinePicker {...props} routines={[...many(SEARCH_FROM - 1), push]} />)

    const search = screen.getByRole('searchbox', { name: 'Find a routine' })
    expect(document.activeElement).not.toBe(search)

    await userEvent.type(search, 'push')
    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    await userEvent.clear(search)
    await userEvent.type(search, 'arms')
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText('No routine matches that.')).toBeDefined()
  })

  it('links to managing routines', async () => {
    const onManage = vi.fn()
    render(<RoutinePicker {...props} routines={[push]} onManage={onManage} />)

    const link = screen.getByRole('link', { name: 'Manage routines' })
    expect(link.getAttribute('href')).toBe('/routines')
  })
})
