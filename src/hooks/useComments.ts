import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Comment, CommentKind, DashboardSection, ParsedDocument } from '../types'
import type { StorageProvider } from '../backends/storageProvider'
import { getSectionSnippet } from '../utils/sectionUtils'

export function useComments(docId: string | null, storage?: StorageProvider) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextSave = useRef(false)

  // Load comments when docId changes
  useEffect(() => {
    if (!docId || !storage) {
      setComments([])
      return
    }
    setLoading(true)
    skipNextSave.current = true
    storage.loadComments(docId).then((loaded) => {
      setComments(loaded)
      setLoading(false)
    }).catch(() => {
      setComments([])
      setLoading(false)
    })
  }, [docId, storage])

  // Debounced save on every change
  useEffect(() => {
    if (!docId || !storage) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      storage.saveComments(docId, comments).catch((err) => {
        console.error('Failed to save comments:', err)
      })
    }, 300)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [docId, storage, comments])

  const addComment = useCallback((sectionIndex: number, section: DashboardSection, text: string, kind: CommentKind) => {
    if (!docId) return
    const comment: Comment = {
      id: crypto.randomUUID(),
      docId,
      sectionIndex,
      lineNumber: section.lineStart,
      sectionType: section.type,
      sectionSnippet: getSectionSnippet(section),
      kind,
      text,
      resolved: false,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    }
    setComments((prev) => [...prev, comment])
  }, [docId])

  const resolveComment = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, resolved: true, resolvedAt: new Date().toISOString() } : c))
    )
  }, [])

  const unresolveComment = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, resolved: false, resolvedAt: null } : c))
    )
  }, [])

  const deleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }, [])

  const getCommentsForSection = useCallback(
    (sectionIndex: number) => comments.filter((c) => c.sectionIndex === sectionIndex),
    [comments]
  )

  const commentCountBySection = useMemo(() => {
    const map = new Map<number, number>()
    for (const c of comments) {
      if (!c.resolved) {
        map.set(c.sectionIndex, (map.get(c.sectionIndex) || 0) + 1)
      }
    }
    return map
  }, [comments])

  const exportComments = useCallback(
    (doc: ParsedDocument, unresolvedOnly: boolean = false): string => {
      const filtered = unresolvedOnly
        ? comments.filter((c) => !c.resolved)
        : comments
      return filtered
        .map((c) => `In ${doc.name}.md, at line ${c.lineNumber}, [${c.kind}] comment added: ${c.text}`)
        .join('\n')
    },
    [comments]
  )

  return {
    comments,
    loading,
    addComment,
    resolveComment,
    unresolveComment,
    deleteComment,
    getCommentsForSection,
    commentCountBySection,
    exportComments,
  }
}
