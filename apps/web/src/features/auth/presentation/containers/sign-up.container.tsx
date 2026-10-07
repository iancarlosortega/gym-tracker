'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { EmailTakenError } from '../../application/email-taken.error'
import { RateLimitedError } from '../../application/rate-limited.error'
import { authPageFor, SIGN_IN_PATH, safeNextPath } from '../../application/sign-in-redirect'
import { SignUpUseCase } from '../../application/sign-up.use-case'
import { SignUpRejectedError } from '../../application/sign-up-rejected.error'
import { HttpSignUpGateway } from '../../infrastructure/http-sign-up.gateway'
import { type SignUpFailure, SignUpForm, type SignUpSubmission } from '../components/sign-up-form'

export interface SignUpContainerProps {
  /** The raw `next` query parameter; it is checked here, never trusted. */
  readonly next?: string | undefined
}

const failureFrom = (error: unknown): SignUpFailure => {
  if (error instanceof EmailTakenError) {
    return { kind: 'email-taken' }
  }
  if (error instanceof RateLimitedError) {
    return { kind: 'rate-limited' }
  }
  if (error instanceof SignUpRejectedError) {
    return { kind: 'rejected', reason: error.message }
  }
  return { kind: 'unavailable' }
}

export const SignUpContainer = ({ next }: SignUpContainerProps) => {
  const router = useRouter()
  const signUp = useMemo(() => new SignUpUseCase(new HttpSignUpGateway()), [])
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<SignUpFailure | null>(null)

  const submit = async (credentials: SignUpSubmission) => {
    setPending(true)
    setFailure(null)

    try {
      await signUp.execute(credentials)
      // The pending state stays on through the navigation, so a second tap
      // cannot try to create the account twice.
      router.replace(safeNextPath(next))
    } catch (error) {
      setFailure(failureFrom(error))
      setPending(false)
    }
  }

  return (
    <SignUpForm
      pending={pending}
      failure={failure}
      signInHref={authPageFor(SIGN_IN_PATH, next)}
      onSubmit={(values) => void submit(values)}
    />
  )
}
