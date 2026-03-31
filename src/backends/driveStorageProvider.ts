import type { Comment } from '../types'
import type { StorageProvider, ProjectInfo } from './storageProvider'
import * as driveApi from '../services/driveApi'

interface CommentsFile {
  [docId: string]: Comment[]
}

export class DriveStorageProvider implements StorageProvider {
  private token: string
  private appFolderId: string | null = null

  constructor(token: string) {
    this.token = token
  }

  updateToken(token: string) {
    this.token = token
  }

  private async getAppFolder(): Promise<string> {
    if (!this.appFolderId) {
      this.appFolderId = await driveApi.findOrCreateAppFolder(this.token)
    }
    return this.appFolderId
  }

  async listProjects(): Promise<ProjectInfo[]> {
    const appId = await this.getAppFolder()
    const folders = await driveApi.listSubfolders(this.token, appId)

    const projects: ProjectInfo[] = await Promise.all(
      folders.map(async (folder) => {
        const files = await driveApi.listFilesInFolder(this.token, folder.id)
        return {
          id: folder.id,
          name: folder.name,
          files: files.filter((f) => f.name.endsWith('.md')).map((f) => f.name),
        }
      })
    )

    return projects.filter((p) => p.files.length > 0)
  }

  async loadDocument(projectId: string, fileName: string): Promise<string> {
    const files = await driveApi.listFilesInFolder(this.token, projectId)
    const file = files.find((f) => f.name === fileName)
    if (!file) throw new Error(`File ${fileName} not found in project`)
    return driveApi.downloadFile(this.token, file.driveFileId)
  }

  async saveDocument(projectId: string, fileName: string, content: string): Promise<void> {
    const files = await driveApi.listFilesInFolder(this.token, projectId)
    const existing = files.find((f) => f.name === fileName)
    await driveApi.uploadFile(this.token, projectId, fileName, content, 'text/markdown', existing?.driveFileId)
  }

  async deleteDocument(projectId: string, fileName: string): Promise<void> {
    const files = await driveApi.listFilesInFolder(this.token, projectId)
    const file = files.find((f) => f.name === fileName)
    if (file) await driveApi.deleteFile(this.token, file.driveFileId)
  }

  async loadComments(docId: string): Promise<Comment[]> {
    // docId is the Drive file ID — we need to find its parent folder to locate .comments.json
    // For simplicity, we pass projectId:docId format or store comments keyed by file ID
    try {
      const commentsData = await this.loadCommentsFile(docId)
      return commentsData[docId] ?? []
    } catch {
      return []
    }
  }

  async saveComments(docId: string, comments: Comment[]): Promise<void> {
    try {
      // Load existing comments file, update entry, write back
      const projectId = comments[0]?.docId ? await this.getProjectForDoc(docId) : null
      if (!projectId) {
        // If no comments yet or can't find project, store in a flat structure
        await this.writeCommentsToProject(docId, docId, comments)
        return
      }
      await this.writeCommentsToProject(projectId, docId, comments)
    } catch (err) {
      console.error('Failed to save comments to Drive:', err)
      throw err
    }
  }

  private async getProjectForDoc(docId: string): Promise<string | null> {
    // Get file metadata to find its parent folder
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}?fields=parents`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.parents?.[0] ?? null
    } catch {
      return null
    }
  }

  private async loadCommentsFile(docId: string): Promise<CommentsFile> {
    const projectId = await this.getProjectForDoc(docId)
    if (!projectId) return {}

    const files = await driveApi.listFilesInFolder(this.token, projectId)
    const commentsFile = files.find((f) => f.name === '.comments.json')
    if (!commentsFile) return {}

    const content = await driveApi.downloadFile(this.token, commentsFile.driveFileId)
    return JSON.parse(content)
  }

  private async writeCommentsToProject(projectId: string, docId: string, comments: Comment[]): Promise<void> {
    const files = await driveApi.listFilesInFolder(this.token, projectId)
    const commentsFile = files.find((f) => f.name === '.comments.json')

    let existing: CommentsFile = {}
    if (commentsFile) {
      try {
        const content = await driveApi.downloadFile(this.token, commentsFile.driveFileId)
        existing = JSON.parse(content)
      } catch { /* start fresh */ }
    }

    existing[docId] = comments
    const json = JSON.stringify(existing, null, 2)

    await driveApi.uploadFile(
      this.token,
      projectId,
      '.comments.json',
      json,
      'application/json',
      commentsFile?.driveFileId
    )
  }

  async createProject(name: string): Promise<string> {
    const appId = await this.getAppFolder()
    return driveApi.findOrCreateProjectFolder(this.token, appId, name)
  }
}
