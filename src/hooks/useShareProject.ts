import { useCallback, useEffect, useState } from 'react'
import type { DrivePermission, DrivePermissionRole } from '../types/drive'
import { listPermissions, shareFile, removePermission } from '../services/driveApi'

interface UseShareProjectReturn {
  permissions: DrivePermission[]
  loading: boolean
  sharing: boolean
  error: string | null
  loadPermissions: () => Promise<void>
  share: (email: string, role: DrivePermissionRole, notify?: boolean) => Promise<void>
  revoke: (permissionId: string) => Promise<void>
  clearError: () => void
}

export function useShareProject(token: string | null, folderId: string | null): UseShareProjectReturn {
  const [permissions, setPermissions] = useState<DrivePermission[]>([])
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPerms = useCallback(async () => {
    if (!token || !folderId) return
    setLoading(true)
    setError(null)
    try {
      const perms = await listPermissions(token, folderId)
      setPermissions(perms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }, [token, folderId])

  useEffect(() => {
    loadPerms()
  }, [loadPerms])

  const share = useCallback(async (email: string, role: DrivePermissionRole, notify = true) => {
    if (!token || !folderId) return
    setSharing(true)
    setError(null)
    try {
      const perm = await shareFile(token, folderId, email, role, notify)
      setPermissions((prev) => [...prev, perm])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to share'
      setError(msg)
      throw err
    } finally {
      setSharing(false)
    }
  }, [token, folderId])

  const revoke = useCallback(async (permissionId: string) => {
    if (!token || !folderId) return
    setError(null)
    try {
      await removePermission(token, folderId, permissionId)
      setPermissions((prev) => prev.filter((p) => p.id !== permissionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove access')
      throw err
    }
  }, [token, folderId])

  const clearError = useCallback(() => setError(null), [])

  return { permissions, loading, sharing, error, loadPermissions: loadPerms, share, revoke, clearError }
}
