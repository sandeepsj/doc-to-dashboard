import type { Comment } from '../types'

export interface ProjectInfo {
  id: string
  name: string
  files: string[]
}

export interface StorageProvider {
  listProjects(): Promise<ProjectInfo[]>
  loadDocument(projectId: string, fileName: string): Promise<string>
  saveDocument(projectId: string, fileName: string, content: string): Promise<void>
  deleteDocument(projectId: string, fileName: string): Promise<void>
  loadComments(docId: string): Promise<Comment[]>
  saveComments(docId: string, comments: Comment[]): Promise<void>
}
