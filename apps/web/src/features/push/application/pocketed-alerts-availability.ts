/**
 * Why pocketed alerts can or cannot be promised.
 *
 * Each reason is a different sentence to the user and a different thing to
 * do about it, which is why this is a union rather than a boolean. "Alerts
 * are off" with no reason is the failure the spec is written against.
 */
export type PocketedAlertsAvailability =
  | { readonly status: 'ready' }
  /** Subscribed and working; nothing to offer. */
  | { readonly status: 'enabled' }
  /** iOS only delivers push to an installed app. */
  | { readonly status: 'not-installed' }
  | { readonly status: 'permission-denied' }
  /** The push service retired every device this user registered. */
  | { readonly status: 'subscription-invalid' }
  /** No VAPID keys on the server, or no push support in this browser. */
  | { readonly status: 'unavailable' }

export interface AvailabilityInput {
  readonly supported: boolean
  readonly installed: boolean
  readonly permission: NotificationPermission
  readonly publicKey: string | null
  readonly subscribed: boolean
  readonly invalidated: boolean
}

/**
 * The order matters.
 *
 * Installation is checked before permission because on iOS a browser tab
 * cannot even be asked: offering a permission prompt there teaches the user
 * that the feature is broken rather than that it needs installing.
 */
export const pocketedAlertsAvailability = (
  input: AvailabilityInput,
): PocketedAlertsAvailability => {
  if (!input.supported || input.publicKey === null) {
    return { status: 'unavailable' }
  }

  if (!input.installed) {
    return { status: 'not-installed' }
  }

  if (input.permission === 'denied') {
    return { status: 'permission-denied' }
  }

  if (input.invalidated) {
    return { status: 'subscription-invalid' }
  }

  return input.subscribed ? { status: 'enabled' } : { status: 'ready' }
}
