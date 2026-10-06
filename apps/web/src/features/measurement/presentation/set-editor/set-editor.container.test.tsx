/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IndexedDbSetRepository } from '../../infrastructure/indexed-db-set.repository'
import type { DoneSet } from '../workout/done-sets'
import { SetEditorContainer } from './set-editor.container.tsx'

const server = vi.hoisted(() => ({
  corrected: [] as { id: string; body: unknown }[],
  deleted: [] as string[],
}))

vi.mock('../../infrastructure/sets.api', () => ({
  correctSet: async (id: string, body: unknown) => {
    server.corrected.push({ id, body })
    return {}
  },
  deleteSet: async (id: string) => {
    server.deleted.push(id)
  },
}))

vi.mock('../../infrastructure/session-sets.api', () => ({ getSessionSets: async () => [] }))
vi.mock('../../../auth/presentation/queries', () => ({ useDisplayUnit: () => 'KG' }))

afterEach(cleanup)

const bench: DoneSet = {
  id: '0199a1f0-0000-7000-8000-0000000000b1',
  exerciseId: 'e-1',
  equipmentId: 'q-1',
  mode: 'PER_SIDE',
  loggedAt: new Date('2026-10-05T18:10:00Z'),
  grams: 60_000,
  rawGrams: 20_000,
  position: null,
  reps: 8,
  pending: false,
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  server.corrected = []
  server.deleted = []
})

const renderEditor = (onClose = vi.fn()) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <SetEditorContainer
        sessionId="w-1"
        queue={new IndexedDbSetRepository()}
        set={bench}
        setNumber={2}
        perHand={false}
        onClose={onClose}
      />
    </QueryClientProvider>,
  )
  return { onClose }
}

describe('SetEditorContainer', () => {
  it('opens on the per-side value as it was typed', () => {
    renderEditor()

    expect(screen.getByRole('button', { name: 'Weight per side, 20 kilograms' })).toBeDefined()
  })

  it('saves the correction and closes', async () => {
    const { onClose } = renderEditor()

    await userEvent.click(screen.getByRole('button', { name: '2' }))
    await userEvent.click(screen.getByRole('button', { name: '5' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(server.corrected).toEqual([{ id: bench.id, body: { grams: 25_000, reps: 8 } }]),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('deletes the set and closes', async () => {
    const { onClose } = renderEditor()

    await userEvent.click(screen.getByRole('button', { name: 'Delete set 2' }))

    await waitFor(() => expect(server.deleted).toEqual([bench.id]))
    expect(onClose).toHaveBeenCalled()
  })
})
