/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SyncStatus } from './sync-status.tsx'

afterEach(cleanup)

describe('SyncStatus', () => {
  it('says everything is saved when nothing is waiting', () => {
    render(<SyncStatus pending={0} />)

    expect(screen.getByRole('status').textContent).toBe('All sets saved to the server.')
  })

  it('counts what the server has not seen', () => {
    render(<SyncStatus pending={2} />)

    expect(screen.getByRole('status').textContent).toBe('2 sets waiting to sync.')
  })

  it('raises a storage failure as an alert, never a quiet note', () => {
    render(<SyncStatus pending={1} storageFailure="That set could not be saved on this device." />)

    expect(screen.getByRole('alert').textContent).toBe(
      'That set could not be saved on this device.',
    )
  })
})
