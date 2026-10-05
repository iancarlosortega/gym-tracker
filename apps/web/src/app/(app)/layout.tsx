import type { ReactNode } from 'react'
import { FixedBottom } from '@/features/shell/presentation/components/fixed-bottom'
import { AppShellContainer } from '@/features/shell/presentation/containers/app-shell.container'
import { RefreshableContent } from '@/features/shell/presentation/containers/refreshable-content.container'

/** Every screen with the tab bar. The workout and sign-in screens live outside it. */
const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-1 flex-col">
    <div className="grow">
      <RefreshableContent>{children}</RefreshableContent>
    </div>
    <FixedBottom>
      <AppShellContainer />
    </FixedBottom>
  </div>
)

export default AppLayout
