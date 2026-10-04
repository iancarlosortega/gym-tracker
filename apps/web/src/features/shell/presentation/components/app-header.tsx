import { Dumbbell, Menu } from 'lucide-react'

/**
 * The logo and a menu button. The menu has nothing in it yet: it holds the
 * place for notifications and settings, so adding them later moves nothing.
 */
export const AppHeader = () => (
  <header className="flex items-center justify-between">
    <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
      <Dumbbell className="size-6" aria-hidden="true" />
    </span>
    <button
      type="button"
      aria-label="Menu"
      className="flex size-11 items-center justify-center rounded-full border border-border bg-card"
    >
      <Menu className="size-5" aria-hidden="true" />
    </button>
  </header>
)
