'use client'

import { toKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { type DisplayUnit, fromDisplay, kilogramsToDisplay, unitLabel } from '@/lib/units'

/** A typed bar weight as kilograms for the API; empty is a bar that is not counted. */
export const barKilogramsFrom = (typed: string, unit: DisplayUnit): number | null | 'invalid' => {
  if (typed.trim() === '') return null
  const value = Number(typed)
  if (!(value > 0)) return 'invalid'
  const kilograms = toKilograms(fromDisplay(value, unit))
  return kilograms > 500 ? 'invalid' : kilograms
}

export interface BarWeightFormProps {
  readonly barKilograms: number | null
  readonly unit: DisplayUnit
  readonly pending: boolean
  readonly failed: boolean
  readonly onSave: (barKilograms: number | null) => void
}

export const BarWeightForm = ({
  barKilograms,
  unit,
  pending,
  failed,
  onSave,
}: BarWeightFormProps) => {
  const [typed, setTyped] = useState(
    barKilograms === null ? '' : String(kilogramsToDisplay(barKilograms, unit)),
  )
  const [invalid, setInvalid] = useState(false)

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const value = barKilogramsFrom(typed, unit)
        setInvalid(value === 'invalid')
        if (value !== 'invalid') onSave(value)
      }}
    >
      {failed && <FieldError>Couldn't reach the server. Try again.</FieldError>}
      <Field data-invalid={invalid}>
        <FieldLabel htmlFor="bar-weight">Bar or sled weight ({unitLabel(unit)})</FieldLabel>
        <Input
          id="bar-weight"
          inputMode="decimal"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          className="h-12 text-base"
        />
        <FieldDescription>Leave it empty if you don't count it, like a Smith.</FieldDescription>
        {invalid && <FieldError>Enter a weight above zero, or leave it empty.</FieldError>}
      </Field>
      <Button type="submit" className="min-h-touch text-base" disabled={pending}>
        Save and review history
      </Button>
    </form>
  )
}
