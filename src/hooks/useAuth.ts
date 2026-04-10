import { useState, useCallback, useEffect } from 'react'
import type { AuthState } from '../types/drive'
import * as googleAuth from '../services/googleAuth'

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  accessToken: null,
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(initialState)

  // On mount: restore session, or silently refresh if token expired
  useEffect(() => {
    if (!googleAuth.isAuthAvailable()) return

    // Fast path: valid token in storage
    const state = googleAuth.restoreSession()
    if (state) {
      setAuth(state)
      return
    }

    // Slow path: token expired but user info exists → try silent refresh
    if (googleAuth.hasSavedUser()) {
      let cancelled = false
      googleAuth.tryRefreshSession().then((refreshed) => {
        if (!cancelled && refreshed) setAuth(refreshed)
      })
      return () => { cancelled = true }
    }
  }, [])

  const handleSignIn = useCallback(async () => {
    try {
      const state = await googleAuth.signIn()
      setAuth(state)
    } catch (err) {
      console.error('Sign-in failed:', err)
    }
  }, [])

  const handleSignOut = useCallback(() => {
    googleAuth.signOut()
    setAuth(initialState)
  }, [])

  return { auth, signIn: handleSignIn, signOut: handleSignOut }
}
