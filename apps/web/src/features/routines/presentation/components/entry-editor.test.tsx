/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EntryEditor } from './entry-editor.tsx'

afterEach(cleanup)

const squat = { targetSets: 3, targetReps: '8-10', restSeconds: 120 }
const props = { pending: false, failed: false }

describe('EntryEditor', () => {
  it('changes Squat to 4 sets of 6–8 with 3:00 rest', async () => {
    const onSave = vi.fn()
    render(<EntryEditor {...props} entry={squat} onSave={onSave} onRemove={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'One more set' }))
    await userEvent.clear(screen.getByLabelText('From'))
    await userEvent.type(screen.getByLabelText('From'), '6')
    await userEvent.clear(screen.getByLabelText('To'))
    await userEvent.type(screen.getByLabelText('To'), '8')
    await userEvent.click(screen.getByRole('radio', { name: '3:00' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith({
      targetSets: 4,
      targetRepsMin: 6,
      targetRepsMax: 8,
      restSeconds: 180,
    })
  })

  it('starts from what the plan already says', () => {
    render(<EntryEditor {...props} entry={squat} onSave={vi.fn()} onRemove={vi.fn()} />)

    expect(screen.getByText('3')).toBeDefined()
    expect((screen.getByLabelText('From') as HTMLInputElement).value).toBe('8')
    expect((screen.getByLabelText('To') as HTMLInputElement).value).toBe('10')
    expect((screen.getByRole('radio', { name: '2:00' }) as HTMLInputElement).checked).toBe(true)
  })

  it('never goes below one set', async () => {
    render(
      <EntryEditor
        {...props}
        entry={{ ...squat, targetSets: 1 }}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'One fewer set' }).hasAttribute('disabled')).toBe(
      true,
    )
  })

  it('refuses a range that ends below where it starts, as the domain does', async () => {
    const onSave = vi.fn()
    render(<EntryEditor {...props} entry={squat} onSave={onSave} onRemove={vi.fn()} />)

    await userEvent.clear(screen.getByLabelText('To'))
    await userEvent.type(screen.getByLabelText('To'), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toMatch(/cannot end below/i)
  })

  it('removes the exercise from the routine', async () => {
    const onRemove = vi.fn()
    render(<EntryEditor {...props} entry={squat} onSave={vi.fn()} onRemove={onRemove} />)

    await userEvent.click(screen.getByRole('button', { name: /remove/i }))

    expect(onRemove).toHaveBeenCalledOnce()
  })
})
