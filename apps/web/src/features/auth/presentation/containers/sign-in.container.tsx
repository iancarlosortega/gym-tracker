'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { InvalidCredentialsError } from '../../application/invalid-credentials.error'
import { RateLimitedError } from '../../application/rate-limited.error'
import { SignInUseCase } from '../../application/sign-in.use-case'
import { authPageFor, REGISTER_PATH, safeNextPath } from '../../application/sign-in-redirect'
import { HttpSignInGateway } from '../../infrastructure/http-sign-in.gateway'
import { type SignInFailure, SignInForm, type SignInSubmission } from '../components/sign-in-form'

export interface SignInContainerProps {
  /** The raw `next` query parameter; it is checked here, never trusted. */
  readonly next?: string | undefined
}

const failureFrom = (error: unknown): SignInFailure => {
  if (error instanceof InvalidCredentialsError) {
    return 'invalid-credentials'
  }
  if (error instanceof RateLimitedError) {
    return 'rate-limited'
  }
  return 'unavailable'
}

export const SignInContainer = ({ next }: SignInContainerProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Arriving signed out: whatever the last session read is not the next one's to show.
  useEffect(() => {
    queryClient.clear()
  }, [queryClient])
  const signIn = useMemo(() => new SignInUseCase(new HttpSignInGateway()), [])
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<SignInFailure | null>(null)

  const submit = async (credentials: SignInSubmission) => {
    setPending(true)
    setFailure(null)

    try {
      await signIn.execute(credentials)
      // The pending state stays on through the navigation, so a second tap
      // cannot sign in twice.
      router.replace(safeNextPath(next))
    } catch (error) {
      setFailure(failureFrom(error))
      setPending(false)
    }
  }

  return (
    <SignInForm
      pending={pending}
      failure={failure}
      registerHref={authPageFor(REGISTER_PATH, next)}
      onSubmit={(values) => void submit(values)}
    />
  )
}
