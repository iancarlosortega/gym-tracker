/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StalePreviewNotice } from './stale-preview-notice.tsx'

afterEach(cleanup)

describe('StalePreviewNotice', () => {
  it('says outright that nothing was applied', () => {
    render(<StalePreviewNotice onRefresh={vi.fn()} />)

    // The user's first question is whether half of it went through.
    expect(screen.getByText(/Nothing was applied/)).toBeDefined()
  })

  it('explains why the preview no longer holds', () => {
    render(<StalePreviewNotice onRefresh={vi.fn()} />)

    expect(screen.getByText(/A set was logged after it was made/)).toBeDefined()
  })

  it('offers a fresh preview as the only way forward', async () => {
    const onRefresh = vi.fn()
    render(<StalePreviewNotice onRefresh={onRefresh} />)

    await userEvent.click(screen.getByRole('button', { name: 'Show me the new preview' }))

    expect(onRefresh).toHaveBeenCalledOnce()
  })
})
