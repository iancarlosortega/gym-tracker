'use client'

import { useEffect } from 'react'

/** Inputs that raise no keyboard, so nothing needs to move for them. */
const NO_KEYBOARD = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
])

const raisesKeyboard = (element: Element | null): element is HTMLElement =>
  (element instanceof HTMLInputElement && !NO_KEYBOARD.has(element.type)) ||
  element instanceof HTMLTextAreaElement ||
  (element instanceof HTMLElement && element.isContentEditable)

const reveal = (element: Element | null) => {
  if (raisesKeyboard(element)) {
    element.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

/**
 * Keeps the field being typed in above the iOS keyboard, app-wide.
 *
 * iOS lays the keyboard over the page instead of shrinking it, then scrolls the
 * focused field into view only if the page has room to scroll. A one-screen
 * page with its form at the bottom (sign-in) has none, so the field stays under
 * the keyboard. The keyboard's height goes into `--keyboard-inset`, which pads
 * the body (globals.css) to make that room, and the field is scrolled up.
 * Android resizes the page itself (`interactiveWidget` in the root layout), so
 * there the inset stays zero.
 */
export const KeyboardInsetContainer = () => {
  useEffect(() => {
    const viewport = globalThis.visualViewport
    if (!viewport) {
      return
    }

    const root = document.documentElement
    let keyboardOpen = false

    const onResize = () => {
      const inset = Math.max(0, Math.round(globalThis.innerHeight - viewport.height))
      root.style.setProperty('--keyboard-inset', `${inset}px`)
      keyboardOpen = inset > 0
      if (keyboardOpen) {
        reveal(document.activeElement)
      }
    }

    // Moving to the next field keeps the keyboard up, so no resize follows.
    const onFocus = (event: FocusEvent) => {
      if (keyboardOpen) {
        reveal(event.target as Element | null)
      }
    }

    viewport.addEventListener('resize', onResize)
    document.addEventListener('focusin', onFocus)
    return () => {
      viewport.removeEventListener('resize', onResize)
      document.removeEventListener('focusin', onFocus)
      root.style.removeProperty('--keyboard-inset')
    }
  }, [])

  return null
}
