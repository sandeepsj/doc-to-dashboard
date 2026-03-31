import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageProvider } from '../localStorageProvider'
import type { Comment } from '../../types'

describe('LocalStorageProvider', () => {
  const provider = new LocalStorageProvider()

  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadComments', () => {
    it('returns empty array when no data', async () => {
      const comments = await provider.loadComments('doc-1')
      expect(comments).toEqual([])
    })

    it('loads comments from localStorage', async () => {
      const data: Comment[] = [{
        id: '1', docId: 'doc-1', sectionIndex: 0, lineNumber: 5,
        sectionType: 'paragraph', sectionSnippet: 'hi', kind: 'note',
        text: 'test', resolved: false, createdAt: '2026-01-01', resolvedAt: null,
      }]
      localStorage.setItem('doc-comments-doc-1', JSON.stringify(data))

      const comments = await provider.loadComments('doc-1')
      expect(comments).toHaveLength(1)
      expect(comments[0].text).toBe('test')
    })

    it('returns empty array for invalid JSON', async () => {
      localStorage.setItem('doc-comments-doc-1', 'not json')
      const comments = await provider.loadComments('doc-1')
      expect(comments).toEqual([])
    })

    it('migrates comments without lineNumber', async () => {
      const data = [{ id: '1', docId: 'doc-1', sectionIndex: 0, sectionType: 'paragraph', sectionSnippet: 'hi', kind: 'note', text: 'old', resolved: false, createdAt: '', resolvedAt: null }]
      localStorage.setItem('doc-comments-doc-1', JSON.stringify(data))

      const comments = await provider.loadComments('doc-1')
      expect(comments[0].lineNumber).toBe(0)
    })
  })

  describe('saveComments', () => {
    it('saves to localStorage', async () => {
      const comments: Comment[] = [{
        id: '1', docId: 'doc-1', sectionIndex: 0, lineNumber: 10,
        sectionType: 'heading', sectionSnippet: 'Title', kind: 'mistake',
        text: 'fix', resolved: false, createdAt: '2026-01-01', resolvedAt: null,
      }]

      await provider.saveComments('doc-1', comments)

      const stored = JSON.parse(localStorage.getItem('doc-comments-doc-1')!)
      expect(stored).toHaveLength(1)
      expect(stored[0].text).toBe('fix')
    })
  })

  describe('saveDocument / deleteDocument', () => {
    it('saveDocument is a no-op', async () => {
      await expect(provider.saveDocument('p', 'f.md', 'content')).resolves.toBeUndefined()
    })

    it('deleteDocument is a no-op', async () => {
      await expect(provider.deleteDocument('p', 'f.md')).resolves.toBeUndefined()
    })
  })
})
