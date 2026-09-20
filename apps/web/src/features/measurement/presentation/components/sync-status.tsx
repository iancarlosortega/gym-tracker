import { AlertTriangle, Check, CloudUpload } from 'lucide-react'

export interface SyncStatusProps {
  readonly pending: number
  /** Present only when the device could not store a set. */
  readonly storageFailure?: string | undefined
}

/**
 * How much of this workout the server has not seen.
 *
 * The count is shown even at zero rather than appearing only when something
 * is wrong: an indicator that is usually absent teaches nobody what it means,
 * and the one time it matters the user is mid-workout.
 */
export const SyncStatus = ({ pending, storageFailure }: SyncStatusProps) => (
  <div className="grid gap-2">
    <p className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground" role="status">
      {pending === 0 ? <Check className="size-4" /> : <CloudUpload className="size-4" />}
      {pending === 0
        ? 'All sets saved to the server.'
        : `${pending} ${pending === 1 ? 'set' : 'sets'} waiting to sync.`}
    </p>

    {storageFailure !== undefined && (
      <p
        className="flex items-center gap-2 rounded-md border border-destructive px-4 py-3 font-semibold text-destructive"
        role="alert"
      >
        <AlertTriangle className="size-4 shrink-0" />
        {storageFailure}
      </p>
    )}
  </div>
)
