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
          saveSession(user, accessToken, response.expires_in)
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

// ── Session persistence ──────────────────────────────────────────────────────
// User info → localStorage (survives tab close, used to show avatar/name)
// Access token + expiry → localStorage (survives tab/app switches on mobile)

const USER_KEY    = 'dtd_user'
const TOKEN_KEY   = 'dtd_token'
const EXPIRES_KEY = 'dtd_token_expires'

export function saveSession(user: GoogleUser, token: string, expiresIn?: number): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    localStorage.setItem(TOKEN_KEY, token)
    if (expiresIn) {
      // Store absolute expiry time with 60s buffer to avoid edge-case usage of a just-expired token
      const expiresAt = Date.now() + (expiresIn - 60) * 1000
      localStorage.setItem(EXPIRES_KEY, String(expiresAt))
    }
  } catch { /* ignore */ }
}

function isTokenExpired(): boolean {
  try {
    const expiresAt = localStorage.getItem(EXPIRES_KEY)
    if (!expiresAt) return true
    return Date.now() >= Number(expiresAt)
  } catch { return true }
}

export function loadSession(): AuthState | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const raw   = localStorage.getItem(USER_KEY)
    if (!token || !raw) return null
    const user = JSON.parse(raw) as GoogleUser
    return { isLoggedIn: true, user, accessToken: token }
  } catch { return null }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    // Clean up legacy sessionStorage key if present
    sessionStorage.removeItem(TOKEN_KEY)
  } catch { /* ignore */ }
}

/**
 * Restore session from storage — no popup, no network call.
 * Returns the saved AuthState only if a non-expired token is present.
 */
export function restoreSession(): AuthState | null {
  const state = loadSession()
  if (!state) return null
  if (isTokenExpired()) return null
  accessToken = state.accessToken
  return state
}

/**
 * Check if we have saved user info (even with an expired token).
 * Used to decide whether to attempt a silent refresh.
 */
export function hasSavedUser(): boolean {
  try {
    return !!localStorage.getItem(USER_KEY)
  } catch { return false }
}

/**
 * Try to silently refresh the token when we have saved user info
 * but the token has expired. Returns the refreshed AuthState or null.
 */
export async function tryRefreshSession(): Promise<AuthState | null> {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as GoogleUser
    const newToken = await refreshToken()
    return { isLoggedIn: true, user, accessToken: newToken }
  } catch {
    // Silent refresh failed (popup blocked, no prior consent, etc.)
    clearSession()
    return null
  }
}

export function signOut(): void {
  if (accessToken) {
    try { google.accounts.oauth2.revoke(accessToken) } catch { /* ignore */ }
  }
  accessToken = null
  tokenClient = null
  clearSession()
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
        // Update token + expiry in localStorage
        try {
          localStorage.setItem(TOKEN_KEY, accessToken)
          if (response.expires_in) {
            const expiresAt = Date.now() + (response.expires_in - 60) * 1000
            localStorage.setItem(EXPIRES_KEY, String(expiresAt))
          }
        } catch { /* ignore */ }
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
