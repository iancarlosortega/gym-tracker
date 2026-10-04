/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useReducer } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { keypadReducer, openKeypad } from './keypad.reducer.ts'
import { SetKeypad, ValueTile } from './set-keypad.tsx'

afterEach(cleanup)

describe('ValueTile', () => {
  it('is a button that says its name and value', async () => {
    const onPress = vi.fn()
    render(
      <ValueTile
        label="Weight per side"
        value="22.5"
        unit="kg"
        spokenUnit="kilograms"
        pressed
        onPress={onPress}
      />,
    )

    const tile = screen.getByRole('button', { name: 'Weight per side, 22.5 kilograms' })
    expect(tile.getAttribute('aria-pressed')).toBe('true')

    await userEvent.click(tile)
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('says when nothing is entered yet', () => {
    render(<ValueTile label="Reps" value="" pressed={false} onPress={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Reps, not entered' })).toBeDefined()
  })
})

const Harness = ({
  onLog = vi.fn(),
  onClose = vi.fn(),
  last = { weight: 20, reps: 7 } as { weight: number; reps: number } | null,
}) => {
  const [state, dispatch] = useReducer(
    keypadReducer,
    openKeypad({ weight: '20', reps: '8' }, 'weight'),
  )
  return (
    <SetKeypad
      state={state}
      dispatch={dispatch}
      setNumber={2}
      weightLabel="weight per side"
      last={last}
      onLog={onLog}
      onClose={onClose}
    />
  )
}

describe('SetKeypad', () => {
  it('never renders an input, so the device keyboard cannot open', () => {
    const { container } = render(<Harness />)

    expect(container.querySelector('input, textarea')).toBeNull()
  })

  it('announces the edited value: 2, 2, .5 reads 22.5', async () => {
    render(<Harness />)

    for (const key of ['2', '2', 'Decimal point', '5']) {
      await userEvent.click(screen.getByRole('button', { name: key }))
    }

    expect(screen.getByRole('status').textContent).toBe('Weight per side 22.5')
  })

  it('fills from last time, steps, and switches to reps', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Same as last' }))
    await userEvent.click(screen.getByRole('button', { name: '+2.5' }))
    expect(screen.getByRole('status').textContent).toBe('Weight per side 22.5')

    await userEvent.click(screen.getByRole('button', { name: 'Reps ›' }))
    expect(screen.getByRole('status').textContent).toBe('Reps 7')
  })

  it('cannot copy last time when there was none', () => {
    render(<Harness last={null} />)

    expect(screen.getByRole('button', { name: 'Same as last' }).hasAttribute('disabled')).toBe(true)
  })

  it('logs the set and closes', async () => {
    const onLog = vi.fn()
    const onClose = vi.fn()
    render(<Harness onLog={onLog} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByRole('button', { name: 'Log set 2' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onLog).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
