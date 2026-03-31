import type { AuthState, GoogleUser } from '../types/drive'

// Module-level state
let tokenClient: google.accounts.oauth2.TokenClient | null = null
let accessToken: string | null = null
let gisLoaded = false

const SCOPES = 'https://www.googleapis.com/auth/drive.file openid email profile'

// Extend window for GIS types
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace google.accounts.oauth2 {
    interface TokenClient {
      requestAccessToken(config?: { prompt?: string }): void
    }
    interface TokenResponse {
      access_token: string
      expires_in: number
      error?: string
      error_description?: string
    }
    function initTokenClient(config: {
      client_id: string
      scope: string
      callback: (response: TokenResponse) => void
      error_callback?: (error: { type: string; message: string }) => void
    }): TokenClient
    function revoke(token: string, callback?: () => void): void
  }
}

function loadGisScript(): Promise<void> {
  if (gisLoaded) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => { gisLoaded = true; resolve() }
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

export function getClientId(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? null
}

export function isAuthAvailable(): boolean {
  return !!getClientId()
}

export async function signIn(): Promise<AuthState> {
  const clientId = getClientId()
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID not set')

  await loadGisScript()

  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: async (response) => {
        if (response.error) {
          reject(new Error(`${response.error}: ${response.error_description || ''}`))
          return
        }
        accessToken = response.access_token
        try {
          const user = await fetchUserInfo(accessToken)
          resolve({ isLoggedIn: true, user, accessToken })
        } catch (err) {
          reject(err)
        }
      },
      error_callback: (error) => {
        reject(new Error(error.message))
      },
    })
    tokenClient.requestAccessToken()
  })
}

export function signOut(): void {
  if (accessToken) {
    try { google.accounts.oauth2.revoke(accessToken) } catch { /* ignore */ }
  }
  accessToken = null
  tokenClient = null
}

export function getAccessToken(): string | null {
  return accessToken
}

export async function refreshToken(): Promise<string> {
  const clientId = getClientId()
  if (!clientId) throw new Error('No client ID')

  await loadGisScript()

  return new Promise((resolve, reject) => {
    // Re-init client with a fresh callback before requesting
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) { reject(new Error(response.error)); return }
        accessToken = response.access_token
        resolve(accessToken)
      },
      error_callback: (error) => reject(new Error(error.message)),
    })
    tokenClient.requestAccessToken({ prompt: '' })
  })
}

async function fetchUserInfo(token: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to fetch user info (${res.status}): ${text}`)
  }
  const data = await res.json()
  return {
    email: data.email,
    name: data.name || data.email,
    picture: data.picture || '',
  }
}
