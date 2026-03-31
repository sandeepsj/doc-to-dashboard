import { describe, it, expect, vi } from 'vitest'
import { FallbackStorageProvider } from '../fallbackStorageProvider'
import type { StorageProvider } from '../storageProvider'
import type { Comment } from '../../types'

function mockProvider(overrides: Partial<StorageProvider> = {}): StorageProvider {
  return {
    listProjects: vi.fn().mockResolvedValue([]),
    loadDocument: vi.fn().mockResolvedValue(''),
    saveDocument: vi.fn().mockResolvedValue(undefined),
    deleteDocument: vi.fn().mockResolvedValue(undefined),
    loadComments: vi.fn().mockResolvedValue([]),
    saveComments: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const sampleComment: Comment = {
  id: '1', docId: 'doc-1', sectionIndex: 0, lineNumber: 5,
  sectionType: 'paragraph', sectionSnippet: 'hi', kind: 'note',
  text: 'test', resolved: false, createdAt: '2026-01-01', resolvedAt: null,
}

describe('FallbackStorageProvider', () => {
  it('uses primary for loadComments when it succeeds', async () => {
    const primary = mockProvider({ loadComments: vi.fn().mockResolvedValue([sampleComment]) })
    const fallback = mockProvider()
    const provider = new FallbackStorageProvider(primary, fallback)

    const result = await provider.loadComments('doc-1')
    expect(result).toHaveLength(1)
    expect(primary.loadComments).toHaveBeenCalledWith('doc-1')
    expect(fallback.loadComments).not.toHaveBeenCalled()
  })

  it('falls back when primary loadComments fails', async () => {
    const primary = mockProvider({ loadComments: vi.fn().mockRejectedValue(new Error('network')) })
    const fallback = mockProvider({ loadComments: vi.fn().mockResolvedValue([sampleComment]) })
    const provider = new FallbackStorageProvider(primary, fallback)

    const result = await provider.loadComments('doc-1')
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('test')
  })

  it('uses primary for saveComments when it succeeds', async () => {
    const primary = mockProvider()
    const fallback = mockProvider()
    const provider = new FallbackStorageProvider(primary, fallback)

    await provider.saveComments('doc-1', [sampleComment])
    expect(primary.saveComments).toHaveBeenCalledWith('doc-1', [sampleComment])
    expect(fallback.saveComments).not.toHaveBeenCalled()
  })

  it('falls back when primary saveComments fails', async () => {
    const primary = mockProvider({ saveComments: vi.fn().mockRejectedValue(new Error('fail')) })
    const fallback = mockProvider()
    const provider = new FallbackStorageProvider(primary, fallback)

    await provider.saveComments('doc-1', [sampleComment])
    expect(fallback.saveComments).toHaveBeenCalledWith('doc-1', [sampleComment])
  })

  it('migrates fallback comments to primary when primary returns empty', async () => {
    const primary = mockProvider({
      loadComments: vi.fn().mockResolvedValue([]),
      saveComments: vi.fn().mockResolvedValue(undefined),
    })
    const fallback = mockProvider({ loadComments: vi.fn().mockResolvedValue([sampleComment]) })
    const provider = new FallbackStorageProvider(primary, fallback)

    const result = await provider.loadComments('doc-1')
    expect(result).toHaveLength(1)
    expect(primary.saveComments).toHaveBeenCalledWith('doc-1', [sampleComment])
  })

  it('uses primary for listProjects when it succeeds', async () => {
    const primary = mockProvider({ listProjects: vi.fn().mockResolvedValue([{ id: 'p1', name: 'P', files: [] }]) })
    const fallback = mockProvider()
    const provider = new FallbackStorageProvider(primary, fallback)

    const result = await provider.listProjects()
    expect(result).toHaveLength(1)
  })

  it('falls back for listProjects when primary fails', async () => {
    const primary = mockProvider({ listProjects: vi.fn().mockRejectedValue(new Error('fail')) })
    const fallback = mockProvider({ listProjects: vi.fn().mockResolvedValue([{ id: 'f1', name: 'F', files: [] }]) })
    const provider = new FallbackStorageProvider(primary, fallback)

    const result = await provider.listProjects()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('f1')
  })
})
