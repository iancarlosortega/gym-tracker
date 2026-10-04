import type { AxiosInstance } from 'axios'
import { apiClient } from '@/lib/api-client'
import type { PushSubscriptionKeys } from './browser-push.subscriber'

export interface PushStateResponse {
  readonly publicKey: string | null
  readonly subscribed: boolean
  readonly invalidated: boolean
}

/* Rest alerts and the devices they go to, as the API sees them. */

export const getPushState = async (
  client: AxiosInstance = apiClient,
): Promise<PushStateResponse> => {
  const { data } = await client.get<PushStateResponse>('/push-subscriptions/state')
  return data
}

export const registerPushSubscription = async (
  subscription: PushSubscriptionKeys,
  client: AxiosInstance = apiClient,
): Promise<void> => {
  await client.post('/push-subscriptions', subscription)
}

/** Booked when rest starts, so the buzz survives the app being closed. */
export const scheduleRestAlert = async (
  setId: string,
  fireAt: Date,
  client: AxiosInstance = apiClient,
): Promise<void> => {
  await client.post('/rest-alerts', { setId, fireAt: fireAt.toISOString() })
}

export const cancelRestAlert = async (
  setId: string,
  client: AxiosInstance = apiClient,
): Promise<void> => {
  await client.delete(`/rest-alerts/${setId}`)
}

/** The push functions as one dependency, for the containers that take them as a prop. */
export const pushApi = {
  readState: () => getPushState(),
  registerSubscription: (subscription: PushSubscriptionKeys) =>
    registerPushSubscription(subscription),
  scheduleRestAlert: (setId: string, fireAt: Date) => scheduleRestAlert(setId, fireAt),
  cancelRestAlert: (setId: string) => cancelRestAlert(setId),
}

export type PushApi = typeof pushApi
