import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest, setCsrfToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const session = await apiRequest('/auth/me')
      setCsrfToken(session.csrfToken)
      setUser(session.user)
    } catch {
      setCsrfToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    apiRequest('/auth/me')
      .then((session) => {
        setCsrfToken(session.csrfToken)
        setUser(session.user)
      })
      .catch(() => {
        setCsrfToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [refresh])

  const login = useCallback(async (username, password) => {
    const session = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password },
    })
    setCsrfToken(session.csrfToken)
    setUser(session.user)
    return session.user
  }, [])

  const logout = useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST' })
    setCsrfToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    refresh,
    canEdit: user?.role === 'collaborator' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
  }), [loading, login, logout, refresh, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
