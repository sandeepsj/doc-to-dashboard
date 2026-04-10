import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useShareProject } from '../useShareProject'

const mockListPermissions = vi.fn()
const mockShareFile = vi.fn()
const mockRemovePermission = vi.fn()

vi.mock('../../services/driveApi', () => ({
  listPermissions: (...args: unknown[]) => mockListPermissions(...args),
  shareFile: (...args: unknown[]) => mockShareFile(...args),
  removePermission: (...args: unknown[]) => mockRemovePermission(...args),
}))

const TOKEN = 'test-token'
const FOLDER_ID = 'folder-abc'

beforeEach(() => {
  mockListPermissions.mockReset()
  mockShareFile.mockReset()
  mockRemovePermission.mockReset()
})

describe('useShareProject', () => {
  describe('initial load', () => {
    it('loads permissions on mount', async () => {
      const perms = [{ id: 'p1', type: 'user', role: 'reader', emailAddress: 'a@b.com' }]
      mockListPermissions.mockResolvedValueOnce(perms)

      const { result } = renderHook(() => useShareProject(TOKEN, FOLDER_ID))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.permissions).toEqual(perms)
      expect(mockListPermissions).toHaveBeenCalledWith(TOKEN, FOLDER_ID)
    })

    it('does not load when token is null', () => {
      mockListPermissions.mockResolvedValueOnce([])
      renderHook(() => useShareProject(null, FOLDER_ID))
      expect(mockListPermissions).not.toHaveBeenCalled()
    })

    it('does not load when folderId is null', () => {
      mockListPermissions.mockResolvedValueOnce([])
      renderHook(() => useShareProject(TOKEN, null))
      expect(mockListPermissions).not.toHaveBeenCalled()
    })

    it('sets error on load failure', async () => {
      mockListPermissions.mockRejectedValueOnce(new Error('Network fail'))

      const { result } = renderHook(() => useShareProject(TOKEN, FOLDER_ID))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.error).toBe('Network fail')
      expect(result.current.permissions).toEqual([])
    })
  })

  describe('share', () => {
    it('adds a permission and updates state', async () => {
      mockListPermissions.mockResolvedValueOnce([])
      const newPerm = { id: 'p2', type: 'user', role: 'writer', emailAddress: 'x@y.com', displayName: 'X' }
      mockShareFile.mockResolvedValueOnce(newPerm)

      const { result } = renderHook(() => useShareProject(TOKEN, FOLDER_ID))

      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.share('x@y.com', 'writer', true)
      })

      expect(result.current.permissions).toEqual([newPerm])
      expect(mockShareFile).toHaveBeenCalledWith(TOKEN, FOLDER_ID, 'x@y.com', 'writer', true)
    })

    it('sets error on share failure', async () => {
      mockListPermissions.mockResolvedValueOnce([])
      mockShareFile.mockRejectedValueOnce(new Error('Permission denied'))

      const { result } = renderHook(() => useShareProject(TOKEN, FOLDER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        try {
          await result.current.share('bad@email.com', 'reader')
        } catch { /* expected */ }
      })

      expect(result.current.error).toBe('Permission denied')
    })

    it('sets sharing flag during share operation', async () => {
      mockListPermissions.mockResolvedValueOnce([])
      let resolveShare: (v: unknown) => void
      mockShareFile.mockReturnValueOnce(new Promise((r) => { resolveShare = r }))

      const { result } = renderHook(() => useShareProject(TOKEN, FOLDER_ID))
      await waitFor(() => expect(result.current.loading).toBe(false))

      let sharePromise: Promise<void>
      act(() => {
        sharePromise = result.current.share('x@y.com', 'reader')
      })

      expect(result.current.sharing).toBe(true)

      await act(async () => {
        resolveShare!({ id: 'p3', type: 'user', role: 'reader' })
        await sharePromise!
      })

      expect(result.current.sharing).toBe(false)
    })
  })

  describe('revoke', () => {
    it('removes a permission from state', async () => {
      const perms = [
        { id: 'p1', type: 'user', role: 'reader', emailAddress: 'a@b.com' },
        { id: 'p2', type: 'user', role: 'writer', emailAddress: 'x@y.com' },
      ]
      mockListPermissions.mockResolvedValueOnce(perms)
      mockRemovePermission.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useShareProject(TOKEN, FOLDER_ID))
      await waitFor(() => expect(result.current.permissions).toHaveLength(2))

      await act(async () => {
        await result.current.revoke('p1')
      })

      expect(result.current.permissions).toEqual([perms[1]])
      expect(mockRemovePermission).toHaveBeenCalledWith(TOKEN, FOLDER_ID, 'p1')
    })

    it('sets error on revoke failure', async () => {
      mockListPermissions.mockResolvedValueOnce([{ id: 'p1', type: 'user', role: 'reader' }])
      mockRemovePermission.mockRejectedValueOnce(new Error('Cannot remove'))

      const { result } = renderHook(() => useShareProject(TOKEN, FOLDER_ID))
      await waitFor(() => expect(result.current.permissions).toHaveLength(1))

      await act(async () => {
        try {
          await result.current.revoke('p1')
        } catch { /* expected */ }
      })

      expect(result.current.error).toBe('Cannot remove')
    })
  })

  describe('clearError', () => {
    it('clears the error state', async () => {
      mockListPermissions.mockRejectedValueOnce(new Error('fail'))

      const { result } = renderHook(() => useShareProject(TOKEN, FOLDER_ID))
      await waitFor(() => expect(result.current.error).toBe('fail'))

      act(() => result.current.clearError())
      expect(result.current.error).toBeNull()
    })
  })
})
