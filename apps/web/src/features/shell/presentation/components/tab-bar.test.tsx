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
    ['/statistics/history', 'progress'],
    ['/statistics/history/0199a1f0', 'progress'],
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

const startMenu = <button type="button">Start a workout</button>

describe('TabBar', () => {
  it('names every area and marks the current one', () => {
    render(<TabBar pathname="/exercises" startMenu={startMenu} />)

    for (const name of ['Home', 'Progress', 'Routines', 'Profile']) {
      expect(screen.getByRole('link', { name })).toBeDefined()
    }
    expect(screen.getByRole('link', { name: 'Routines' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull()
  })
})

describe('TabBar with a workout open', () => {
  it('turns the start button into a way back to the workout', () => {
    render(<TabBar pathname="/" workoutOpen startMenu={startMenu} />)

    expect(screen.queryByRole('button', { name: 'Start a workout' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Back to the workout' }).getAttribute('href')).toBe(
      '/workout',
    )
  })

  it('puts the start menu in the middle when nothing is running', () => {
    render(<TabBar pathname="/" startMenu={startMenu} />)

    const items = screen.getByRole('navigation').children
    expect(items[2]?.textContent).toBe('Start a workout')
  })
})
