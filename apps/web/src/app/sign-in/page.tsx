import { Dumbbell } from 'lucide-react'
import { SignInContainer } from '@/features/auth/presentation/containers/sign-in.container'

const SignInPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) => {
  const { next } = await searchParams

  return (
    // Padding follows the safe-area insets, so the form clears the home bar.
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col justify-between gap-10 px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="grid gap-5">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Dumbbell className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-[44px] leading-[1.02] font-extrabold tracking-tight">
          Back to
          <br />
          the bar.
        </h1>
        <p className="text-muted-foreground">
          Sign in once. The session lasts 90 days and renews while you keep training.
        </p>
      </header>

      <SignInContainer next={Array.isArray(next) ? next[0] : next} />
    </main>
  )
}

export default SignInPage
