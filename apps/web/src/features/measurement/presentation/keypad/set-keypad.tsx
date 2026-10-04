'use client'

import { Delete, X } from 'lucide-react'
import type { Dispatch, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KeypadAction, KeypadState } from './keypad.reducer'

export interface ValueTileProps {
  readonly label: string
  /** As typed; empty when nothing is entered yet. */
  readonly value: string
  readonly unit?: string
  /** The unit as a screen reader should say it: "kilograms", not "kg". */
  readonly spokenUnit?: string
  readonly hint?: string
  readonly pressed: boolean
  readonly onPress: () => void
}

/**
 * A value shown as a button, never an input: an input would let the device
 * keyboard open, which the app's keypad exists to prevent.
 */
export const ValueTile = ({
  label,
  value,
  unit,
  spokenUnit,
  hint,
  pressed,
  onPress,
}: ValueTileProps) => (
  <button
    type="button"
    aria-pressed={pressed}
    aria-label={`${label}, ${value === '' ? 'not entered' : `${value}${spokenUnit ? ` ${spokenUnit}` : ''}`}`}
    onClick={onPress}
    className={cn(
      'grid min-h-24 gap-1 rounded-2xl border-2 bg-card p-4 text-left',
      pressed ? 'border-primary' : 'border-transparent',
    )}
  >
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className="font-bold text-4xl tabular-nums">
      {value === '' ? '–' : value}
      {pressed && <span className="ml-0.5 animate-pulse font-light text-primary">|</span>}
      {unit !== undefined && value !== '' && (
        <span className="ml-1 font-medium text-lg text-muted-foreground">{unit}</span>
      )}
    </span>
    {hint !== undefined && <span className="text-muted-foreground text-xs">{hint}</span>}
  </button>
)

const Key = ({
  label,
  className,
  onPress,
  children,
}: {
  readonly label: string
  readonly className?: string
  readonly onPress: () => void
  readonly children?: ReactNode
}) => (
  <Button
    type="button"
    variant="outline"
    aria-label={label}
    onClick={onPress}
    className={cn('h-15 rounded-xl font-semibold text-2xl', className)}
  >
    {children ?? label}
  </Button>
)

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export interface SetKeypadProps {
  readonly state: KeypadState
  readonly dispatch: Dispatch<KeypadAction>
  readonly setNumber: number
  /** "weight", "weight per side" or "pin position", as the exercise is loaded. */
  readonly weightLabel: string
  /** This set number last time, for "Same as last"; null when there was none. */
  readonly last: { readonly weight: number; readonly reps: number } | null
  readonly onLog: () => void
  readonly onClose: () => void
}

/** Shown only while a value is being edited. */
export const SetKeypad = ({
  state,
  dispatch,
  setNumber,
  weightLabel,
  last,
  onLog,
  onClose,
}: SetKeypadProps) => {
  const editingWeight = state.field === 'weight'
  const label = editingWeight ? capitalized(weightLabel) : 'Reps'

  return (
    <section className="grid gap-3 rounded-t-3xl border-t bg-background p-4" aria-label="Keypad">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Typing the {editingWeight ? weightLabel : 'reps'}</h2>
        <Button variant="ghost" className="min-h-touch" aria-label="Close" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {/* Polite: it waits for VoiceOver to finish reading the key just pressed. */}
      <p role="status" className="sr-only">
        {`${label} ${state[state.field]}`}
      </p>

      <div className="grid grid-cols-3 gap-2">
        <Key
          label={editingWeight ? '−2.5' : '−1'}
          className="h-12 text-base"
          onPress={() => dispatch({ type: 'step', direction: -1 })}
        />
        <Button
          type="button"
          variant="secondary"
          className="h-12 rounded-xl"
          disabled={last === null}
          onClick={() => last !== null && dispatch({ type: 'sameAsLast', last })}
        >
          Same as last
        </Button>
        <Key
          label={editingWeight ? '+2.5' : '+1'}
          className="h-12 text-base"
          onPress={() => dispatch({ type: 'step', direction: 1 })}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-3 grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <Key key={digit} label={digit} onPress={() => dispatch({ type: 'digit', digit })} />
          ))}
          <Key label="Decimal point" onPress={() => dispatch({ type: 'decimal' })}>
            .
          </Key>
          <Key label="0" onPress={() => dispatch({ type: 'digit', digit: '0' })} />
          <Key label="Delete" onPress={() => dispatch({ type: 'delete' })}>
            <Delete className="size-6" />
          </Key>
        </div>
        <div className="grid grid-rows-[auto_1fr] gap-2">
          <Key
            label={editingWeight ? 'Reps ›' : '‹ Weight'}
            className="text-base"
            onPress={() => dispatch({ type: 'switchField' })}
          />
          <Button type="button" className="h-full rounded-xl font-bold text-lg" onClick={onLog}>
            Log set {setNumber}
          </Button>
        </div>
      </div>
    </section>
  )
}
