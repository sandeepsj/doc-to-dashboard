# Google Drive Integration — Implementation Guide

A reusable reference for adding Google Sign-In + Drive storage to a React/Vite/TypeScript SPA hosted on GitHub Pages (or any static host).

---

## Table of Contents

1. [What we built](#1-what-we-built)
2. [Google Cloud setup](#2-google-cloud-setup)
3. [Architecture overview](#3-architecture-overview)
4. [File structure](#4-file-structure)
5. [Implementation walkthrough](#5-implementation-walkthrough)
6. [Gotchas and mistakes made](#6-gotchas-and-mistakes-made)
7. [Checklist for a new project](#7-checklist-for-a-new-project)

---

## 1. What we built

- Google OAuth 2.0 sign-in using **Google Identity Services (GIS)** — the modern replacement for `gapi.auth2`
- Access to the user's Google Drive scoped to **only files this app creates** (`drive.file` scope)
- App creates a named root folder (`Doc-to-Dashboard/`) in the user's Drive, then subfolders per project
- Drag-and-drop upload of `.md` files → saves them to the project folder in Drive
- Read projects back on login; open and render them
- Session persists across **page refreshes** without a popup

---

## 2. Google Cloud setup

### Step 1 — Create a project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. New project → give it a name
3. Enable **Google Drive API**: APIs & Services → Library → search "Google Drive API" → Enable

### Step 2 — OAuth consent screen

1. APIs & Services → OAuth consent screen
2. User type: **External**
3. Fill in app name, support email, developer email
4. Scopes — add:
   - `https://www.googleapis.com/auth/drive.file`
   - `openid`, `email`, `profile`
5. Test users — add your own email while in development
6. Save

> **Why `drive.file` and not `drive`?**
> `drive.file` only allows access to files the app itself created. It's the minimum viable scope and passes the OAuth review process much more easily. Never use `drive` (full access) unless you genuinely need it.

### Step 3 — OAuth credentials

1. APIs & Services → Credentials → Create Credentials → **OAuth 2.0 Client ID**
2. Application type: **Web application**
3. Authorised JavaScript origins — add ALL origins where the app runs:
   ```
   http://localhost:5173
   https://yourusername.github.io
   ```
4. **No redirect URIs needed** for the implicit/token flow
5. Copy the **Client ID** — you'll need it as an env variable

> **Common mistake:** Forgetting to add `https://yourusername.github.io` (without a trailing slash and without the repo path). Symptoms: sign-in popup opens but immediately errors with `redirect_uri_mismatch` or `origin_mismatch`.

### Step 4 — Store the Client ID

```bash
# .env.local (never commit this)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

For GitHub Pages deployment, add it as a **repository secret**:
- Settings → Secrets and variables → Actions → New repository secret
- Name: `GOOGLE_CLIENT_ID`

In `deploy.yml`:
```yaml
- name: Build
  run: npm run build
  env:
    VITE_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
```

---

## 3. Architecture overview

```
src/
├── services/
│   ├── googleAuth.ts       # GIS token client, sign-in, session persistence
│   └── driveApi.ts         # Drive REST API calls (folders, files, upload, download)
├── backends/
│   ├── storageProvider.ts  # Interface: listProjects, loadDocument, saveDocument…
│   ├── driveStorageProvider.ts   # Implements StorageProvider using driveApi
│   ├── localStorageProvider.ts   # Fallback: browser localStorage
│   └── fallbackStorageProvider.ts # Tries Drive first, falls back to local
├── hooks/
│   └── useAuth.ts          # React hook: auth state + restore on mount
├── contexts/
│   └── AuthContext.tsx     # Provides auth + storage to the whole app
└── components/
    └── GoogleSignIn.tsx    # Sign-in / sign-out button UI
```

The app never calls Drive directly — all storage goes through the `StorageProvider` interface. This makes it easy to swap or extend backends.

---

## 4. File structure

### `src/services/googleAuth.ts` — key patterns

```typescript
const SCOPES = 'https://www.googleapis.com/auth/drive.file openid email profile'

// Load GIS script lazily (only when user clicks sign in)
function loadGisScript(): Promise<void> { ... }

// Sign in — opens Google popup on user click
export async function signIn(): Promise<AuthState> {
  await loadGisScript()
  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: async (response) => {
        accessToken = response.access_token
        const user = await fetchUserInfo(accessToken)
        saveSession(user, accessToken)   // ← persist immediately
        resolve({ isLoggedIn: true, user, accessToken })
      },
    })
    tokenClient.requestAccessToken()    // ← must be called from user interaction
  })
}

// Session persistence — NO popup on refresh
const USER_KEY  = 'dtd_user'   // localStorage (survives tab close)
const TOKEN_KEY = 'dtd_token'  // sessionStorage (cleared on tab close)

export function saveSession(user: GoogleUser, token: string): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function restoreSession(): AuthState | null {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const raw   = localStorage.getItem(USER_KEY)
  if (!token || !raw) return null
  const user = JSON.parse(raw) as GoogleUser
  accessToken = token                   // restore module-level variable too
  return { isLoggedIn: true, user, accessToken: token }
}

export function signOut(): void {
  google.accounts.oauth2.revoke(accessToken)
  accessToken = null
  tokenClient = null
  clearSession()
}
```

### `src/services/driveApi.ts` — key patterns

```typescript
const DRIVE_API  = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

// Always wrap fetch calls — retry once on 401 with refreshed token
async function authenticatedFetch(token, url, init?): Promise<Response> {
  let res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) {
    const newToken = await refreshToken()  // re-request via GIS (requires prior consent)
    res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${newToken}` } })
  }
  if (!res.ok) throw new Error(`Drive API error ${res.status}`)
  return res
}

// Folder structure: one app root folder, one subfolder per project
// Find-or-create pattern avoids duplicates on repeated visits
export async function findOrCreateAppFolder(token): Promise<string> { ... }
export async function findOrCreateProjectFolder(token, parentId, name): Promise<string> { ... }

// Multipart upload (metadata + content in one request)
export async function uploadFile(token, folderId, name, content, mimeType, existingFileId?): Promise<DriveFileMeta> {
  const boundary = '---drive-boundary-' + Date.now()
  // POST for new files, PATCH for updates
  const method = existingFileId ? 'PATCH' : 'POST'
  const url = existingFileId
    ? `${UPLOAD_API}/files/${existingFileId}?uploadType=multipart`
    : `${UPLOAD_API}/files?uploadType=multipart`
  // body = boundary-separated metadata JSON + file content
}
```

### `src/hooks/useAuth.ts` — restore on mount

```typescript
export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(initialState)

  useEffect(() => {
    if (!googleAuth.isAuthAvailable()) return
    const state = googleAuth.restoreSession()  // synchronous, no popup
    if (state) setAuth(state)
  }, [])

  // signIn and signOut callbacks...
}
```

---

## 5. Implementation walkthrough

### Step 1 — Install nothing extra

GIS is loaded at runtime from `https://accounts.google.com/gsi/client`. No npm package needed.

### Step 2 — StorageProvider interface

Define an interface that abstracts storage operations. This lets the rest of the app stay unaware of whether it's talking to Drive or localStorage:

```typescript
export interface StorageProvider {
  listProjects(): Promise<ProjectInfo[]>
  loadDocument(projectId: string, fileName: string): Promise<string>
  saveDocument(projectId: string, fileName: string, content: string): Promise<void>
  deleteDocument(projectId: string, fileName: string): Promise<void>
}
```

### Step 3 — AuthContext

Wrap the whole app in an `AuthProvider`. It instantiates the right `StorageProvider` based on login state:

```typescript
const storage = useMemo<StorageProvider>(() => {
  if (auth.isLoggedIn && auth.accessToken) {
    return new FallbackStorageProvider(
      new DriveStorageProvider(auth.accessToken),
      localProvider,
    )
  }
  return localProvider
}, [auth.isLoggedIn, auth.accessToken])
```

### Step 4 — GoogleSignIn component

Keep it simple — just reads from context, calls `signIn()` on click:

```tsx
const { auth, signIn, signOut } = useAuthContext()

if (auth.isLoggedIn) {
  return <><img src={auth.user.picture} /> <button onClick={signOut}>Sign out</button></>
}
return <button onClick={signIn}>Sign in with Google</button>
```

> `signIn()` **must be called directly from a user click handler** — never from `useEffect` or a setTimeout. Browsers block popups that aren't triggered by direct user interaction.

---

## 6. Gotchas and mistakes made

### ❌ Using `prompt: ''` for silent token refresh on page load

**What happened:** After adding session persistence, we called `requestAccessToken({ prompt: '' })` in a `useEffect` on mount, hoping GIS would silently re-issue a token. Instead the browser blocked it with:

```
[GSI_LOGGER]: Failed to open popup window on url: https://accounts.google.com/...
Maybe blocked by the browser?
```

**Why:** Browsers block `window.open()` calls that don't originate from a direct user interaction event. A `useEffect` on mount does not qualify.

**Fix:** Store the access token in `sessionStorage` on sign-in. On mount, read it back synchronously — no popup, no network call. `sessionStorage` persists through refreshes but is cleared when the tab closes, which is fine since GIS tokens expire in ~1 hour anyway.

```
localStorage  → user info (name, email, picture) — long-lived, for showing avatar
sessionStorage → access token — cleared on tab close, same lifetime as token
```

---

### ❌ `openid email profile` scopes missing

**What happened:** Calling `fetchUserInfo` with the Drive token returned a 403 because the token didn't include the `userinfo` scopes.

**Fix:** Include all scopes in a single space-separated string on the **same** `initTokenClient` call:

```typescript
const SCOPES = 'https://www.googleapis.com/auth/drive.file openid email profile'
```

You cannot request additional scopes on a second call — GIS ignores them if a token client was already initialised for the same client ID.

---

### ❌ Token refresh race condition

**What happened:** Multiple concurrent Drive API calls all got a 401, each triggered its own `refreshToken()`, and the second refresh would fail because GIS had already completed the first.

**Fix:** The `refreshToken()` re-inits the token client with a fresh callback before each call. Because each call awaits its own Promise before the next can retry, this naturally serialises.

---

### ❌ `drive` scope instead of `drive.file`

**What happened (pre-emptive):** Using `drive` (full Drive access) triggers an extended OAuth verification by Google and shows a scary warning screen to users.

**Fix:** Use `drive.file` — only files this app created are accessible. The UX is identical from the user's perspective, and the consent screen is much less alarming.

---

### ❌ Authorised origin missing the GitHub Pages root domain

**What happened:** Sign-in worked on `localhost` but immediately failed on GitHub Pages with an `origin_mismatch` error.

**Fix:** In Google Cloud Console → Credentials, add the **root domain** of GitHub Pages:
```
https://yourusername.github.io
```
Not the repo path (`/repo-name`). The origin is just the scheme + host.

---

### ❌ `VITE_GOOGLE_CLIENT_ID` not available in CI build

**What happened:** The deployed app showed no sign-in button at all (`isAuthAvailable()` returned false) because the env variable was undefined in the GitHub Actions build.

**Fix:** Add it as a GitHub Actions repository secret and pass it in `deploy.yml`:
```yaml
env:
  VITE_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
```

---

## 7. Checklist for a new project

- [ ] Google Cloud project created, Drive API enabled
- [ ] OAuth consent screen configured (External, correct scopes)
- [ ] Test user added during development
- [ ] Credentials: Web application, both `localhost` and prod origin added
- [ ] `VITE_GOOGLE_CLIENT_ID` in `.env.local` and in GitHub Actions secrets
- [ ] `deploy.yml` passes the secret as an env var to `npm run build`
- [ ] `signIn()` called only from a direct user click — never from `useEffect`
- [ ] Scopes include `drive.file openid email profile` in one string
- [ ] Access token stored in `sessionStorage`, user info in `localStorage`
- [ ] `restoreSession()` called synchronously in `useEffect` on mount (no popup)
- [ ] `signOut()` clears both storages and revokes the token
- [ ] `authenticatedFetch` retries once on 401 with a refreshed token
- [ ] App never deletes Drive files the user didn't ask to delete
