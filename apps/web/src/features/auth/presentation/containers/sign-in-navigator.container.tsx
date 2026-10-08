'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { setSignInNavigator } from '@/lib/api-client'

/**
 * Hands the app's router to the API client, so a lapsed or missing session
 * moves to sign-in inside the page already loaded instead of loading it again.
 */
export const SignInNavigatorContainer = () => {
  const router = useRouter()

  useEffect(() => {
    setSignInNavigator((path) => router.replace(path))
    return () => setSignInNavigator(undefined)
  }, [router])

  return null
}
