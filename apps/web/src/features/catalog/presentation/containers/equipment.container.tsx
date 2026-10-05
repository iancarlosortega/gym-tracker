'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ListSkeleton } from '@/components/loading-skeletons'
import { QueryState } from '@/components/query-state'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useDisplayUnit } from '../../../auth/presentation/queries'
import { BarWeightForm } from '../components/bar-weight-form'
import { EquipmentDetails, EquipmentList } from '../components/equipment-views'
import { EditCatalogItemForm } from '../components/exercise-forms'
import { NewEquipmentForm } from '../components/new-equipment-form'
import {
  useArchiveEquipment,
  useCatalogEquipment,
  useCorrectBarWeight,
  useCreateEquipment,
  useEquipmentUsage,
  useRenameEquipment,
} from '../queries'

export const EquipmentListContainer = () => {
  const create = useCreateEquipment()
  const unit = useDisplayUnit()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <QueryState
        query={useCatalogEquipment()}
        pending={<ListSkeleton label="Loading your equipment" />}
        failed={<p role="alert">Could not reach the server, so your equipment cannot be shown.</p>}
      >
        {(equipment) => (
          <EquipmentList equipment={equipment} unit={unit} onNew={() => setCreating(true)} />
        )}
      </QueryState>

      <Drawer
        open={creating}
        onOpenChange={(open) => {
          setCreating(open)
          create.reset()
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>New equipment</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <NewEquipmentForm
              unit={unit}
              pending={create.isPending}
              failed={create.isError}
              onSubmit={(equipment) =>
                create.mutate(equipment, { onSuccess: () => setCreating(false) })
              }
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export const EquipmentDetailContainer = ({ equipmentId }: { readonly equipmentId: string }) => {
  const equipment = useCatalogEquipment()
  // A failed usage read leaves the rest of the page standing.
  const usage = useEquipmentUsage(equipmentId).data ?? null
  const rename = useRenameEquipment()
  const archive = useArchiveEquipment()
  const correctBar = useCorrectBarWeight()
  const unit = useDisplayUnit()
  const router = useRouter()
  const [sheet, setSheet] = useState<'edit' | 'bar' | null>(null)

  const close = () => {
    setSheet(null)
    rename.reset()
    archive.reset()
    correctBar.reset()
  }

  return (
    <QueryState
      query={equipment}
      pending={<ListSkeleton label="Loading this equipment" rows={2} />}
      failed={<p role="alert">Could not reach the server, so this equipment cannot be shown.</p>}
    >
      {(list) => {
        const item = list.find((candidate) => candidate.id === equipmentId)

        if (item === undefined) {
          return <p role="alert">That equipment does not exist.</p>
        }

        return (
          <>
            <h1 className="font-bold text-2xl">{item.name}</h1>
            <EquipmentDetails
              equipment={item}
              usage={usage}
              unit={unit}
              onEdit={() => setSheet('edit')}
              onChangeBar={() => setSheet('bar')}
            />

            <Drawer open={sheet !== null} onOpenChange={(open) => !open && close()}>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{sheet === 'bar' ? 'Bar or sled weight' : item.name}</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-6">
                  {sheet === 'bar' && (
                    <BarWeightForm
                      barKilograms={item.barKilograms}
                      unit={unit}
                      pending={correctBar.isPending}
                      failed={correctBar.isError}
                      onSave={(barKilograms) =>
                        correctBar.mutate(
                          { id: item.id, barKilograms },
                          // Past sets change only after the preview is applied.
                          { onSuccess: () => router.push(`/equipment/${item.id}/recompute`) },
                        )
                      }
                    />
                  )}
                  {sheet === 'edit' && (
                    <EditCatalogItemForm
                      name={item.name}
                      pending={rename.isPending || archive.isPending}
                      failed={rename.isError || archive.isError}
                      onRename={(name) =>
                        rename.mutate({ id: item.id, name }, { onSuccess: close })
                      }
                      onArchive={() => archive.mutate(item.id, { onSuccess: close })}
                    />
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </>
        )
      }}
    </QueryState>
  )
}
