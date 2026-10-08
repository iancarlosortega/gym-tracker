/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { redirectToSignIn } from '@/lib/api-client'
import { SignInNavigatorContainer } from './sign-in-navigator.container.tsx'

const nav = vi.hoisted(() => ({ replaced: [] as string[] }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: (href: string) => nav.replaced.push(href) }),
}))

afterEach(() => {
  cleanup()
  nav.replaced = []
  window.history.replaceState(null, '', '/')
})

describe('SignInNavigatorContainer', () => {
  it('sends a lapsed session to sign-in without loading the app again', () => {
    window.history.replaceState(null, '', '/statistics')
    render(<SignInNavigatorContainer />)

    redirectToSignIn()

    expect(nav.replaced).toEqual(['/sign-in?next=%2Fstatistics'])
  })
})
