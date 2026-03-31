import { useState, useCallback } from 'react'
import type { AuthState } from '../types/drive'
import * as googleAuth from '../services/googleAuth'

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  accessToken: null,
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(initialState)

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
