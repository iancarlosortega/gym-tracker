/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NewEquipmentForm } from './new-equipment-form.tsx'

afterEach(cleanup)

const props = { pending: false, failed: false }

describe('NewEquipmentForm', () => {
  it('creates a barbell with its bar weight', async () => {
    const onSubmit = vi.fn()
    render(<NewEquipmentForm {...props} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Olympic bar')
    await userEvent.click(screen.getByRole('radio', { name: /barbell/i }))
    await userEvent.type(screen.getByLabelText('Bar weight (kg)'), '20')
    await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Olympic bar',
      kind: 'BARBELL',
      barKilograms: 20,
    })
  })

  it('creates a weight stack with its positions', async () => {
    const onSubmit = vi.fn()
    render(<NewEquipmentForm {...props} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Leg press')
    await userEvent.click(screen.getByRole('radio', { name: /weight stack/i }))
    await userEvent.type(screen.getByLabelText('Positions'), '20')
    await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Leg press', kind: 'STACK', stackPositions: 20 })
  })

  it('creates free weights with nothing else to say', async () => {
    const onSubmit = vi.fn()
    render(<NewEquipmentForm {...props} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Dumbbells')
    await userEvent.click(screen.getByRole('radio', { name: /free weights/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Dumbbells', kind: 'FREE_WEIGHT' })
  })

  it('refuses a barbell without its bar weight', async () => {
    const onSubmit = vi.fn()
    render(<NewEquipmentForm {...props} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Mystery bar')
    await userEvent.click(screen.getByRole('radio', { name: /barbell/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Enter what the bar weighs.')).toBeDefined()
  })

  it('offers only the kinds that fit, starting on the first', () => {
    render(<NewEquipmentForm {...props} kinds={['STACK']} onSubmit={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(1)
    expect((screen.getByRole('radio', { name: /weight stack/i }) as HTMLInputElement).checked).toBe(
      true,
    )
  })
})
