'use client'

import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export interface ExerciseOption {
  readonly id: string
  readonly name: string
  readonly defaultMode: MeasurementMode
}

export interface EquipmentOption {
  readonly id: string
  readonly name: string
}

/**
 * A number typed into a field, validated as the text it actually is.
 *
 * Not `z.coerce.number()`: coercion sends an empty field through `Number('')`
 * and produces zero, so a blank load would be reported as "more than zero"
 * rather than as the missing answer it is — and any rule less strict than
 * `positive` would have logged an empty bar.
 */
const typedNumber = z
  .string()
  .trim()
  .min(1, 'Enter a number.')
  .regex(/^\d*\.?\d+$/, 'Enter a number.')
  .transform(Number)

/**
 * What a set entry has to be before it may leave the form.
 *
 * The domain re-checks all of it; this exists so the user is told which field
 * is wrong while they can still see the field.
 */
const setEntrySchema = z.object({
  exerciseId: z.string().min(1, 'Choose an exercise.'),
  equipmentId: z.string().min(1, 'Choose the equipment.'),
  load: typedNumber.pipe(z.number().positive('That has to be more than zero.')),
  reps: typedNumber.pipe(
    z.number().int('Reps are whole numbers.').positive('That has to be at least one rep.'),
  ),
})

export type SetEntrySubmission = z.output<typeof setEntrySchema>
type SetEntryFields = z.input<typeof setEntrySchema>

export interface SetEntryFormProps {
  readonly exercises: readonly ExerciseOption[]
  readonly equipment: readonly EquipmentOption[]
  readonly busy?: boolean
  readonly onSubmit: (submission: SetEntrySubmission) => void
}

/** The shadcn controls size for a mouse; a set is logged with a thumb. */
const controlClass = 'min-h-touch px-4 text-2xl md:text-2xl'

/**
 * A native select rather than the shadcn one.
 *
 * On a phone this opens the system picker, which is reachable one-handed and
 * already knows how to be accessible. A popover listbox is the better desktop
 * control and the worse one at a rack.
 */
const selectClass = `${controlClass} rounded-md border border-input bg-transparent text-foreground aria-invalid:border-destructive`

/**
 * Entering one set. Pure: it owns the keystrokes and nothing else.
 *
 * What the load field means is decided by the exercise, because the exercise
 * is what decides how its load is read — kilograms a side on a bar, a total,
 * or a pin position that is not a weight at all. Labelling it the same way
 * every time is how a plate position ends up averaged as a mass.
 */
export const SetEntryForm = ({ exercises, equipment, busy, onSubmit }: SetEntryFormProps) => {
  const form = useForm<SetEntryFields, unknown, SetEntrySubmission>({
    resolver: zodResolver(setEntrySchema),
    mode: 'onBlur',
    defaultValues: {
      exerciseId: exercises[0]?.id ?? '',
      equipmentId: equipment[0]?.id ?? '',
      load: '',
      reps: '',
    },
  })

  const exerciseId = form.watch('exerciseId')
  const mode = exercises.find((exercise) => exercise.id === exerciseId)?.defaultMode ?? 'TOTAL'

  useEffect(() => {
    form.reset({ exerciseId: exercises[0]?.id ?? '', equipmentId: equipment[0]?.id ?? '' })
  }, [exercises, equipment, form])

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((submission) => {
        onSubmit(submission)
        // The exercise and equipment stay: the next set is usually the same
        // movement on the same bar.
        form.reset({ exerciseId, equipmentId: form.getValues('equipmentId'), load: '', reps: '' })
      })}
    >
      <FieldGroup>
        <Controller
          name="exerciseId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Exercise</FieldLabel>
              <select
                {...field}
                className={selectClass}
                id={field.name}
                aria-invalid={fieldState.invalid}
              >
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="equipmentId"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Equipment</FieldLabel>
              <select
                {...field}
                className={selectClass}
                id={field.name}
                aria-invalid={fieldState.invalid}
              >
                {equipment.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="load"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{loadLabel(mode)}</FieldLabel>
              <Input
                {...field}
                className={controlClass}
                id={field.name}
                inputMode="decimal"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>{loadHint(mode)}</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="reps"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Reps</FieldLabel>
              <Input
                {...field}
                className={controlClass}
                id={field.name}
                inputMode="numeric"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button className="min-h-touch-lg text-xl" type="submit" disabled={busy === true}>
          {busy === true ? <Loader2 className="animate-spin" /> : <Plus />}
          Log set
        </Button>
      </FieldGroup>
    </form>
  )
}

const loadLabel = (mode: MeasurementMode): string => {
  switch (mode) {
    case 'PER_SIDE':
      return 'Weight per side (kg)'
    case 'STACK_POSITION':
      return 'Pin position'
    case 'TOTAL':
      return 'Weight (kg)'
  }
}

const loadHint = (mode: MeasurementMode): string => {
  switch (mode) {
    case 'PER_SIDE':
      return 'What is loaded on one side. The bar is added for you.'
    case 'STACK_POSITION':
      return 'Which pin hole. A position is not a weight and is never averaged as one.'
    case 'TOTAL':
      return 'The whole weight being moved.'
  }
}
