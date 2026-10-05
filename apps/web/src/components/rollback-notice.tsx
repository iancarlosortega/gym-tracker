import type { UseMutationResult } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface RollbackNoticeProps<TVariables> {
  readonly mutation: Pick<
    UseMutationResult<unknown, Error, TVariables>,
    'isError' | 'isPaused' | 'variables' | 'mutate'
  >
  readonly className?: string
}

/**
 * What became of a change already shown on screen.
 *
 * It is rendered next to the thing that changed: a failed change has already
 * been put back, so all that is left to say is that it was not saved, and to
 * offer the same change again without making the user redo it.
 */
export const RollbackNotice = <TVariables,>({
  mutation,
  className,
}: RollbackNoticeProps<TVariables>) => {
  if (mutation.isPaused) {
    return (
      <p role="status" className={cn('text-muted-foreground text-sm', className)}>
        Saves when you're back online.
      </p>
    )
  }

  if (!mutation.isError) {
    return null
  }

  return (
    <p role="status" className={cn('flex items-center gap-2 text-destructive text-sm', className)}>
      Not saved.
      <Button
        variant="link"
        size="sm"
        className="min-h-touch px-2"
        onClick={() => mutation.mutate(mutation.variables as TVariables)}
      >
        Try again
      </Button>
    </p>
  )
}
