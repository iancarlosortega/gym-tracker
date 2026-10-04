import { CatalogSegments } from '@/features/catalog/presentation/components/catalog-segments'
import { RoutinesContainer } from '@/features/routines/presentation/containers/routines.container'

const RoutinesPage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
    <h1 className="font-bold text-2xl">Routines</h1>
    <CatalogSegments pathname="/routines" />
    <RoutinesContainer />
  </main>
)

export default RoutinesPage
