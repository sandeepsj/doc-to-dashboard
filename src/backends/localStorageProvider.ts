import type { Comment } from '../types'
import type { StorageProvider, ProjectInfo } from './storageProvider'

export class LocalStorageProvider implements StorageProvider {
  async listProjects(): Promise<ProjectInfo[]> {
    try {
      const res = await fetch('./projects/manifest.json')
      const data = await res.json()
      return (data.projects ?? []).map((p: { id: string; name: string; files: string[] }) => ({
        id: p.id,
        name: p.name,
        files: p.files,
      }))
    } catch {
      return []
    }
  }

  async loadDocument(projectId: string, fileName: string): Promise<string> {
    const res = await fetch(`./projects/${projectId}/${fileName}`)
    if (!res.ok) throw new Error(`Failed to load ${projectId}/${fileName}`)
    return res.text()
  }

  async saveDocument(_projectId: string, _fileName: string, _content: string): Promise<void> {
    // No-op in guest mode — local projects are read-only
  }

  async deleteDocument(_projectId: string, _fileName: string): Promise<void> {
    // No-op in guest mode
  }

  async loadComments(docId: string): Promise<Comment[]> {
    try {
      const raw = localStorage.getItem(`doc-comments-${docId}`)
      const parsed: Comment[] = raw ? JSON.parse(raw) : []
      return parsed.map((c) => ({
        ...c,
        lineNumber: c.lineNumber ?? 0,
      }))
    } catch {
      return []
    }
  }

  async saveComments(docId: string, comments: Comment[]): Promise<void> {
    try {
      localStorage.setItem(`doc-comments-${docId}`, JSON.stringify(comments))
    } catch { /* quota exceeded — silently fail */ }
  }
}
