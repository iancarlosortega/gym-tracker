'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const newRoutineSchema = z.object({
  name: z.string().trim().min(1, 'Give it a name.').max(120, 'Keep it under 120 characters.'),
})

export interface NewRoutineFormProps {
  readonly pending: boolean
  readonly failed: boolean
  readonly onSubmit: (name: string) => void
}

export const NewRoutineForm = ({ pending, failed, onSubmit }: NewRoutineFormProps) => {
  const form = useForm<z.output<typeof newRoutineSchema>>({
    resolver: zodResolver(newRoutineSchema),
    defaultValues: { name: '' },
  })

  return (
    <form noValidate onSubmit={form.handleSubmit(({ name }) => onSubmit(name))}>
      <FieldGroup className="gap-4">
        {failed && <FieldError>Couldn't reach the server. Try again.</FieldError>}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="routine-name">Name</FieldLabel>
              <Input
                {...field}
                id="routine-name"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
                className="h-12 text-base"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Button type="submit" className="min-h-touch text-base" disabled={pending}>
          Create routine
        </Button>
      </FieldGroup>
    </form>
  )
}
