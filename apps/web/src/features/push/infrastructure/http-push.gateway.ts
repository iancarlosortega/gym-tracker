import { sessionAwareFetch } from '../../auth/infrastructure/session-aware-fetch'
import type { PushSubscriptionKeys } from './browser-push.subscriber'

export interface PushStateResponse {
  readonly publicKey: string | null
  readonly subscribed: boolean
  readonly invalidated: boolean
}

/** Rest alerts and the devices they go to, as the API sees them. */
export class HttpPushGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: typeof fetch = sessionAwareFetch,
  ) {}

  async readState(): Promise<PushStateResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/push-subscriptions/state`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`The server answered ${response.status}.`)
    }
    return (await response.json()) as PushStateResponse
  }

  async registerSubscription(subscription: PushSubscriptionKeys): Promise<void> {
    await this.send('/push-subscriptions', 'POST', subscription)
  }

  /** Booked when rest starts, so the buzz survives the app being closed. */
  async scheduleRestAlert(setId: string, fireAt: Date): Promise<void> {
    await this.send('/rest-alerts', 'POST', { setId, fireAt: fireAt.toISOString() })
  }

  async cancelRestAlert(setId: string): Promise<void> {
    await this.send(`/rest-alerts/${setId}`, 'DELETE')
  }

  private async send(path: string, method: string, body?: unknown): Promise<void> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      credentials: 'include',
      ...(body === undefined
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    })

    if (!response.ok) {
      throw new Error(`The server answered ${response.status}.`)
    }
  }
}
