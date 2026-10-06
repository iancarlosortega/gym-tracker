/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useReducer } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { keypadReducer, openKeypad } from '../keypad/keypad.reducer.ts'
import { SetEditor } from './set-editor.tsx'

afterEach(cleanup)

const Harness = ({
  onSave = vi.fn(),
  onDelete = vi.fn(),
}: {
  onSave?: (values: { weight: number | null; reps: number | null }) => void
  onDelete?: () => void
}) => {
  const [state, dispatch] = useReducer(
    keypadReducer,
    openKeypad({ weight: '20', reps: '8' }, 'weight'),
  )
  return (
    <SetEditor
      setNumber={2}
      tile={{ label: 'Weight per side', unit: 'kg', spokenUnit: 'kilograms' }}
      state={state}
      dispatch={dispatch}
      onSave={onSave}
      onDelete={onDelete}
      onClose={vi.fn()}
    />
  )
}

describe('SetEditor', () => {
  it('opens on the values the set was logged with', () => {
    render(<Harness />)

    expect(screen.getByRole('button', { name: 'Weight per side, 20 kilograms' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Reps, 8' })).toBeDefined()
  })

  it('saves what was typed on the keypad', async () => {
    const onSave = vi.fn()
    render(<Harness onSave={onSave} />)

    await userEvent.click(screen.getByRole('button', { name: '2' }))
    await userEvent.click(screen.getByRole('button', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith({ weight: 25, reps: 8 })
  })

  it('deletes the set', async () => {
    const onDelete = vi.fn()
    render(<Harness onDelete={onDelete} />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete set 2' }))

    expect(onDelete).toHaveBeenCalledOnce()
  })
})
