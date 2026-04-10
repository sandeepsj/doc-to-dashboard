import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Must mock googleAuth BEFORE importing useAuth
const mockRestoreSession = vi.fn()
const mockHasSavedUser = vi.fn()
const mockTryRefreshSession = vi.fn()
const mockIsAuthAvailable = vi.fn()
const mockSignIn = vi.fn()
const mockSignOut = vi.fn()

vi.mock('../../services/googleAuth', () => ({
  isAuthAvailable: () => mockIsAuthAvailable(),
  restoreSession: () => mockRestoreSession(),
  hasSavedUser: () => mockHasSavedUser(),
  tryRefreshSession: () => mockTryRefreshSession(),
  signIn: () => mockSignIn(),
  signOut: () => mockSignOut(),
}))

import { useAuth } from '../useAuth'

beforeEach(() => {
  mockRestoreSession.mockReset()
  mockHasSavedUser.mockReset()
  mockTryRefreshSession.mockReset()
  mockIsAuthAvailable.mockReturnValue(true)
  mockSignIn.mockReset()
  mockSignOut.mockReset()
})

const validSession = {
  isLoggedIn: true,
  user: { email: 'a@b.com', name: 'Alice', picture: '' },
  accessToken: 'valid-token',
}

describe('useAuth', () => {
  describe('session restore on mount', () => {
    it('restores a valid session from storage', () => {
      mockRestoreSession.mockReturnValue(validSession)

      const { result } = renderHook(() => useAuth())

      expect(result.current.auth).toEqual(validSession)
      expect(mockTryRefreshSession).not.toHaveBeenCalled()
    })

    it('stays logged out when no saved user and no token', () => {
      mockRestoreSession.mockReturnValue(null)
      mockHasSavedUser.mockReturnValue(false)

      const { result } = renderHook(() => useAuth())

      expect(result.current.auth.isLoggedIn).toBe(false)
      expect(mockTryRefreshSession).not.toHaveBeenCalled()
    })

    it('tries silent refresh when token expired but user info exists', async () => {
      mockRestoreSession.mockReturnValue(null)
      mockHasSavedUser.mockReturnValue(true)
      mockTryRefreshSession.mockResolvedValue(validSession)

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.auth).toEqual(validSession)
      })
      expect(mockTryRefreshSession).toHaveBeenCalledTimes(1)
    })

    it('stays logged out when silent refresh fails', async () => {
      mockRestoreSession.mockReturnValue(null)
      mockHasSavedUser.mockReturnValue(true)
      mockTryRefreshSession.mockResolvedValue(null)

      const { result } = renderHook(() => useAuth())

      // Give the async refresh time to resolve
      await new Promise((r) => setTimeout(r, 50))
      expect(result.current.auth.isLoggedIn).toBe(false)
    })

    it('does nothing when auth is not available', () => {
      mockIsAuthAvailable.mockReturnValue(false)

      const { result } = renderHook(() => useAuth())

      expect(result.current.auth.isLoggedIn).toBe(false)
      expect(mockRestoreSession).not.toHaveBeenCalled()
    })
  })

  describe('signIn', () => {
    it('updates auth state on successful sign-in', async () => {
      mockRestoreSession.mockReturnValue(null)
      mockHasSavedUser.mockReturnValue(false)
      mockSignIn.mockResolvedValue(validSession)

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn()
      })

      expect(result.current.auth).toEqual(validSession)
    })

    it('stays logged out on sign-in failure', async () => {
      mockRestoreSession.mockReturnValue(null)
      mockHasSavedUser.mockReturnValue(false)
      mockSignIn.mockRejectedValue(new Error('popup blocked'))

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn()
      })

      expect(result.current.auth.isLoggedIn).toBe(false)
    })
  })

  describe('signOut', () => {
    it('clears auth state', () => {
      mockRestoreSession.mockReturnValue(validSession)

      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.signOut()
      })

      expect(result.current.auth.isLoggedIn).toBe(false)
      expect(result.current.auth.user).toBeNull()
      expect(mockSignOut).toHaveBeenCalled()
    })
  })
})
