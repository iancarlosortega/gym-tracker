import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import type { PushSubscription } from '@gym/domain/push/entities/push-subscription.entity'
import type {
  PushDelivery,
  PushNotification,
  PushSender,
} from '@gym/domain/push/ports/push-sender.port'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import webpush from 'web-push'

/**
 * Delivery through the browser's own push service, signed with VAPID.
 *
 * VAPID is what lets Apple and Google accept a push from this server at all:
 * the keypair identifies the application, and the subject is a contact they
 * can use when something goes wrong. The private key never leaves the box.
 *
 * A 404 or 410 is reported as `gone` rather than as a failure, because it is
 * the one answer that means something permanent — the user uninstalled, or
 * the browser retired the endpoint — and the subscription must be marked
 * invalid so the interface can say alerts have stopped.
 *
 * Without keys configured the sender reports every delivery as failed and
 * says so once at startup. Pocketed alerts are an enhancement; refusing to
 * boot over them would take the foreground timer down with them.
 */
@Injectable()
export class WebPushSender implements PushSender {
  private readonly logger = new Logger(WebPushSender.name)
  private readonly configured: boolean

  constructor(@Inject(ConfigService) config: ConfigService<EnvironmentVariables, true>) {
    // Read through `configured`: ConfigService still sees the raw process
    // environment, where Compose writes an unset variable as an empty string.
    const subject = configured(config.get('VAPID_SUBJECT', { infer: true }))
    const publicKey = configured(config.get('VAPID_PUBLIC_KEY', { infer: true }))
    const privateKey = configured(config.get('VAPID_PRIVATE_KEY', { infer: true }))

    if (subject === undefined || publicKey === undefined || privateKey === undefined) {
      this.configured = false
      this.logger.warn('No VAPID keys configured, so pocketed rest alerts will not be delivered.')
      return
    }

    webpush.setVapidDetails(subject, publicKey, privateKey)
    this.configured = true
  }

  async send(
    subscription: PushSubscription,
    notification: PushNotification,
  ): Promise<PushDelivery> {
    if (!this.configured) {
      return 'failed'
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(notification),
      )

      return 'delivered'
    } catch (failure) {
      return isGone(failure) ? 'gone' : 'failed'
    }
  }
}

/** Absent, blank, or whitespace all mean the same thing: not configured. */
const configured = (value: string | undefined): string | undefined =>
  value === undefined || value.trim() === '' ? undefined : value

const isGone = (failure: unknown): boolean => {
  const status = (failure as { statusCode?: number } | null)?.statusCode

  return status === 404 || status === 410
}
