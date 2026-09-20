export interface PushSubscriptionKeys {
  readonly endpoint: string
  readonly p256dh: string
  readonly auth: string
}

/**
 * The browser's own push machinery.
 *
 * The application server key has to be sent as bytes rather than the base64
 * the server serves, so it is decoded here — the one piece of this that is
 * neither the server's business nor the use case's.
 */
export class PushSubscriber {
  async requestPermission(): Promise<NotificationPermission> {
    return await Notification.requestPermission()
  }

  async subscribe(publicKey: string): Promise<PushSubscriptionKeys> {
    const registration = await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      // Every browser that delivers push requires this; none allows silent pushes.
      userVisibleOnly: true,
      applicationServerKey: decodeBase64Url(publicKey),
    })

    const json = subscription.toJSON()

    return {
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    }
  }
}

const decodeBase64Url = (value: string): ArrayBuffer => {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=')
  const binary = atob(padded.replaceAll('-', '+').replaceAll('_', '/'))

  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer
}
