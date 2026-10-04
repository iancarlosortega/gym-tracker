import { CatalogSegments } from '@/features/catalog/presentation/components/catalog-segments'
import { EquipmentDetailContainer } from '@/features/catalog/presentation/containers/equipment.container'

const EquipmentDetailPage = async ({ params }: { params: Promise<{ equipmentId: string }> }) => {
  const { equipmentId } = await params

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <CatalogSegments pathname="/equipment" />
      <EquipmentDetailContainer equipmentId={equipmentId} />
    </main>
  )
}

export default EquipmentDetailPage
