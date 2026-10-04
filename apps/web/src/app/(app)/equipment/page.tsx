import { CatalogSegments } from '@/features/catalog/presentation/components/catalog-segments'
import { EquipmentListContainer } from '@/features/catalog/presentation/containers/equipment.container'

const EquipmentPage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
    <h1 className="font-bold text-2xl">Equipment</h1>
    <CatalogSegments pathname="/equipment" />
    <EquipmentListContainer />
  </main>
)

export default EquipmentPage
