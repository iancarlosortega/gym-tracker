import { Dumbbell } from 'lucide-react'
import { SignUpContainer } from '@/features/auth/presentation/containers/sign-up.container'

const RegisterPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) => {
  const { next } = await searchParams

  return (
    // The root layout clears the status bar; the bottom inset keeps the form off the home bar.
    <main className="mx-auto flex w-full max-w-screen-sm flex-1 flex-col justify-between gap-10 px-6 pt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="grid gap-5">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Dumbbell className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-[44px] leading-[1.02] font-extrabold tracking-tight">
          Start
          <br />
          your log.
        </h1>
        <p className="text-muted-foreground">
          One account, your data only. The session lasts 90 days.
        </p>
      </header>

      <SignUpContainer next={Array.isArray(next) ? next[0] : next} />
    </main>
  )
}

export default RegisterPage
