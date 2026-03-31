export interface AuthState {
  isLoggedIn: boolean
  user: GoogleUser | null
  accessToken: string | null
}

export interface GoogleUser {
  email: string
  name: string
  picture: string
}

export interface DriveFileMeta {
  driveFileId: string
  name: string
  mimeType: string
  modifiedTime: string
  parentFolderId: string
}

export interface DriveProject {
  folderId: string
  name: string
  files: DriveFileMeta[]
}
