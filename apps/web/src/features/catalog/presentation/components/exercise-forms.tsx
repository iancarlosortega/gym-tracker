'use client'

import {
  MEASUREMENT_MODES,
  type MeasurementMode,
} from '@gym/domain/measurement/value-objects/load-entry.vo'
import { zodResolver } from '@hookform/resolvers/zod'
import { Archive } from 'lucide-react'
import { type Control, Controller, type FieldValues, type Path, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const name = z.string().trim().min(1, 'Give it a name.').max(120, 'Keep it under 120 characters.')

const newExerciseSchema = z.object({ name, defaultMode: z.enum(MEASUREMENT_MODES) })

export type NewExerciseSubmission = z.output<typeof newExerciseSchema>

const MODE_CARDS: readonly {
  readonly mode: MeasurementMode
  readonly title: string
  readonly explanation: string
}[] = [
  { mode: 'TOTAL', title: 'Total weight', explanation: 'Everything you lift, like a dumbbell.' },
  { mode: 'PER_SIDE', title: 'Per side', explanation: 'The plates on one side of the bar.' },
  {
    mode: 'STACK_POSITION',
    title: 'Pin position',
    explanation: 'The pin number on a weight stack.',
  },
]

const FAILED = "Couldn't reach the server. Try again."

/** Shared by both forms; each keeps its name under the same key. */
const NameField = <TForm extends FieldValues & { name: string }>({
  control,
}: {
  readonly control: Control<TForm>
}) => (
  <Controller
    name={'name' as Path<TForm>}
    control={control}
    render={({ field, fieldState }) => (
      <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor="exercise-name">Name</FieldLabel>
        <Input
          {...field}
          id="exercise-name"
          autoComplete="off"
          aria-invalid={fieldState.invalid}
          className="h-12 text-base"
        />
        <FieldError errors={[fieldState.error]} />
      </Field>
    )}
  />
)

export interface NewExerciseFormProps {
  readonly pending: boolean
  readonly failed: boolean
  readonly onSubmit: (submission: NewExerciseSubmission) => void
}

/** The mode cannot change later, so each choice says what it means. */
export const NewExerciseForm = ({ pending, failed, onSubmit }: NewExerciseFormProps) => {
  const form = useForm<NewExerciseSubmission>({
    resolver: zodResolver(newExerciseSchema),
    defaultValues: { name: '', defaultMode: 'TOTAL' },
  })

  return (
    <form noValidate onSubmit={form.handleSubmit((submission) => onSubmit(submission))}>
      <FieldGroup className="gap-4">
        {failed && <FieldError>{FAILED}</FieldError>}
        <NameField control={form.control} />

        <Controller
          name="defaultMode"
          control={form.control}
          render={({ field }) => (
            <fieldset className="grid gap-2">
              <legend className="mb-2 font-medium text-sm">How you load it</legend>
              {MODE_CARDS.map((card) => (
                <label
                  key={card.mode}
                  className={cn(
                    'grid min-h-touch cursor-pointer grid-cols-[auto_1fr] items-center gap-x-3 rounded-xl border p-3',
                    field.value === card.mode ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={card.mode}
                    checked={field.value === card.mode}
                    onChange={() => field.onChange(card.mode)}
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

        <Button type="submit" className="min-h-touch text-base" disabled={pending}>
          Add exercise
        </Button>
      </FieldGroup>
    </form>
  )
}

const renameSchema = z.object({ name })

export interface EditExerciseFormProps {
  readonly name: string
  readonly pending: boolean
  readonly failed: boolean
  readonly onRename: (name: string) => void
  readonly onArchive: () => void
}

export const EditExerciseForm = ({
  name: current,
  pending,
  failed,
  onRename,
  onArchive,
}: EditExerciseFormProps) => {
  const form = useForm<z.output<typeof renameSchema>>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: current },
  })

  return (
    <form noValidate onSubmit={form.handleSubmit(({ name }) => onRename(name))}>
      <FieldGroup className="gap-4">
        {failed && <FieldError>{FAILED}</FieldError>}
        <NameField control={form.control} />

        <Button type="submit" className="min-h-touch text-base" disabled={pending}>
          Save
        </Button>

        <div className="grid gap-1">
          <Button
            type="button"
            variant="destructive"
            className="min-h-touch text-base"
            disabled={pending}
            onClick={onArchive}
          >
            <Archive className="size-5" />
            Archive
          </Button>
          <p className="text-center text-muted-foreground text-xs">
            Old sets stay in your history.
          </p>
        </div>
      </FieldGroup>
    </form>
  )
}
