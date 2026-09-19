import { describe, expect, it } from 'vitest'
import { assertSameSiteOrigins, shareRegistrableDomain } from './same-site-origins.ts'

describe('sharing a registrable domain', () => {
  it('accepts two subdomains of one domain', () => {
    expect(shareRegistrableDomain('https://gym.example.com', 'https://api.gym.example.com')).toBe(
      true,
    )
  })

  it('accepts a bare domain and a subdomain of it', () => {
    expect(shareRegistrableDomain('https://example.com', 'https://api.example.com')).toBe(true)
  })

  it('rejects two unrelated hosts, which is the deployment that breaks Safari', () => {
    expect(
      shareRegistrableDomain('https://gym-tracker.vercel.app', 'https://api.railway.app'),
    ).toBe(false)
  })

  it('rejects two subdomains of a public suffix, which only look related', () => {
    expect(shareRegistrableDomain('https://gym.vercel.app', 'https://api.vercel.app')).toBe(false)
  })

  it('handles a multi-part public suffix correctly', () => {
    expect(shareRegistrableDomain('https://gym.example.co.uk', 'https://api.example.co.uk')).toBe(
      true,
    )
    expect(shareRegistrableDomain('https://one.co.uk', 'https://two.co.uk')).toBe(false)
  })

  it('allows localhost against itself, so development still works', () => {
    expect(shareRegistrableDomain('http://localhost:3000', 'http://localhost:3001')).toBe(true)
  })
})

describe('asserting at startup', () => {
  it('passes for a shared registrable domain', () => {
    expect(() =>
      assertSameSiteOrigins('https://gym.example.com', 'https://api.gym.example.com'),
    ).not.toThrow()
  })

  it('refuses to boot when the origins would break cookie authentication', () => {
    expect(() =>
      assertSameSiteOrigins('https://gym-tracker.vercel.app', 'https://api.railway.app'),
    ).toThrow(/registrable domain/i)
  })

  it('names both origins, so the misconfiguration is obvious from the log', () => {
    expect(() => assertSameSiteOrigins('https://a.example.com', 'https://b.other.com')).toThrow(
      /a\.example\.com[\s\S]*b\.other\.com/,
    )
  })

  it('refuses a malformed origin rather than guessing', () => {
    expect(() => assertSameSiteOrigins('not-a-url', 'https://api.example.com')).toThrow(/origin/i)
  })
})
