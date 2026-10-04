'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { InvalidCredentialsError } from '../../application/invalid-credentials.error'
import { SignInUseCase } from '../../application/sign-in.use-case'
import { safeNextPath } from '../../application/sign-in-redirect'
import { HttpSignInGateway } from '../../infrastructure/http-sign-in.gateway'
import { type SignInFailure, SignInForm, type SignInSubmission } from '../components/sign-in-form'

export interface SignInContainerProps {
  /** The raw `next` query parameter; it is checked here, never trusted. */
  readonly next?: string | undefined
}

export const SignInContainer = ({ next }: SignInContainerProps) => {
  const router = useRouter()
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
      setFailure(error instanceof InvalidCredentialsError ? 'invalid-credentials' : 'unavailable')
      setPending(false)
    }
  }

  return (
    <SignInForm pending={pending} failure={failure} onSubmit={(values) => void submit(values)} />
  )
}
