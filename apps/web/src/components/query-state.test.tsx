/** @vitest-environment jsdom */
import type { UseQueryResult } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { QueryState } from './query-state.tsx'

const query = (state: Partial<UseQueryResult<string>>) => state as UseQueryResult<string>

const renderState = (state: Partial<UseQueryResult<string>>) =>
  render(
    <QueryState
      query={query(state)}
      pending={<p>Reading your week…</p>}
      failed={<p>Could not reach the server.</p>}
    >
      {(data) => <p>Got {data}</p>}
    </QueryState>,
  )

afterEach(cleanup)

describe('QueryState', () => {
  it('says the phone is offline instead of loading forever', () => {
    renderState({ isPending: true, fetchStatus: 'paused' })

    expect(screen.getByRole('status').textContent).toMatch(/offline/i)
    expect(screen.queryByText('Reading your week…')).toBeNull()
  })

  it('shows the pending copy while the request is in flight', () => {
    renderState({ isPending: true, fetchStatus: 'fetching' })

    expect(screen.getByText('Reading your week…')).toBeDefined()
  })

  it('shows the failure copy when the read failed', () => {
    renderState({ isPending: false, isError: true, fetchStatus: 'idle' })

    expect(screen.getByText('Could not reach the server.')).toBeDefined()
  })

  it('renders the data once it is there', () => {
    renderState({ isPending: false, isError: false, data: 'three workouts', fetchStatus: 'idle' })

    expect(screen.getByText('Got three workouts')).toBeDefined()
  })
})
