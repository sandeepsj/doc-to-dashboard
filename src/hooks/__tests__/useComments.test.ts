import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useComments } from '../useComments'
import { LocalStorageProvider } from '../../backends/localStorageProvider'
import type { DashboardSection, ParsedDocument } from '../../types'

const mockSection: DashboardSection = { type: 'paragraph', html: '<p>Hello world</p>', lineStart: 5 }
const mockHeading: DashboardSection = { type: 'heading', id: 'h1', depth: 1, text: 'Title', lineStart: 1 }
const provider = new LocalStorageProvider()

function makeMockDoc(sections: DashboardSection[] = [mockSection, mockHeading]): ParsedDocument {
  return { id: 'doc-1', name: 'test', sections, headings: [] }
}

describe('useComments', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('addComment', () => {
    it('adds a comment with correct fields', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => {
        result.current.addComment(0, mockSection, 'my comment', 'note')
      })

      expect(result.current.comments).toHaveLength(1)
      const c = result.current.comments[0]
      expect(c.docId).toBe('doc-1')
      expect(c.sectionIndex).toBe(0)
      expect(c.lineNumber).toBe(5)
      expect(c.sectionType).toBe('paragraph')
      expect(c.text).toBe('my comment')
      expect(c.kind).toBe('note')
      expect(c.resolved).toBe(false)
      expect(c.resolvedAt).toBeNull()
      expect(c.id).toBeTruthy()
      expect(c.createdAt).toBeTruthy()
    })

    it('is no-op when docId is null', () => {
      const { result } = renderHook(() => useComments(null, provider))

      act(() => {
        result.current.addComment(0, mockSection, 'ignored', 'note')
      })

      expect(result.current.comments).toHaveLength(0)
    })

    it('supports all comment kinds', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => {
        result.current.addComment(0, mockSection, 'a', 'clarification')
        result.current.addComment(0, mockSection, 'b', 'change-request')
        result.current.addComment(0, mockSection, 'c', 'mistake')
      })

      expect(result.current.comments.map((c) => c.kind)).toEqual(['clarification', 'change-request', 'mistake'])
    })
  })

  describe('resolveComment', () => {
    it('sets resolved and resolvedAt', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => result.current.addComment(0, mockSection, 'test', 'note'))
      const id = result.current.comments[0].id

      act(() => result.current.resolveComment(id))

      expect(result.current.comments[0].resolved).toBe(true)
      expect(result.current.comments[0].resolvedAt).toBeTruthy()
    })
  })

  describe('unresolveComment', () => {
    it('clears resolved state', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => result.current.addComment(0, mockSection, 'test', 'note'))
      const id = result.current.comments[0].id
      act(() => result.current.resolveComment(id))
      act(() => result.current.unresolveComment(id))

      expect(result.current.comments[0].resolved).toBe(false)
      expect(result.current.comments[0].resolvedAt).toBeNull()
    })
  })

  describe('deleteComment', () => {
    it('removes the comment by id', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => {
        result.current.addComment(0, mockSection, 'a', 'note')
        result.current.addComment(1, mockHeading, 'b', 'mistake')
      })

      const idToDelete = result.current.comments[0].id
      act(() => result.current.deleteComment(idToDelete))

      expect(result.current.comments).toHaveLength(1)
      expect(result.current.comments[0].text).toBe('b')
    })
  })

  describe('commentCountBySection', () => {
    it('counts only unresolved comments per section', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => {
        result.current.addComment(0, mockSection, 'a', 'note')
        result.current.addComment(0, mockSection, 'b', 'note')
        result.current.addComment(1, mockHeading, 'c', 'note')
      })

      // Resolve one on section 0
      const id = result.current.comments[0].id
      act(() => result.current.resolveComment(id))

      expect(result.current.commentCountBySection.get(0)).toBe(1)
      expect(result.current.commentCountBySection.get(1)).toBe(1)
    })

    it('excludes resolved comments entirely', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => result.current.addComment(0, mockSection, 'only one', 'note'))
      const id = result.current.comments[0].id
      act(() => result.current.resolveComment(id))

      expect(result.current.commentCountBySection.get(0)).toBeUndefined()
    })
  })

  describe('localStorage persistence', () => {
    it('saves comments to localStorage', async () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => useComments('doc-1', provider))

      // Wait for async load
      await act(async () => { await vi.advanceTimersByTimeAsync(50) })

      act(() => result.current.addComment(0, mockSection, 'persisted', 'note'))

      // Advance past debounce (300ms)
      await act(async () => { await vi.advanceTimersByTimeAsync(400) })

      const stored = JSON.parse(localStorage.getItem('doc-comments-doc-1')!)
      expect(stored).toHaveLength(1)
      expect(stored[0].text).toBe('persisted')

      vi.useRealTimers()
    })

    it('loads comments from localStorage on init', async () => {
      const existing = [{ id: 'x', docId: 'doc-1', sectionIndex: 0, lineNumber: 0, sectionType: 'paragraph', sectionSnippet: 'hi', kind: 'note', text: 'loaded', resolved: false, createdAt: '2026-01-01', resolvedAt: null }]
      localStorage.setItem('doc-comments-doc-1', JSON.stringify(existing))

      const { result } = renderHook(() => useComments('doc-1', provider))

      await waitFor(() => {
        expect(result.current.comments).toHaveLength(1)
        expect(result.current.comments[0].text).toBe('loaded')
      })
    })

    it('returns empty array for invalid JSON', async () => {
      localStorage.setItem('doc-comments-doc-1', 'not json')
      const { result } = renderHook(() => useComments('doc-1', provider))
      await waitFor(() => {
        expect(result.current.comments).toEqual([])
      })
    })

    it('reloads when docId changes', async () => {
      const commentsA = [{ id: 'a', docId: 'a', sectionIndex: 0, lineNumber: 0, sectionType: 'paragraph', sectionSnippet: '', kind: 'note', text: 'from A', resolved: false, createdAt: '', resolvedAt: null }]
      const commentsB = [{ id: 'b', docId: 'b', sectionIndex: 0, lineNumber: 0, sectionType: 'paragraph', sectionSnippet: '', kind: 'note', text: 'from B', resolved: false, createdAt: '', resolvedAt: null }]
      localStorage.setItem('doc-comments-a', JSON.stringify(commentsA))
      localStorage.setItem('doc-comments-b', JSON.stringify(commentsB))

      const { result, rerender } = renderHook(({ docId }) => useComments(docId, provider), { initialProps: { docId: 'a' } })

      await waitFor(() => {
        expect(result.current.comments[0]?.text).toBe('from A')
      })

      rerender({ docId: 'b' })

      await waitFor(() => {
        expect(result.current.comments[0]?.text).toBe('from B')
      })
    })
  })

  describe('exportComments', () => {
    it('produces correct plain text format', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => {
        result.current.addComment(0, mockSection, 'fix this', 'change-request')
      })

      const doc = makeMockDoc()
      const exported = result.current.exportComments(doc)

      expect(exported).toBe('In test.md, at line 5, [change-request] comment added: fix this')
    })

    it('exports only unresolved when flag is true', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => {
        result.current.addComment(0, mockSection, 'open comment', 'note')
        result.current.addComment(1, mockHeading, 'resolved comment', 'note')
      })

      const resolvedId = result.current.comments[1].id
      act(() => result.current.resolveComment(resolvedId))

      const doc = makeMockDoc()
      const exported = result.current.exportComments(doc, true)

      expect(exported).toBe('In test.md, at line 5, [note] comment added: open comment')
      expect(exported).not.toContain('resolved comment')
    })

    it('exports all comments when flag is false', () => {
      const { result } = renderHook(() => useComments('doc-1', provider))

      act(() => {
        result.current.addComment(0, mockSection, 'open', 'note')
        result.current.addComment(1, mockHeading, 'done', 'note')
      })

      const resolvedId = result.current.comments[1].id
      act(() => result.current.resolveComment(resolvedId))

      const doc = makeMockDoc()
      const exported = result.current.exportComments(doc, false)

      expect(exported).toContain('open')
      expect(exported).toContain('done')
    })
  })

  describe('localStorage migration', () => {
    it('migrates old comments without lineNumber', async () => {
      const oldComment = { id: 'old', docId: 'doc-1', sectionIndex: 0, sectionType: 'paragraph', sectionSnippet: 'hi', kind: 'note', text: 'legacy', resolved: false, createdAt: '2026-01-01', resolvedAt: null }
      localStorage.setItem('doc-comments-doc-1', JSON.stringify([oldComment]))

      const { result } = renderHook(() => useComments('doc-1', provider))

      await waitFor(() => {
        expect(result.current.comments[0]?.lineNumber).toBe(0)
      })
    })
  })
})
