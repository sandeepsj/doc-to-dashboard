import { describe, it, expect, beforeEach } from 'vitest'
import { saveSession, loadSession, clearSession, restoreSession, hasSavedUser } from '../googleAuth'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('saveSession', () => {
  it('saves user and token to localStorage', () => {
    saveSession({ email: 'a@b.com', name: 'Alice', picture: '' }, 'tok-123')

    expect(localStorage.getItem('dtd_user')).toContain('a@b.com')
    expect(localStorage.getItem('dtd_token')).toBe('tok-123')
  })

  it('saves expiry timestamp when expiresIn is provided', () => {
    const before = Date.now()
    saveSession({ email: 'a@b.com', name: 'Alice', picture: '' }, 'tok-123', 3600)

    const expiresAt = Number(localStorage.getItem('dtd_token_expires'))
    // Should be ~3540s (3600 - 60 buffer) from now
    expect(expiresAt).toBeGreaterThan(before)
    expect(expiresAt).toBeLessThanOrEqual(before + 3600 * 1000)
  })
})

describe('loadSession', () => {
  it('returns session when both user and token exist', () => {
    localStorage.setItem('dtd_user', JSON.stringify({ email: 'a@b.com', name: 'Alice', picture: '' }))
    localStorage.setItem('dtd_token', 'tok-123')

    const session = loadSession()
    expect(session).not.toBeNull()
    expect(session!.isLoggedIn).toBe(true)
    expect(session!.user!.email).toBe('a@b.com')
    expect(session!.accessToken).toBe('tok-123')
  })

  it('returns null when token is missing', () => {
    localStorage.setItem('dtd_user', JSON.stringify({ email: 'a@b.com', name: 'Alice', picture: '' }))
    expect(loadSession()).toBeNull()
  })

  it('returns null when user is missing', () => {
    localStorage.setItem('dtd_token', 'tok-123')
    expect(loadSession()).toBeNull()
  })

  it('returns null when localStorage is empty', () => {
    expect(loadSession()).toBeNull()
  })
})

describe('clearSession', () => {
  it('removes all session keys from localStorage', () => {
    localStorage.setItem('dtd_user', 'x')
    localStorage.setItem('dtd_token', 'x')
    localStorage.setItem('dtd_token_expires', 'x')

    clearSession()

    expect(localStorage.getItem('dtd_user')).toBeNull()
    expect(localStorage.getItem('dtd_token')).toBeNull()
    expect(localStorage.getItem('dtd_token_expires')).toBeNull()
  })

  it('also cleans up legacy sessionStorage key', () => {
    sessionStorage.setItem('dtd_token', 'old')

    clearSession()

    expect(sessionStorage.getItem('dtd_token')).toBeNull()
  })
})

describe('restoreSession', () => {
  it('returns session when token is not expired', () => {
    localStorage.setItem('dtd_user', JSON.stringify({ email: 'a@b.com', name: 'Alice', picture: '' }))
    localStorage.setItem('dtd_token', 'tok-valid')
    localStorage.setItem('dtd_token_expires', String(Date.now() + 3600_000))

    const result = restoreSession()
    expect(result).not.toBeNull()
    expect(result!.accessToken).toBe('tok-valid')
  })

  it('returns null when token is expired', () => {
    localStorage.setItem('dtd_user', JSON.stringify({ email: 'a@b.com', name: 'Alice', picture: '' }))
    localStorage.setItem('dtd_token', 'tok-expired')
    localStorage.setItem('dtd_token_expires', String(Date.now() - 1000))

    const result = restoreSession()
    expect(result).toBeNull()
  })

  it('returns null when no expiry is stored (treats as expired)', () => {
    localStorage.setItem('dtd_user', JSON.stringify({ email: 'a@b.com', name: 'Alice', picture: '' }))
    localStorage.setItem('dtd_token', 'tok-no-expiry')

    const result = restoreSession()
    expect(result).toBeNull()
  })
})

describe('hasSavedUser', () => {
  it('returns true when user info exists in localStorage', () => {
    localStorage.setItem('dtd_user', JSON.stringify({ email: 'a@b.com', name: 'Alice', picture: '' }))
    expect(hasSavedUser()).toBe(true)
  })

  it('returns false when no user info', () => {
    expect(hasSavedUser()).toBe(false)
  })
})
