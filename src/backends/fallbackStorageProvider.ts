import type { Comment } from '../types'
import type { StorageProvider, ProjectInfo } from './storageProvider'

export class FallbackStorageProvider implements StorageProvider {
  constructor(
    private primary: StorageProvider,
    private fallback: StorageProvider
  ) {}

  async listProjects(): Promise<ProjectInfo[]> {
    try {
      return await this.primary.listProjects()
    } catch {
      return this.fallback.listProjects()
    }
  }

  async loadDocument(projectId: string, fileName: string): Promise<string> {
    try {
      return await this.primary.loadDocument(projectId, fileName)
    } catch {
      return this.fallback.loadDocument(projectId, fileName)
    }
  }

  async saveDocument(projectId: string, fileName: string, content: string): Promise<void> {
    try {
      await this.primary.saveDocument(projectId, fileName, content)
    } catch {
      await this.fallback.saveDocument(projectId, fileName, content)
    }
  }

  async deleteDocument(projectId: string, fileName: string): Promise<void> {
    try {
      await this.primary.deleteDocument(projectId, fileName)
    } catch {
      await this.fallback.deleteDocument(projectId, fileName)
    }
  }

  async loadComments(docId: string): Promise<Comment[]> {
    try {
      const primary = await this.primary.loadComments(docId)
      if (primary.length > 0) return primary
      // If primary is empty, check fallback (might have localStorage comments)
      const fallbackComments = await this.fallback.loadComments(docId)
      if (fallbackComments.length > 0) {
        // Migrate to primary
        await this.primary.saveComments(docId, fallbackComments).catch(() => {})
        return fallbackComments
      }
      return []
    } catch {
      return this.fallback.loadComments(docId)
    }
  }

  async saveComments(docId: string, comments: Comment[]): Promise<void> {
    try {
      await this.primary.saveComments(docId, comments)
    } catch {
      // Fallback to localStorage if Drive fails
      await this.fallback.saveComments(docId, comments)
    }
  }
}
