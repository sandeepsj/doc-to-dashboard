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

  // On mount, silently restore session if the user was previously signed in
  useEffect(() => {
    if (!googleAuth.isAuthAvailable()) return
    googleAuth.restoreSession().then((state) => {
      if (state) setAuth(state)
    })
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
