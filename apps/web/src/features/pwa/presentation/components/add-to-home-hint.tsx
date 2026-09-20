import { Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface AddToHomeHintProps {
  readonly onDismiss: () => void
}

/**
 * Teaches the install gesture, because iOS will not.
 *
 * There is no `beforeinstallprompt` on iOS and no button we can offer, so
 * the only way onto the home screen is the user knowing the Share sheet
 * holds it. Rest alerts need the installed app, which is why this hint is
 * worth the space it takes.
 */
export const AddToHomeHint = ({ onDismiss }: AddToHomeHintProps) => (
  <Card className="border-dashed">
    <CardContent className="grid gap-2">
      <strong className="flex items-center gap-2">
        <Share className="size-4" />
        Add Gym Tracker to your home screen
      </strong>
      <span className="text-sm text-muted-foreground">
        Tap Share, then <em>Add to Home Screen</em>. Rest alerts can only reach you once the app is
        installed.
      </span>
      <Button className="justify-self-start" variant="outline" onClick={onDismiss}>
        Got it
      </Button>
    </CardContent>
  </Card>
)
