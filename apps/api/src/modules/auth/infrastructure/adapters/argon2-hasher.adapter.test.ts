import { PasswordHash } from '@gym/domain/auth/value-objects/password-hash.vo'
import { describe, expect, it } from 'vitest'
import { Argon2Hasher } from './argon2-hasher.adapter.ts'

const hasher = new Argon2Hasher()

describe('argon2 hasher', () => {
  it('never stores the password it was given', async () => {
    const stored = await hasher.hash('correct horse battery')

    expect(stored.value).not.toContain('correct horse battery')
    expect(stored.value.startsWith('$argon2id$')).toBe(true)
  })

  it('verifies the password it hashed', async () => {
    const stored = await hasher.hash('correct horse battery')

    expect(await hasher.verify('correct horse battery', stored)).toBe(true)
  })

  it('rejects a different password', async () => {
    const stored = await hasher.hash('correct horse battery')

    expect(await hasher.verify('wrong', stored)).toBe(false)
  })

  it('produces a different hash each time, so equal passwords are not detectable', async () => {
    const first = await hasher.hash('same password')
    const second = await hasher.hash('same password')

    expect(first.value).not.toBe(second.value)
  })

  it('treats a corrupt stored hash as a failed verification rather than throwing', async () => {
    expect(await hasher.verify('anything', PasswordHash.create('not-a-hash'))).toBe(false)
  })
})
