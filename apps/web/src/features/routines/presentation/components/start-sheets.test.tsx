/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RoutinePicker, RoutineStartChoices, StartMenu } from './start-sheets.tsx'

afterEach(cleanup)

const legs = { id: 'r-2', name: 'Legs' }
const push = { id: 'r-1', name: 'Push day' }

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

describe('StartMenu', () => {
  it('starts the routine up next directly, or another, or an empty workout', async () => {
    const handlers = { onStartUpNext: vi.fn(), onPickAnother: vi.fn(), onStartEmpty: vi.fn() }
    render(<StartMenu upNext={legs} starting={false} {...handlers} />)

    await userEvent.click(screen.getByRole('button', { name: 'Start Legs' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pick a different routine' }))
    await userEvent.click(screen.getByRole('button', { name: 'Empty workout' }))

    expect(handlers.onStartUpNext).toHaveBeenCalledOnce()
    expect(handlers.onPickAnother).toHaveBeenCalledOnce()
    expect(handlers.onStartEmpty).toHaveBeenCalledOnce()
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

    expect(screen.queryByRole('button', { name: /pick a different/i })).toBeNull()
    expect(screen.getByRole('button', { name: 'Empty workout' })).toBeDefined()
  })
})

describe('RoutinePicker', () => {
  it('lists the routine up next first and tagged, and starts on tap', async () => {
    const onStart = vi.fn()
    render(
      <RoutinePicker routines={[push, legs]} upNextId="r-2" starting={false} onStart={onStart} />,
    )

    const rows = screen.getAllByRole('button')
    expect(rows[0]?.textContent).toMatch(/Legs.*Up next/)

    await userEvent.click(screen.getByRole('button', { name: /push day/i }))

    expect(onStart).toHaveBeenCalledWith('r-1')
  })
})
