/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { HistoryLink } from './history-link.tsx'

afterEach(cleanup)

describe('HistoryLink', () => {
  it('opens History in one tap', () => {
    render(<HistoryLink />)

    expect(screen.getByRole('link', { name: 'Workout history' }).getAttribute('href')).toBe(
      '/statistics/history',
    )
  })
})
