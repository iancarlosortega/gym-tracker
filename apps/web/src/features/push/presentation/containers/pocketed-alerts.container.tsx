'use client'

import { useCallback, useEffect, useState } from 'react'
import type { EnablePocketedAlertsUseCase } from '../../application/enable-pocketed-alerts.use-case'
import {
  type PocketedAlertsAvailability,
  pocketedAlertsAvailability,
} from '../../application/pocketed-alerts-availability'
import type { PushApi } from '../../infrastructure/push.api'
import { PocketedAlertsNotice } from '../components/pocketed-alerts-notice'

export interface PocketedAlertsContainerProps {
  readonly gateway: PushApi
  readonly enableAlerts: EnablePocketedAlertsUseCase
}

/**
 * Asks the server and the browser what is true, then says so.
 *
 * Both halves are needed: the server knows whether a subscription still works
 * and whether it has keys at all, the browser knows whether this is an
 * installed app with permission. Neither can answer alone.
 */
export const PocketedAlertsContainer = ({
  gateway,
  enableAlerts,
}: PocketedAlertsContainerProps) => {
  const [availability, setAvailability] = useState<PocketedAlertsAvailability | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const state = await gateway.readState()
      setPublicKey(state.publicKey)

      setAvailability(
        pocketedAlertsAvailability({
          supported: 'serviceWorker' in navigator && 'PushManager' in globalThis,
          installed: globalThis.matchMedia?.('(display-mode: standalone)').matches === true,
          permission: globalThis.Notification?.permission ?? 'denied',
          publicKey: state.publicKey,
          subscribed: state.subscribed,
          invalidated: state.invalidated,
        }),
      )
    } catch {
      // The server is unreachable; the foreground countdown is unaffected and
      // claiming anything about pocketed alerts here would be a guess.
      setAvailability({ status: 'unavailable' })
    }
  }, [gateway])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (availability === null || availability.status === 'unavailable') {
    return null
  }

  return (
    <PocketedAlertsNotice
      availability={availability}
      busy={busy}
      onEnable={() => {
        if (publicKey === null) {
          return
        }

        setBusy(true)
        void enableAlerts
          .execute(publicKey)
          .then(() => refresh())
          .finally(() => setBusy(false))
      }}
    />
  )
}
