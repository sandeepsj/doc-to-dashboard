import { createContext, useContext, useMemo } from 'react'
import type { AuthState } from '../types/drive'
import type { StorageProvider } from '../backends/storageProvider'
import { useAuth } from '../hooks/useAuth'
import { LocalStorageProvider } from '../backends/localStorageProvider'
import { DriveStorageProvider } from '../backends/driveStorageProvider'
import { FallbackStorageProvider } from '../backends/fallbackStorageProvider'
import { isAuthAvailable } from '../services/googleAuth'

interface AuthContextValue {
  auth: AuthState
  authAvailable: boolean
  signIn: () => Promise<void>
  signOut: () => void
  storage: StorageProvider
}

const localProvider = new LocalStorageProvider()

const AuthContext = createContext<AuthContextValue>({
  auth: { isLoggedIn: false, user: null, accessToken: null },
  authAvailable: false,
  signIn: async () => {},
  signOut: () => {},
  storage: localProvider,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth, signIn, signOut } = useAuth()

  const storage = useMemo<StorageProvider>(() => {
    if (auth.isLoggedIn && auth.accessToken) {
      const driveProvider = new DriveStorageProvider(auth.accessToken)
      return new FallbackStorageProvider(driveProvider, localProvider)
    }
    return localProvider
  }, [auth.isLoggedIn, auth.accessToken])

  const value = useMemo(
    () => ({ auth, authAvailable: isAuthAvailable(), signIn, signOut, storage }),
    [auth, signIn, signOut, storage]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  return useContext(AuthContext)
}
