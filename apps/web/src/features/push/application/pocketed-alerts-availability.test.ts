import { describe, expect, it } from 'vitest'
import { pocketedAlertsAvailability } from './pocketed-alerts-availability.ts'

const working = {
  supported: true,
  installed: true,
  permission: 'granted' as NotificationPermission,
  publicKey: 'a-vapid-public-key',
  subscribed: true,
  invalidated: false,
}

describe('whether pocketed alerts can be promised', () => {
  it('is enabled when every part is in place', () => {
    expect(pocketedAlertsAvailability(working).status).toBe('enabled')
  })

  it('is ready to offer when nothing is subscribed yet', () => {
    expect(pocketedAlertsAvailability({ ...working, subscribed: false }).status).toBe('ready')
  })

  it('reports an expired subscription rather than claiming it works', () => {
    const availability = pocketedAlertsAvailability({
      ...working,
      subscribed: false,
      invalidated: true,
    })

    expect(availability.status).toBe('subscription-invalid')
  })

  it('asks for installation before it asks for permission', () => {
    // iOS cannot even be asked in a tab: prompting there teaches the user
    // the feature is broken rather than that it needs installing.
    const availability = pocketedAlertsAvailability({
      ...working,
      installed: false,
      permission: 'default',
    })

    expect(availability.status).toBe('not-installed')
  })

  it('reports blocked notifications on an installed app', () => {
    expect(pocketedAlertsAvailability({ ...working, permission: 'denied' }).status).toBe(
      'permission-denied',
    )
  })

  it('is unavailable when the browser cannot do push at all', () => {
    expect(pocketedAlertsAvailability({ ...working, supported: false }).status).toBe('unavailable')
  })

  it('is unavailable when the server has no keys to subscribe with', () => {
    expect(pocketedAlertsAvailability({ ...working, publicKey: null }).status).toBe('unavailable')
  })

  it('prefers the unsupported answer over asking for an install', () => {
    const availability = pocketedAlertsAvailability({
      ...working,
      supported: false,
      installed: false,
    })

    expect(availability.status).toBe('unavailable')
  })
})
