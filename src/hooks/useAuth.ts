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

  // On mount, restore session from storage — no popup, no network call
  useEffect(() => {
    if (!googleAuth.isAuthAvailable()) return
    const state = googleAuth.restoreSession()
    if (state) setAuth(state)
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
