'use client'

import { useState } from 'react'
import { QueryState } from '@/components/query-state'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { EquipmentDetails, EquipmentList } from '../components/equipment-views'
import { EditCatalogItemForm } from '../components/exercise-forms'
import {
  useArchiveEquipment,
  useCatalogEquipment,
  useEquipmentUsage,
  useRenameEquipment,
} from '../queries'

export const EquipmentListContainer = () => (
  <QueryState
    query={useCatalogEquipment()}
    pending={<p>Reading your equipment…</p>}
    failed={<p role="alert">Could not reach the server, so your equipment cannot be shown.</p>}
  >
    {(equipment) => <EquipmentList equipment={equipment} />}
  </QueryState>
)

export const EquipmentDetailContainer = ({ equipmentId }: { readonly equipmentId: string }) => {
  const equipment = useCatalogEquipment()
  // A failed usage read leaves the rest of the page standing.
  const usage = useEquipmentUsage(equipmentId).data ?? null
  const rename = useRenameEquipment()
  const archive = useArchiveEquipment()
  const [editing, setEditing] = useState(false)

  const close = () => {
    setEditing(false)
    rename.reset()
    archive.reset()
  }

  return (
    <QueryState
      query={equipment}
      pending={<p>Reading this equipment…</p>}
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
            <EquipmentDetails equipment={item} usage={usage} onEdit={() => setEditing(true)} />

            <Drawer open={editing} onOpenChange={(open) => !open && close()}>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{item.name}</DrawerTitle>
                </DrawerHeader>
                <div className="px-4 pb-6">
                  <EditCatalogItemForm
                    name={item.name}
                    pending={rename.isPending || archive.isPending}
                    failed={rename.isError || archive.isError}
                    onRename={(name) => rename.mutate({ id: item.id, name }, { onSuccess: close })}
                    onArchive={() => archive.mutate(item.id, { onSuccess: close })}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </>
        )
      }}
    </QueryState>
  )
}
