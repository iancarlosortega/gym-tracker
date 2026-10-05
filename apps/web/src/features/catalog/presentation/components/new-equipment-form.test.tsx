/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NewEquipmentForm } from './new-equipment-form.tsx'

afterEach(cleanup)

const props = { pending: false, failed: false }

describe('NewEquipmentForm', () => {
  it('creates plate-loaded equipment with its bar weight', async () => {
    const onSubmit = vi.fn()
    render(<NewEquipmentForm {...props} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Olympic bar')
    await userEvent.click(screen.getByRole('radio', { name: /plate-loaded/i }))
    await userEvent.type(screen.getByLabelText('Bar or sled weight (kg)'), '20')
    await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Olympic bar',
      kind: 'BARBELL',
      barKilograms: 20,
    })
  })

  it('leaves the bar out when it is not counted, like a Smith', async () => {
    const onSubmit = vi.fn()
    render(<NewEquipmentForm {...props} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Smith machine')
    await userEvent.click(screen.getByRole('radio', { name: /plate-loaded/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }))

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Smith machine', kind: 'BARBELL' })
  })

  it('takes the bar weight in pounds when the user weighs in pounds', async () => {
    const onSubmit = vi.fn()
    render(<NewEquipmentForm {...props} unit="LB" onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Olympic bar')
    await userEvent.click(screen.getByRole('radio', { name: /plate-loaded/i }))
    await userEvent.type(screen.getByLabelText('Bar or sled weight (lb)'), '45')
    await userEvent.click(screen.getByRole('button', { name: 'Add equipment' }))

    expect(onSubmit.mock.calls[0]?.[0].barKilograms).toBeCloseTo(20.41, 2)
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

  it('offers only the kinds that fit, starting on the first', () => {
    render(<NewEquipmentForm {...props} kinds={['STACK']} onSubmit={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(1)
    expect((screen.getByRole('radio', { name: /weight stack/i }) as HTMLInputElement).checked).toBe(
      true,
    )
  })
})
