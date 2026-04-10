import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shareFile, listPermissions, removePermission, listSharedFolders } from '../driveApi'

// Mock googleAuth to prevent actual token refresh
vi.mock('../googleAuth', () => ({
  refreshToken: vi.fn().mockResolvedValue('refreshed-token'),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const TOKEN = 'test-access-token'
const FILE_ID = 'folder-123'

beforeEach(() => {
  mockFetch.mockReset()
})

describe('listSharedFolders', () => {
  it('queries Drive for sharedWithMe folders', async () => {
    const folders = [
      { id: 'shared-1', name: 'Project A' },
      { id: 'shared-2', name: 'Project B' },
    ]
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ files: folders }) })

    const result = await listSharedFolders(TOKEN)

    expect(result).toEqual(folders)
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('sharedWithMe')
    expect(url).toContain('application%2Fvnd.google-apps.folder')
  })

  it('returns empty array when no shared folders', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    const result = await listSharedFolders(TOKEN)
    expect(result).toEqual([])
  })
})

describe('shareFile', () => {
  it('sends POST with correct permission payload', async () => {
    const permResponse = { id: 'perm-1', type: 'user', role: 'reader', emailAddress: 'bob@example.com', displayName: 'Bob' }
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(permResponse) })

    const result = await shareFile(TOKEN, FILE_ID, 'bob@example.com', 'reader', true)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toContain(`/files/${FILE_ID}/permissions`)
    expect(url).toContain('sendNotificationEmail=true')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body).toEqual({ type: 'user', role: 'reader', emailAddress: 'bob@example.com' })
    expect(result).toEqual(permResponse)
  })

  it('passes notify=false to URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'perm-2' }) })

    await shareFile(TOKEN, FILE_ID, 'bob@example.com', 'writer', false)

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('sendNotificationEmail=false')
  })

  it('retries on 401 with refreshed token', async () => {
    const permResponse = { id: 'perm-3', type: 'user', role: 'commenter' }
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 401, text: () => Promise.resolve('unauthorized') })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(permResponse) })

    const result = await shareFile(TOKEN, FILE_ID, 'bob@example.com', 'commenter')

    expect(mockFetch).toHaveBeenCalledTimes(2)
    const secondCall = mockFetch.mock.calls[1]
    expect(secondCall[1].headers.Authorization).toBe('Bearer refreshed-token')
    expect(result).toEqual(permResponse)
  })

  it('throws on non-401 error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, text: () => Promise.resolve('forbidden') })

    await expect(shareFile(TOKEN, FILE_ID, 'bob@example.com', 'reader')).rejects.toThrow('Drive API error 403')
  })
})

describe('listPermissions', () => {
  it('fetches permissions for a file', async () => {
    const perms = [
      { id: 'perm-1', type: 'user', role: 'owner', emailAddress: 'owner@example.com' },
      { id: 'perm-2', type: 'user', role: 'reader', emailAddress: 'bob@example.com' },
    ]
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ permissions: perms }) })

    const result = await listPermissions(TOKEN, FILE_ID)

    expect(result).toEqual(perms)
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain(`/files/${FILE_ID}/permissions`)
    expect(url).toContain('fields=permissions(id,type,role,emailAddress,displayName)')
  })

  it('returns empty array when no permissions field', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    const result = await listPermissions(TOKEN, FILE_ID)
    expect(result).toEqual([])
  })
})

describe('removePermission', () => {
  it('sends DELETE for the permission', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await removePermission(TOKEN, FILE_ID, 'perm-2')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toContain(`/files/${FILE_ID}/permissions/perm-2`)
    expect(init.method).toBe('DELETE')
  })

  it('throws on error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, text: () => Promise.resolve('not found') })

    await expect(removePermission(TOKEN, FILE_ID, 'perm-bad')).rejects.toThrow('Drive API error 404')
  })
})
