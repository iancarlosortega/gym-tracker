/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LastTimeCard } from './last-time-card.tsx'

afterEach(cleanup)

describe('LastTimeCard', () => {
  it('reads the same set from last time', () => {
    render(
      <LastTimeCard
        state={{ kind: 'value', set: { setNumber: 2, mode: 'PER_SIDE', value: 20, reps: 7 } }}
      />,
    )

    expect(screen.getByText('Last time · set 2')).toBeDefined()
    expect(screen.getByText('20 kg/side × 7')).toBeDefined()
  })

  it('reads a pin as a position', () => {
    render(
      <LastTimeCard
        state={{ kind: 'value', set: { setNumber: 1, mode: 'STACK_POSITION', value: 7, reps: 12 } }}
      />,
    )

    expect(screen.getByText('Pin 7 × 12')).toBeDefined()
  })

  it('says there was no set 4 last time', () => {
    render(<LastTimeCard state={{ kind: 'no-set', setNumber: 4 }} />)

    expect(screen.getByText('No set 4 last time')).toBeDefined()
  })

  it('says when there is no previous workout', () => {
    render(<LastTimeCard state={{ kind: 'none' }} />)

    expect(screen.getByText('First time doing this one')).toBeDefined()
  })

  it('stays in place offline', () => {
    render(<LastTimeCard state={{ kind: 'offline' }} />)

    expect(screen.getByText('Offline · last time unavailable')).toBeDefined()
  })
})
