import type { ReactNode } from 'react'
import { AppShellContainer } from '@/features/shell/presentation/containers/app-shell.container'

/** Every screen with the tab bar. The workout and sign-in screens live outside it. */
const AppLayout = ({ children }: { children: ReactNode }) => (
  // The app draws under a translucent status bar, so every tab screen starts below it.
  <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
    <div className="grow">{children}</div>
    <div className="sticky bottom-0">
      <AppShellContainer />
    </div>
  </div>
)

export default AppLayout
