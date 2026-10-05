import type { ReactNode } from 'react'
import { FixedBottom } from '@/features/shell/presentation/components/fixed-bottom'
import { AppShellContainer } from '@/features/shell/presentation/containers/app-shell.container'

/** Every screen with the tab bar. The workout and sign-in screens live outside it. */
const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-1 flex-col">
    <div className="grow">{children}</div>
    <FixedBottom>
      <AppShellContainer />
    </FixedBottom>
  </div>
)

export default AppLayout
