import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface StalePreviewNoticeProps {
  readonly onRefresh: () => void
}

/**
 * The confirmation described history that has since moved.
 *
 * Says plainly that nothing was applied. A correction refused halfway would
 * be far worse than one refused outright, and the user's first question is
 * whether some of it went through.
 */
export const StalePreviewNotice = ({ onRefresh }: StalePreviewNoticeProps) => (
  <Card className="border-2 border-destructive">
    <CardContent className="grid gap-3">
      <strong className="flex items-center gap-2 text-destructive text-lg">
        <Clock aria-hidden="true" className="size-5" />
        This preview is out of date
      </strong>
      <span className="text-sm">
        A set was logged after it was made, so the change you were shown is no longer the change
        that would happen. Nothing was applied.
      </span>
      <Button className="justify-self-start" onClick={onRefresh}>
        Show me the new preview
      </Button>
    </CardContent>
  </Card>
)
