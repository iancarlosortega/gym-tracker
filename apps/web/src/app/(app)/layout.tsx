import type { ReactNode } from 'react'
import { AppTabBarContainer } from '@/features/shell/presentation/containers/app-tab-bar.container'

/** Every screen with the tab bar. The workout and sign-in screens live outside it. */
const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-dvh flex-col">
    <div className="grow">{children}</div>
    <div className="sticky bottom-0">
      <AppTabBarContainer />
    </div>
  </div>
)

export default AppLayout
