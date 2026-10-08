/** @vitest-environment jsdom */
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KeyboardInsetContainer } from './keyboard-inset.container.tsx'

/** A stand-in for iOS's visual viewport: the part of the screen the keyboard leaves. */
class FakeViewport extends EventTarget {
  height = 844
}

let viewport: FakeViewport

const openKeyboard = (height: number) =>
  act(() => {
    viewport.height = 844 - height
    viewport.dispatchEvent(new Event('resize'))
  })

const closeKeyboard = () => openKeyboard(0)

const field = (type = 'text') => {
  const input = document.createElement('input')
  input.type = type
  input.scrollIntoView = vi.fn()
  document.body.append(input)
  return input
}

const inset = () => document.documentElement.style.getPropertyValue('--keyboard-inset')

beforeEach(() => {
  viewport = new FakeViewport()
  vi.stubGlobal('visualViewport', viewport)
  vi.stubGlobal('innerHeight', 844)
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--keyboard-inset')
  vi.unstubAllGlobals()
})

describe('KeyboardInsetContainer', () => {
  it('makes room under the page for the keyboard, so there is something to scroll', () => {
    render(<KeyboardInsetContainer />)

    openKeyboard(336)

    expect(inset()).toBe('336px')
  })

  it('brings the field being typed in above the keyboard', () => {
    render(<KeyboardInsetContainer />)
    const email = field('email')
    email.focus()

    openKeyboard(336)

    expect(email.scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
  })

  it('follows focus to the next field while the keyboard stays open', () => {
    render(<KeyboardInsetContainer />)
    field('email').focus()
    openKeyboard(336)
    const password = field('password')

    act(() => password.focus())

    expect(password.scrollIntoView).toHaveBeenCalled()
  })

  it('gives the room back when the keyboard closes', () => {
    render(<KeyboardInsetContainer />)
    openKeyboard(336)

    closeKeyboard()

    expect(inset()).toBe('0px')
  })

  it('leaves controls that raise no keyboard alone', () => {
    render(<KeyboardInsetContainer />)
    const box = field('checkbox')
    box.focus()

    openKeyboard(336)

    expect(box.scrollIntoView).not.toHaveBeenCalled()
  })

  it('does nothing where there is no visual viewport', () => {
    vi.stubGlobal('visualViewport', undefined)

    expect(() => render(<KeyboardInsetContainer />)).not.toThrow()
  })
})
