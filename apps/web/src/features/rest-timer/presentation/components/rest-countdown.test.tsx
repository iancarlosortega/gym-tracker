/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RestCountdown } from './rest-countdown.tsx'

const props = {
  remainingSeconds: 123,
  totalSeconds: 180,
  exerciseName: 'Bench press',
  lastSet: '60 kg for 8 reps',
}

afterEach(cleanup)

describe('RestCountdown', () => {
  it('reads the remaining time as minutes and seconds', () => {
    render(<RestCountdown {...props} onAdjust={vi.fn()} onSkip={vi.fn()} />)

    expect(screen.getByRole('status').textContent).toContain('2:03')
  })

  it('pads the seconds, so 2:03 never reads as 2:3', () => {
    render(<RestCountdown {...props} remainingSeconds={63} onAdjust={vi.fn()} onSkip={vi.fn()} />)

    expect(screen.getByRole('status').textContent).toContain('1:03')
  })

  it('says what is being rested from', () => {
    render(<RestCountdown {...props} onAdjust={vi.fn()} onSkip={vi.fn()} />)

    expect(screen.getByText('Resting after Bench press')).toBeDefined()
    expect(screen.getByText('60 kg for 8 reps')).toBeDefined()
  })

  it('adjusts in both directions, and each button says which', async () => {
    const onAdjust = vi.fn()
    render(<RestCountdown {...props} onAdjust={onAdjust} onSkip={vi.fn()} />)

    // Both read "30s" on screen; only the label tells them apart aloud.
    await userEvent.click(screen.getByRole('button', { name: 'Rest thirty seconds more' }))
    await userEvent.click(screen.getByRole('button', { name: 'Rest thirty seconds less' }))

    expect(onAdjust).toHaveBeenNthCalledWith(1, 30)
    expect(onAdjust).toHaveBeenNthCalledWith(2, -30)
  })

  it('skips the rest when asked', async () => {
    const onSkip = vi.fn()
    render(<RestCountdown {...props} onAdjust={vi.fn()} onSkip={onSkip} />)

    await userEvent.click(screen.getByRole('button', { name: 'Skip rest' }))

    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('shows a finished rest as zero rather than a negative number', () => {
    render(<RestCountdown {...props} remainingSeconds={0} onAdjust={vi.fn()} onSkip={vi.fn()} />)

    expect(screen.getByRole('status').textContent).toContain('0:00')
  })
})
