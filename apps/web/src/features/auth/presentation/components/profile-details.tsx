import { CloudUpload, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface ProfileDetailsProps {
  readonly email: string
  readonly pendingSets: number
  readonly signingOut: boolean
  readonly signOutFailed: boolean
  readonly onSignOut: () => void
}

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
  onSignOut,
}: ProfileDetailsProps) => (
  <div className="grid gap-4">
    <Card>
      <CardContent className="grid gap-1">
        <span className="text-muted-foreground text-sm">Signed in as</span>
        <strong className="break-all">{email}</strong>
      </CardContent>
    </Card>

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
