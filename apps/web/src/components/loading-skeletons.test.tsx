/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { HomeSkeleton, ListSkeleton, PlanSkeleton } from './loading-skeletons.tsx'

afterEach(cleanup)

describe('loading skeletons', () => {
  it('draws one placeholder row per expected item, and says what is loading', () => {
    const { container } = render(<ListSkeleton label="Loading your routines" rows={4} />)

    expect(screen.getByRole('status').textContent).toBe('Loading your routines')
    expect(container.querySelectorAll('[data-slot="skeleton-row"]')).toHaveLength(4)
  })

  it('shapes the home screen while it loads', () => {
    render(<HomeSkeleton />)

    expect(screen.getByRole('status').textContent).toBe('Loading your home')
  })

  it('shapes a plan while it loads', () => {
    render(<PlanSkeleton />)

    expect(screen.getByRole('status').textContent).toBe('Loading the plan')
  })
})
