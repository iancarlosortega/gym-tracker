'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 512

/**
 * The same rules the API enforces, checked first so a typo costs no request.
 *
 * Unlike sign-in, judging the address here gives nothing away: registering is
 * the one place an address is supposed to be checked. Length is counted in
 * code points, as the server counts it.
 */
const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email.')
    .pipe(z.email('Enter a usable email address.')),
  password: z
    .string()
    .refine((value) => [...value].length >= PASSWORD_MIN_LENGTH, 'Use at least 8 characters.')
    .refine((value) => [...value].length <= PASSWORD_MAX_LENGTH, 'Use at most 512 characters.'),
})

export type SignUpSubmission = z.output<typeof signUpSchema>

/** What the server said, as far as the visitor needs to know it. */
export type SignUpFailure =
  | { readonly kind: 'email-taken' }
  | { readonly kind: 'rate-limited' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'rejected'; readonly reason: string }

export interface SignUpFormProps {
  readonly pending: boolean
  readonly failure: SignUpFailure | null
  /** Sign-in, carrying where the visitor was headed. */
  readonly signInHref: string
  readonly onSubmit: (submission: SignUpSubmission) => void
}

const inputClass = 'h-15 rounded-xl bg-card px-4 text-lg md:text-lg dark:bg-card'

const FailureMessage = ({
  failure,
  signInHref,
}: {
  readonly failure: SignUpFailure
  readonly signInHref: string
}) => {
  switch (failure.kind) {
    case 'email-taken':
      return (
        <FieldError>
          An account with that email already exists.{' '}
          <Link className="font-semibold underline underline-offset-4" href={signInHref}>
            Sign in instead
          </Link>
        </FieldError>
      )
    case 'rate-limited':
      return <FieldError>Too many attempts. Wait a minute and try again.</FieldError>
    case 'unavailable':
      return (
        <FieldError>
          Couldn&apos;t reach the server. Check your connection and try again.
        </FieldError>
      )
    case 'rejected':
      return <FieldError>{failure.reason}</FieldError>
  }
}

/**
 * The register fields: sign-in's layout, plus a length hint that turns green
 * once the password is long enough, so the one rule is never a surprise.
 */
export const SignUpForm = ({ pending, failure, signInHref, onSubmit }: SignUpFormProps) => {
  const [revealed, setRevealed] = useState(false)
  const form = useForm<SignUpSubmission>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  })
  const password = useWatch({ control: form.control, name: 'password' })
  const longEnough = [...password].length >= PASSWORD_MIN_LENGTH

  return (
    <div className="grid gap-5">
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-3">
          {failure !== null && <FailureMessage failure={failure} signInHref={signInHref} />}

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || failure?.kind === 'email-taken'}>
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
                  aria-invalid={fieldState.invalid || failure?.kind === 'email-taken'}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="sr-only" htmlFor={field.name}>
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    {...field}
                    className={`${inputClass} pr-14`}
                    id={field.name}
                    type={revealed ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Password"
                    aria-describedby="password-hint"
                    aria-invalid={fieldState.invalid}
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
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <p
                    id="password-hint"
                    data-met={longEnough}
                    className={cn(
                      'flex items-center gap-1.5 px-1 text-sm',
                      longEnough ? 'text-live' : 'text-muted-foreground',
                    )}
                  >
                    {longEnough && <Check className="size-3.5" aria-hidden="true" />}
                    <span>At least 8 characters</span>
                  </p>
                )}
              </Field>
            )}
          />

          <Button
            className="h-16 w-full rounded-xl text-lg font-bold"
            disabled={pending}
            type="submit"
          >
            {pending ? <Loader2 className="size-5 animate-spin" /> : null}
            {pending ? 'Creating account…' : 'Create account'}
            {pending ? null : <ArrowRight className="size-5" />}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-muted-foreground">
        Already have an account?{' '}
        <Link
          className="font-semibold text-foreground underline underline-offset-4"
          href={signInHref}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
