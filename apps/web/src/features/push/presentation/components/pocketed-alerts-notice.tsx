import { BellOff, BellRing, Share, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { PocketedAlertsAvailability } from '../../application/pocketed-alerts-availability'

export interface PocketedAlertsNoticeProps {
  readonly availability: PocketedAlertsAvailability
  readonly busy?: boolean
  readonly onEnable: () => void
}

/**
 * Says whether a buzz will arrive with the phone in a pocket — and, when it
 * will not, exactly why.
 *
 * The spec is written against silent failure: a user who believes alerts are
 * on and is never buzzed has no way to discover the difference. Each reason
 * here names the one thing that would fix it.
 */
export const PocketedAlertsNotice = ({
  availability,
  busy,
  onEnable,
}: PocketedAlertsNoticeProps) => {
  if (availability.status === 'enabled') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellRing className="size-4" />
        Rest alerts will reach you with the phone pocketed.
      </p>
    )
  }

  if (availability.status === 'ready') {
    return (
      <Card>
        <CardContent className="grid gap-2">
          <strong className="flex items-center gap-2">
            <BellRing className="size-4" />
            Get buzzed when rest ends
          </strong>
          <span className="text-sm text-muted-foreground">
            Without this, the countdown only alerts you while the app is open.
          </span>
          <Button className="justify-self-start" disabled={busy === true} onClick={onEnable}>
            Turn on rest alerts
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-destructive">
      <CardContent className="grid gap-2">
        <strong className="flex items-center gap-2 text-destructive">
          {availability.status === 'not-installed' ? (
            <Share className="size-4" />
          ) : (
            <TriangleAlert className="size-4" />
          )}
          {headline(availability.status)}
        </strong>
        <span className="text-sm text-muted-foreground">{explanation(availability.status)}</span>
        {availability.status === 'subscription-invalid' && (
          <Button
            className="justify-self-start"
            variant="outline"
            disabled={busy === true}
            onClick={onEnable}
          >
            <BellOff className="size-4" />
            Re-enable alerts
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

const headline = (status: PocketedAlertsAvailability['status']): string => {
  switch (status) {
    case 'not-installed':
      return 'Pocketed alerts need the app installed'
    case 'permission-denied':
      return 'Notifications are blocked'
    case 'subscription-invalid':
      return 'Rest alerts have stopped working'
    default:
      return 'Pocketed alerts are unavailable'
  }
}

const explanation = (status: PocketedAlertsAvailability['status']): string => {
  switch (status) {
    case 'not-installed':
      return 'Tap Share, then Add to Home Screen. iOS only delivers notifications to an installed app. The countdown still works here.'
    case 'permission-denied':
      return 'Allow notifications for this app in your device settings, then come back. The countdown still works without them.'
    case 'subscription-invalid':
      return 'Your device stopped accepting them, so nothing has been arriving. Turning them on again fixes it.'
    default:
      return 'This browser or this server cannot deliver them. The countdown still works while the app is open.'
  }
}
