'use client'

import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import { useReducer } from 'react'
import { RollbackNotice } from '@/components/rollback-notice'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { DisplayUnit } from '@/lib/units'
import { useDisplayUnit } from '../../../auth/presentation/queries'
import { keypadReducer, openKeypad } from '../keypad/keypad.reducer'
import { useCorrectSet, useDeleteSet } from '../set-edits.queries'
import { enteredValue, weightTile } from '../set-entry'
import type { DoneSet } from '../workout/done-sets'
import { SetEditor } from './set-editor'

export interface SetEditorContainerProps {
  readonly sessionId: string
  readonly queue: SetRepository
  /** The set being corrected; null while the editor is closed. */
  readonly set: DoneSet | null
  readonly setNumber: number
  /** Dumbbells read per hand rather than per side. */
  readonly perHand: boolean
  readonly onClose: () => void
}

/**
 * Corrects or deletes one logged set.
 *
 * It stays mounted while the drawer is closed, so a change that fails after
 * the drawer is gone can still say so, next to the list it changed.
 */
export const SetEditorContainer = ({
  sessionId,
  queue,
  set,
  setNumber,
  perHand,
  onClose,
}: SetEditorContainerProps) => {
  const unit = useDisplayUnit()
  const correct = useCorrectSet(sessionId, queue)
  const remove = useDeleteSet(sessionId, queue)

  return (
    <>
      <RollbackNotice mutation={correct} />
      <RollbackNotice mutation={remove} />
      <Drawer open={set !== null} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Set {setNumber}</DrawerTitle>
          </DrawerHeader>
          {set !== null && (
            <EditorBody
              key={set.id}
              set={set}
              setNumber={setNumber}
              perHand={perHand}
              unit={unit}
              onSave={(value, reps) => {
                correct.mutate({ set, value, reps, unit })
                onClose()
              }}
              onDelete={() => {
                remove.mutate(set)
                onClose()
              }}
              onClose={onClose}
            />
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

const EditorBody = ({
  set,
  setNumber,
  perHand,
  unit,
  onSave,
  onDelete,
  onClose,
}: {
  readonly set: DoneSet
  readonly setNumber: number
  readonly perHand: boolean
  readonly unit: DisplayUnit
  readonly onSave: (value: number, reps: number) => void
  readonly onDelete: () => void
  readonly onClose: () => void
}) => {
  const [state, dispatch] = useReducer(
    keypadReducer,
    openKeypad({ weight: enteredValue(set, unit), reps: String(set.reps) }, 'weight'),
  )

  return (
    <SetEditor
      setNumber={setNumber}
      tile={weightTile(set.mode, perHand, unit)}
      state={state}
      dispatch={dispatch}
      onSave={({ weight, reps }) => {
        if (weight !== null && reps !== null && reps >= 1) onSave(weight, reps)
      }}
      onDelete={onDelete}
      onClose={onClose}
    />
  )
}
