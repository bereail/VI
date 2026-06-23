import { useState, useCallback } from 'react'
import { api, setToken, getToken } from '../api'

function emailFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.email || null
  } catch {
    return null
  }
}

function loadSession() {
  const token = getToken()
  if (!token) return null
  const email = emailFromToken(token)
  if (!email) return null
  return { email }
}

export function useAuth() {
  const [user, setUser] = useState(loadSession)

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    setToken(data.token)
    setUser({ email: data.email })
  }, [])

  const register = useCallback(async (email, password) => {
    const data = await api.post('/auth/register', { email, password })
    setToken(data.token)
    setUser({ email: data.email })
  }, [])

  const resetPassword = useCallback(async (email, password) => {
    await api.post('/auth/reset-password', { email, password })
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  return { user, login, register, resetPassword, logout }
}
