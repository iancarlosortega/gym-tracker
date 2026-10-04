'use client'

import { TargetReps } from '@gym/domain/routines/value-objects/target-reps.vo'
import { zodResolver } from '@hookform/resolvers/zod'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { EntryTargets } from '../../infrastructure/routines.api'
import { restLabel } from './routine-views'

const REST_PRESETS = [60, 90, 120, 180, 240] as const
const MAX_SETS = 50

/**
 * Reps are validated by the domain's own rule, so the form cannot accept a
 * range the server would refuse, and the message is the one the domain gives.
 */
const entrySchema = z
  .object({
    targetSets: z.number().int().min(1).max(MAX_SETS),
    repsFrom: z.string().trim(),
    repsTo: z.string().trim(),
    restSeconds: z.number().int(),
  })
  .superRefine((entry, context) => {
    if (entry.repsFrom === '' && entry.repsTo === '') return
    try {
      TargetReps.create(
        Number(entry.repsFrom || entry.repsTo),
        Number(entry.repsTo || entry.repsFrom),
      )
    } catch (error) {
      context.addIssue({
        code: 'custom',
        path: ['repsTo'],
        message: error instanceof Error ? error.message : 'Those reps are not valid.',
      })
    }
  })

type EntryForm = z.output<typeof entrySchema>

export interface EditableEntry {
  readonly targetSets: number | null
  /** "8-12" or "8", as the API sends it. */
  readonly targetReps: string | null
  readonly restSeconds: number
}

export interface EntryEditorProps {
  readonly entry: EditableEntry
  readonly pending: boolean
  readonly failed: boolean
  readonly onSave: (targets: EntryTargets) => void
  readonly onRemove: () => void
}

const toTargets = ({ targetSets, repsFrom, repsTo, restSeconds }: EntryForm): EntryTargets => {
  if (repsFrom === '' && repsTo === '') return { targetSets, restSeconds }
  return {
    targetSets,
    targetRepsMin: Number(repsFrom || repsTo),
    targetRepsMax: Number(repsTo || repsFrom),
    restSeconds,
  }
}

const stepperClass = 'size-14 rounded-xl text-lg'

export const EntryEditor = ({ entry, pending, failed, onSave, onRemove }: EntryEditorProps) => {
  const [from = '', to = from] = entry.targetReps?.split('-') ?? []
  const form = useForm<EntryForm>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      targetSets: entry.targetSets ?? 3,
      repsFrom: from,
      repsTo: to,
      restSeconds: entry.restSeconds,
    },
  })
  const restChoices = [...new Set([...REST_PRESETS, entry.restSeconds])].sort((a, b) => a - b)

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => onSave(toTargets(values)))}>
      <FieldGroup className="gap-5">
        {failed && <FieldError>Couldn't reach the server. Try again.</FieldError>}

        <Controller
          name="targetSets"
          control={form.control}
          render={({ field }) => (
            <div className="grid gap-2">
              <span className="font-medium text-sm">Sets</span>
              <div className="flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className={stepperClass}
                  aria-label="One fewer set"
                  disabled={field.value <= 1}
                  onClick={() => field.onChange(field.value - 1)}
                >
                  <Minus className="size-6" />
                </Button>
                <output aria-live="polite" className="font-bold text-3xl">
                  {field.value}
                </output>
                <Button
                  type="button"
                  variant="outline"
                  className={stepperClass}
                  aria-label="One more set"
                  disabled={field.value >= MAX_SETS}
                  onClick={() => field.onChange(field.value + 1)}
                >
                  <Plus className="size-6" />
                </Button>
              </div>
            </div>
          )}
        />

        <div className="grid gap-2">
          <span className="font-medium text-sm">Reps</span>
          <div className="grid grid-cols-2 gap-3">
            {(['repsFrom', 'repsTo'] as const).map((name) => (
              <Field key={name}>
                <FieldLabel htmlFor={name}>{name === 'repsFrom' ? 'From' : 'To'}</FieldLabel>
                <Input
                  {...form.register(name)}
                  id={name}
                  inputMode="numeric"
                  autoComplete="off"
                  className="h-14 text-center text-lg"
                />
              </Field>
            ))}
          </div>
          <FieldError errors={[form.formState.errors.repsTo]} />
        </div>

        <Controller
          name="restSeconds"
          control={form.control}
          render={({ field }) => (
            <fieldset className="grid gap-2">
              <legend className="mb-2 font-medium text-sm">Rest</legend>
              <div className="flex flex-wrap gap-2">
                {restChoices.map((seconds) => (
                  <label
                    key={seconds}
                    className={cn(
                      'flex min-h-touch min-w-16 cursor-pointer items-center justify-center rounded-full border px-4 font-medium',
                      field.value === seconds ? 'border-primary bg-primary/10' : 'border-border',
                    )}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      checked={field.value === seconds}
                      onChange={() => field.onChange(seconds)}
                      className="sr-only"
                    />
                    {restLabel(seconds)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        />

        <Button type="submit" className="min-h-touch text-base" disabled={pending}>
          Save
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="min-h-touch text-base"
          disabled={pending}
          onClick={onRemove}
        >
          <Trash2 className="size-5" />
          Remove from routine
        </Button>
      </FieldGroup>
    </form>
  )
}
