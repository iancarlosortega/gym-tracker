import { HomeContainer } from '@/features/home/presentation/containers/home.container'
import { AppHeader } from '@/features/shell/presentation/components/app-header'

const HomePage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 px-5 pt-[max(3.5rem,env(safe-area-inset-top))] pb-6">
    <AppHeader />
    <HomeContainer />
  </main>
)

export default HomePage
