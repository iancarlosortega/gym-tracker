'use client'

import type { Dispatch } from 'react'
import { Button } from '@/components/ui/button'
import { type KeypadAction, type KeypadState, keypadValues } from '../keypad/keypad.reducer'
import { SetKeypad, ValueTile } from '../keypad/set-keypad'

export interface SetEditorProps {
  readonly setNumber: number
  /** How the load reads for this set: per side, per hand, a pin. */
  readonly tile: {
    readonly label: string
    readonly unit?: string | undefined
    readonly spokenUnit?: string | undefined
  }
  readonly state: KeypadState
  readonly dispatch: Dispatch<KeypadAction>
  readonly onSave: (values: { weight: number | null; reps: number | null }) => void
  readonly onDelete: () => void
  readonly onClose: () => void
}

/**
 * Correcting a logged set: the same tiles and keypad as logging it, so the
 * system keyboard never opens, with Save in place of Log and a way to delete.
 */
export const SetEditor = ({
  setNumber,
  tile,
  state,
  dispatch,
  onSave,
  onDelete,
  onClose,
}: SetEditorProps) => (
  <div className="grid gap-3">
    <div className="grid grid-cols-2 gap-3 px-4">
      <ValueTile
        label={tile.label}
        value={state.weight}
        unit={tile.unit}
        spokenUnit={tile.spokenUnit}
        pressed={state.field === 'weight'}
        onPress={() => dispatch({ type: 'switchField', field: 'weight' })}
      />
      <ValueTile
        label="Reps"
        value={state.reps}
        pressed={state.field === 'reps'}
        onPress={() => dispatch({ type: 'switchField', field: 'reps' })}
      />
    </div>
    <Button
      variant="ghost"
      className="mx-4 min-h-touch justify-self-start text-destructive"
      onClick={onDelete}
    >
      Delete set {setNumber}
    </Button>
    <SetKeypad
      state={state}
      dispatch={dispatch}
      setNumber={setNumber}
      weightLabel={tile.label.toLowerCase()}
      last={null}
      submitLabel="Save"
      onLog={() => onSave(keypadValues(state))}
      onClose={onClose}
    />
  </div>
)
