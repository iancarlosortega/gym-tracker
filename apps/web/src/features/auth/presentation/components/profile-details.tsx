import { CloudUpload, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { DisplayUnit } from '@/lib/units'
import { cn } from '@/lib/utils'

export interface ProfileDetailsProps {
  readonly email: string
  readonly pendingSets: number
  readonly signingOut: boolean
  readonly signOutFailed: boolean
  readonly displayUnit: DisplayUnit
  readonly onChangeUnit: (unit: DisplayUnit) => void
  /** What became of the last unit change, shown under the switch. */
  readonly unitNotice?: ReactNode
  readonly onSignOut: () => void
}

const UNITS: readonly { readonly unit: DisplayUnit; readonly label: string }[] = [
  { unit: 'KG', label: 'kg' },
  { unit: 'LB', label: 'lb' },
]

export const pendingSetsLabel = (count: number): string => {
  if (count === 0) {
    return 'All sets synced'
  }
  return `${count} ${count === 1 ? 'set' : 'sets'} waiting to sync`
}

export const ProfileDetails = ({
  email,
  pendingSets,
  signingOut,
  signOutFailed,
  displayUnit,
  onChangeUnit,
  unitNotice,
  onSignOut,
}: ProfileDetailsProps) => (
  <div className="grid gap-4">
    <Card>
      <CardContent className="grid gap-1">
        <span className="text-muted-foreground text-sm">Signed in as</span>
        <strong className="break-all">{email}</strong>
      </CardContent>
    </Card>

    <fieldset className="flex items-center justify-between gap-3">
      <legend className="float-left font-medium">Weights in</legend>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {UNITS.map(({ unit, label }) => (
          <label
            key={unit}
            className={cn(
              'flex min-h-11 min-w-14 cursor-pointer items-center justify-center rounded-lg font-semibold',
              displayUnit === unit ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
          >
            <input
              type="radio"
              name="display-unit"
              checked={displayUnit === unit}
              onChange={() => onChangeUnit(unit)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
    {unitNotice}

    <p className="flex items-center gap-2 text-muted-foreground text-sm">
      <CloudUpload className="size-4" />
      {pendingSetsLabel(pendingSets)}
    </p>

    <Button
      variant="destructive"
      className="min-h-touch w-full text-base"
      disabled={signingOut}
      onClick={onSignOut}
    >
      <LogOut className="size-5" />
      {signingOut ? 'Signing out…' : 'Sign out'}
    </Button>

    {signOutFailed && (
      <p role="alert" className="text-destructive text-sm">
        Could not reach the server, so you are still signed in. Try again once you're online.
      </p>
    )}
  </div>
)
