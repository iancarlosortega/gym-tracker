/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { activeTab, TabBar } from './tab-bar.tsx'

afterEach(cleanup)

describe('activeTab', () => {
  it.each([
    ['/', 'home'],
    ['/statistics', 'progress'],
    ['/statistics/0199a1f0', 'progress'],
    ['/routines', 'routines'],
    ['/routines/0199a1f0', 'routines'],
    ['/exercises', 'routines'],
    ['/equipment/0199a1f0', 'routines'],
    ['/profile', 'profile'],
  ])('marks %s as %s', (pathname, tab) => {
    expect(activeTab(pathname)).toBe(tab)
  })

  it('marks nothing for a screen outside the tabs', () => {
    expect(activeTab('/sign-in')).toBeNull()
  })
})

describe('TabBar', () => {
  it('names every area and marks the current one', () => {
    render(<TabBar pathname="/exercises" />)

    for (const name of ['Home', 'Progress', 'Routines', 'Profile']) {
      expect(screen.getByRole('link', { name })).toBeDefined()
    }
    expect(screen.getByRole('link', { name: 'Routines' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull()
  })

  it('offers to start a workout from the middle of the bar', () => {
    render(<TabBar pathname="/" />)

    expect(screen.getByRole('link', { name: 'Start a workout' }).getAttribute('href')).toBe(
      '/workout',
    )
  })
})

describe('TabBar with a workout open', () => {
  it('turns the start button into a way back to the workout', () => {
    render(<TabBar pathname="/" workoutOpen />)

    expect(screen.queryByRole('link', { name: 'Start a workout' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Back to the workout' }).getAttribute('href')).toBe(
      '/workout',
    )
  })
})
