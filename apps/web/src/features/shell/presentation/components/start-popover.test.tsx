/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StartPopover, type StartPopoverProps } from './start-popover.tsx'

afterEach(cleanup)

const routine = (id: string, name: string) => ({
  id,
  name,
  lastDoneAt: null,
  entries: [{ id: `${id}-e` }],
})

const legs = routine('r-2', 'Legs')
const push = routine('r-1', 'Push day')

const renderPopover = (overrides: Partial<StartPopoverProps> = {}) => {
  const props: StartPopoverProps = {
    upNext: legs,
    routines: [push, legs],
    starting: false,
    failed: false,
    now: new Date('2026-10-04T10:00:00Z'),
    onStart: vi.fn(),
    ...overrides,
  }
  render(<StartPopover {...props} />)
  return props
}

const open = () => userEvent.click(screen.getByRole('button', { name: 'Start a workout' }))

describe('StartPopover', () => {
  it('opens the start choices from the button', async () => {
    renderPopover()

    expect(screen.queryByRole('button', { name: 'Empty workout' })).toBeNull()
    await open()

    expect(screen.getByRole('button', { name: /Start Legs/ })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Pick another routine' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Empty workout' })).toBeDefined()
    expect(
      screen.getByRole('button', { name: 'Start a workout' }).getAttribute('aria-expanded'),
    ).toBe('true')
  })

  it('starts the routine up next, or an empty workout, and closes', async () => {
    const { onStart } = renderPopover()

    await open()
    await userEvent.click(screen.getByRole('button', { name: /Start Legs/ }))
    expect(onStart).toHaveBeenLastCalledWith('r-2')
    await waitFor(() => expect(screen.queryByRole('button', { name: /Start Legs/ })).toBeNull())

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Empty workout' }))
    expect(onStart).toHaveBeenLastCalledWith(undefined)
  })

  it('picks another routine in place and can go back', async () => {
    const { onStart } = renderPopover()

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Pick another routine' }))
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    await userEvent.click(screen.getByRole('button', { name: 'Pick another routine' }))
    await userEvent.click(screen.getByRole('button', { name: /Push day/ }))

    expect(onStart).toHaveBeenCalledWith('r-1')
  })

  it('opens on the menu again after closing from the picker', async () => {
    renderPopover()

    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Pick another routine' }))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Back' })).toBeNull())
    await open()

    expect(screen.getByRole('button', { name: 'Pick another routine' })).toBeDefined()
  })

  it('closes on Escape without starting', async () => {
    const { onStart } = renderPopover()

    await open()
    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Empty workout' })).toBeNull())
    expect(onStart).not.toHaveBeenCalled()
  })

  it('says when a start failed', async () => {
    renderPopover({ failed: true })

    await open()

    expect(screen.getByRole('alert').textContent).toBe(
      "Could not start it. Try again once you're online.",
    )
  })
})
