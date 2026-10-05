'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { type DisplayUnit, unitLabel } from '@/lib/units'
import { cn } from '@/lib/utils'
import type { NewEquipment } from '../../infrastructure/equipment.api'
import { barKilogramsFrom } from './bar-weight-form'

export type EquipmentKindOption = NewEquipment['kind']

const KIND_CARDS: readonly {
  readonly kind: EquipmentKindOption
  readonly title: string
  readonly explanation: string
}[] = [
  {
    kind: 'BARBELL',
    title: 'Plate-loaded',
    explanation: 'A bar or machine you load with plates: a barbell, the Smith, a hack squat.',
  },
  { kind: 'STACK', title: 'Weight stack', explanation: 'A machine with a pin you move.' },
  {
    kind: 'FREE_WEIGHT',
    title: 'Free weights',
    explanation: 'Dumbbells and kettlebells. Per side means per hand.',
  },
]

const schemaFor = (unit: DisplayUnit) =>
  z
    .object({
      name: z.string().trim().min(1, 'Give it a name.').max(120, 'Keep it under 120 characters.'),
      kind: z.enum(['BARBELL', 'STACK', 'FREE_WEIGHT']),
      bar: z.string().trim(),
      positions: z.string().trim(),
    })
    .superRefine((form, context) => {
      if (form.kind === 'BARBELL' && barKilogramsFrom(form.bar, unit) === 'invalid') {
        context.addIssue({
          code: 'custom',
          path: ['bar'],
          message: 'Enter a weight above zero, or leave it empty.',
        })
      }
      const positions = Number(form.positions)
      if (
        form.kind === 'STACK' &&
        (!Number.isInteger(positions) || positions < 1 || positions > 100)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['positions'],
          message: 'Enter how many pin positions it has.',
        })
      }
    })

type Form = z.output<ReturnType<typeof schemaFor>>

const toEquipment = (form: Form, unit: DisplayUnit): NewEquipment => {
  switch (form.kind) {
    case 'BARBELL': {
      const bar = barKilogramsFrom(form.bar, unit)
      return typeof bar === 'number'
        ? { name: form.name, kind: 'BARBELL', barKilograms: bar }
        : { name: form.name, kind: 'BARBELL' }
    }
    case 'STACK':
      return { name: form.name, kind: 'STACK', stackPositions: Number(form.positions) }
    case 'FREE_WEIGHT':
      return { name: form.name, kind: 'FREE_WEIGHT' }
  }
}

export interface NewEquipmentFormProps {
  /** Only the kinds that fit; all three when nothing narrows them. */
  readonly kinds?: readonly EquipmentKindOption[]
  /** The unit the bar weight is typed in. */
  readonly unit?: DisplayUnit
  readonly pending: boolean
  readonly failed: boolean
  readonly onSubmit: (equipment: NewEquipment) => void
}

export const NewEquipmentForm = ({
  kinds = ['BARBELL', 'STACK', 'FREE_WEIGHT'],
  unit = 'KG',
  pending,
  failed,
  onSubmit,
}: NewEquipmentFormProps) => {
  const form = useForm<Form>({
    resolver: zodResolver(schemaFor(unit)),
    defaultValues: { name: '', kind: kinds[0] ?? 'BARBELL', bar: '', positions: '' },
  })
  const kind = useWatch({ control: form.control, name: 'kind' })

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => onSubmit(toEquipment(values, unit)))}>
      <FieldGroup className="gap-4">
        {failed && <FieldError>Couldn't reach the server. Try again.</FieldError>}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="equipment-name">Name</FieldLabel>
              <Input {...field} id="equipment-name" autoComplete="off" className="h-12 text-base" />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="kind"
          control={form.control}
          render={({ field }) => (
            <fieldset className="grid gap-2">
              <legend className="mb-2 font-medium text-sm">What it is</legend>
              {KIND_CARDS.filter((card) => kinds.includes(card.kind)).map((card) => (
                <label
                  key={card.kind}
                  className={cn(
                    'grid min-h-touch cursor-pointer grid-cols-[auto_1fr] items-center gap-x-3 rounded-xl border p-3',
                    field.value === card.kind ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                >
                  <input
                    type="radio"
                    name={field.name}
                    checked={field.value === card.kind}
                    onChange={() => field.onChange(card.kind)}
                    className="size-5 accent-primary"
                  />
                  <span className="grid">
                    <span className="font-medium">{card.title}</span>
                    <span className="text-muted-foreground text-sm">{card.explanation}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
        />

        {kind === 'BARBELL' && (
          <Field data-invalid={form.formState.errors.bar !== undefined}>
            <FieldLabel htmlFor="equipment-bar">Bar or sled weight ({unitLabel(unit)})</FieldLabel>
            <Input
              {...form.register('bar')}
              id="equipment-bar"
              inputMode="decimal"
              className="h-12 text-base"
            />
            <FieldDescription>Leave it empty if you don't count it, like a Smith.</FieldDescription>
            <FieldError errors={[form.formState.errors.bar]} />
          </Field>
        )}
        {kind === 'STACK' && (
          <Field data-invalid={form.formState.errors.positions !== undefined}>
            <FieldLabel htmlFor="equipment-positions">Positions</FieldLabel>
            <Input
              {...form.register('positions')}
              id="equipment-positions"
              inputMode="numeric"
              className="h-12 text-base"
            />
            <FieldError errors={[form.formState.errors.positions]} />
          </Field>
        )}

        <Button type="submit" className="min-h-touch text-base" disabled={pending}>
          Add equipment
        </Button>
      </FieldGroup>
    </form>
  )
}
