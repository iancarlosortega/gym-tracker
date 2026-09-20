/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PocketedAlertsNotice } from './pocketed-alerts-notice.tsx'

afterEach(cleanup)

describe('PocketedAlertsNotice', () => {
  it('says alerts are working when they are', () => {
    render(<PocketedAlertsNotice availability={{ status: 'enabled' }} onEnable={vi.fn()} />)

    expect(screen.getByText(/pocketed/i)).toBeDefined()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('names installation as the fix on a browser tab', () => {
    render(<PocketedAlertsNotice availability={{ status: 'not-installed' }} onEnable={vi.fn()} />)

    expect(screen.getByText('Pocketed alerts need the app installed')).toBeDefined()
    expect(screen.getByText(/Add to Home Screen/)).toBeDefined()
  })

  it('tells the user their alerts stopped, and offers the fix', () => {
    render(
      <PocketedAlertsNotice availability={{ status: 'subscription-invalid' }} onEnable={vi.fn()} />,
    )

    expect(screen.getByText('Rest alerts have stopped working')).toBeDefined()
    expect(screen.getByRole('button', { name: /Re-enable/ })).toBeDefined()
  })

  it('does not offer a prompt that would be refused when notifications are blocked', () => {
    render(
      <PocketedAlertsNotice availability={{ status: 'permission-denied' }} onEnable={vi.fn()} />,
    )

    expect(screen.getByText('Notifications are blocked')).toBeDefined()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('always says the countdown still works', () => {
    render(<PocketedAlertsNotice availability={{ status: 'not-installed' }} onEnable={vi.fn()} />)

    expect(screen.getByText(/countdown still works/)).toBeDefined()
  })
})
