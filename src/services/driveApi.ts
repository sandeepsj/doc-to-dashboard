import type { DriveFileMeta } from '../types/drive'
import { refreshToken } from './googleAuth'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const APP_FOLDER_NAME = 'Doc-to-Dashboard'

async function authenticatedFetch(token: string, url: string, init?: RequestInit): Promise<Response> {
  let res = await fetch(url, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  })

  // Retry once on 401 with refreshed token
  if (res.status === 401) {
    const newToken = await refreshToken()
    res = await fetch(url, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${newToken}` },
    })
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Drive API error ${res.status}: ${text}`)
  }

  return res
}

// ── Folder operations ─────────────────────────────────────────────────────

export async function findOrCreateAppFolder(token: string): Promise<string> {
  // Search for existing app folder
  const q = `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const res = await authenticatedFetch(token, `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`)
  const data = await res.json()

  if (data.files?.length > 0) return data.files[0].id

  // Create it
  const createRes = await authenticatedFetch(token, `${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })
  const created = await createRes.json()
  return created.id
}

export async function findOrCreateProjectFolder(token: string, parentId: string, name: string): Promise<string> {
  const q = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const res = await authenticatedFetch(token, `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`)
  const data = await res.json()

  if (data.files?.length > 0) return data.files[0].id

  const createRes = await authenticatedFetch(token, `${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })
  const created = await createRes.json()
  return created.id
}

// ── List subfolders (projects) ────────────────────────────────────────────

export async function listSubfolders(token: string, parentId: string): Promise<{ id: string; name: string }[]> {
  const q = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const res = await authenticatedFetch(token, `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&orderBy=name`)
  const data = await res.json()
  return (data.files ?? []).map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }))
}

// ── File operations ───────────────────────────────────────────────────────

export async function listFilesInFolder(token: string, folderId: string): Promise<DriveFileMeta[]> {
  const q = `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`
  const res = await authenticatedFetch(
    token,
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime)&orderBy=name`
  )
  const data = await res.json()
  return (data.files ?? []).map((f: { id: string; name: string; mimeType: string; modifiedTime: string }) => ({
    driveFileId: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    parentFolderId: folderId,
  }))
}

export async function downloadFile(token: string, fileId: string): Promise<string> {
  const res = await authenticatedFetch(token, `${DRIVE_API}/files/${fileId}?alt=media`)
  return res.text()
}

export async function uploadFile(
  token: string,
  folderId: string,
  name: string,
  content: string,
  mimeType: string = 'text/markdown',
  existingFileId?: string
): Promise<DriveFileMeta> {
  const metadata = existingFileId
    ? { name }
    : { name, parents: [folderId] }

  const boundary = '---drive-boundary-' + Date.now()
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`

  const url = existingFileId
    ? `${UPLOAD_API}/files/${existingFileId}?uploadType=multipart&fields=id,name,mimeType,modifiedTime`
    : `${UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime`

  const method = existingFileId ? 'PATCH' : 'POST'

  const res = await authenticatedFetch(token, url, {
    method,
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })

  const data = await res.json()
  return {
    driveFileId: data.id,
    name: data.name,
    mimeType: data.mimeType,
    modifiedTime: data.modifiedTime,
    parentFolderId: folderId,
  }
}

export async function deleteFile(token: string, fileId: string): Promise<void> {
  await authenticatedFetch(token, `${DRIVE_API}/files/${fileId}`, { method: 'DELETE' })
}
