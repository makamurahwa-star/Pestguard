import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('pestguard_user')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('pestguard_token'))
  const [loading, setLoading] = useState(!!token)

  useEffect(() => {
    if (token) {
      authApi.me()
        .then(({ user }) => {
          setUser(user)
          localStorage.setItem('pestguard_user', JSON.stringify(user))
        })
        .catch(() => {
          setUser(null); setToken(null)
          localStorage.removeItem('pestguard_token')
          localStorage.removeItem('pestguard_user')
        })
        .finally(() => setLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (creds) => {
    const data = await authApi.login(creds)
    setToken(data.access_token); setUser(data.user)
    localStorage.setItem('pestguard_token', data.access_token)
    localStorage.setItem('pestguard_user', JSON.stringify(data.user))
    return data.user
  }, [])

  const register = useCallback(async (data) => {
    const res = await authApi.register(data)
    setToken(res.access_token); setUser(res.user)
    localStorage.setItem('pestguard_token', res.access_token)
    localStorage.setItem('pestguard_user', JSON.stringify(res.user))
    return res.user
  }, [])

  const logout = useCallback(() => {
    setToken(null); setUser(null)
    localStorage.removeItem('pestguard_token')
    localStorage.removeItem('pestguard_user')
  }, [])

  const updateUser = useCallback((u) => {
    setUser(u)
    localStorage.setItem('pestguard_user', JSON.stringify(u))
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
