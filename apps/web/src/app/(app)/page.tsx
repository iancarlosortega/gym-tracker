import { Play } from 'lucide-react'
import Link from 'next/link'
import { AppHeader } from '@/features/shell/presentation/components/app-header'

/** Home until routines and "up next" land; it already reaches every area. */
const HomePage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-6">
    <AppHeader />
    <h1 className="font-extrabold text-[40px] leading-[1.02] tracking-tight">
      Ready when
      <br />
      you are.
    </h1>
    <Link
      href="/workout"
      className="flex min-h-16 items-center justify-center gap-2.5 rounded-2xl bg-primary font-bold text-lg text-primary-foreground"
    >
      <Play className="size-5 fill-current" aria-hidden="true" />
      Start a workout
    </Link>
  </main>
)

export default HomePage
