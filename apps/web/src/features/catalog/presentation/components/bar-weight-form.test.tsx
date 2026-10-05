/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BarWeightForm } from './bar-weight-form.tsx'

afterEach(cleanup)

const props = { unit: 'KG' as const, pending: false, failed: false }

describe('BarWeightForm', () => {
  it('starts from the bar weight there is', () => {
    render(<BarWeightForm {...props} barKilograms={20} onSave={vi.fn()} />)

    expect((screen.getByLabelText('Bar or sled weight (kg)') as HTMLInputElement).value).toBe('20')
  })

  it('saves a new bar weight in kilograms', async () => {
    const onSave = vi.fn()
    render(<BarWeightForm {...props} barKilograms={20} onSave={onSave} />)

    await userEvent.clear(screen.getByLabelText('Bar or sled weight (kg)'))
    await userEvent.type(screen.getByLabelText('Bar or sled weight (kg)'), '15')
    await userEvent.click(screen.getByRole('button', { name: 'Save and review history' }))

    expect(onSave).toHaveBeenCalledWith(15)
  })

  it('stops counting the bar when left empty', async () => {
    const onSave = vi.fn()
    render(<BarWeightForm {...props} barKilograms={15} onSave={onSave} />)

    await userEvent.clear(screen.getByLabelText('Bar or sled weight (kg)'))
    await userEvent.click(screen.getByRole('button', { name: 'Save and review history' }))

    expect(onSave).toHaveBeenCalledWith(null)
  })

  it('works in pounds', async () => {
    const onSave = vi.fn()
    render(<BarWeightForm {...props} unit="LB" barKilograms={null} onSave={onSave} />)

    await userEvent.type(screen.getByLabelText('Bar or sled weight (lb)'), '45')
    await userEvent.click(screen.getByRole('button', { name: 'Save and review history' }))

    expect(onSave.mock.calls[0]?.[0]).toBeCloseTo(20.41, 2)
  })
})
