'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

/**
 * Presence only, never shape.
 *
 * The API refuses a bad address and a wrong password with the same answer so
 * that nothing tells an attacker which one they got right; judging the address
 * here would hand them back the difference.
 */
const signInSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
  password: z.string().min(1, 'Enter your password.'),
})

export type SignInSubmission = z.output<typeof signInSchema>

/** What the server said, as far as the user needs to know it. */
export type SignInFailure = 'invalid-credentials' | 'rate-limited' | 'unavailable'

export interface SignInFormProps {
  readonly pending: boolean
  readonly failure: SignInFailure | null
  /** Register, carrying where the visitor was headed. */
  readonly registerHref: string
  readonly onSubmit: (submission: SignInSubmission) => void
}

const failureMessage: Record<SignInFailure, string> = {
  'invalid-credentials': "That email and password don't match.",
  'rate-limited': 'Too many attempts. Wait a minute and try again.',
  unavailable: "Couldn't reach the server. Check your connection and try again.",
}

/** The shadcn controls size for a mouse; this one is reached with a thumb. */
const inputClass = 'h-15 rounded-xl bg-card px-4 text-lg md:text-lg dark:bg-card'

/**
 * The sign-in fields. Pure: it owns the keystrokes and nothing else.
 *
 * Labels are visually hidden rather than absent: the placeholders carry the
 * sighted meaning, and a placeholder alone is not a name a screen reader or a
 * password manager can rely on.
 */
export const SignInForm = ({ pending, failure, registerHref, onSubmit }: SignInFormProps) => {
  const [revealed, setRevealed] = useState(false)
  const form = useForm<SignInSubmission>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div className="grid gap-5">
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-3">
          {failure !== null && <FieldError>{failureMessage[failure]}</FieldError>}

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || failure !== null}>
                <FieldLabel className="sr-only" htmlFor={field.name}>
                  Email
                </FieldLabel>
                <Input
                  {...field}
                  className={inputClass}
                  id={field.name}
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="Email"
                  aria-invalid={fieldState.invalid || failure !== null}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || failure !== null}>
                <FieldLabel className="sr-only" htmlFor={field.name}>
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    className={`${inputClass} pr-14`}
                    id={field.name}
                    type={revealed ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Password"
                    aria-invalid={fieldState.invalid || failure !== null}
                  />
                  <Button
                    aria-label={revealed ? 'Hide password' : 'Show password'}
                    className="absolute top-1/2 right-1 size-12 -translate-y-1/2"
                    onClick={() => setRevealed((shown) => !shown)}
                    size="icon-lg"
                    type="button"
                    variant="ghost"
                  >
                    {revealed ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </Button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Button
            className="h-16 w-full rounded-xl text-lg font-bold"
            disabled={pending}
            type="submit"
          >
            {pending ? <Loader2 className="size-5 animate-spin" /> : null}
            {pending ? 'Signing in…' : 'Sign in'}
            {pending ? null : <ArrowRight className="size-5" />}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-muted-foreground">
        New here?{' '}
        <Link
          className="font-semibold text-foreground underline underline-offset-4"
          href={registerHref}
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}
