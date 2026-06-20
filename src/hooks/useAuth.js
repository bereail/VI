import { useState, useCallback } from 'react'

const USERS_KEY = 'vi_users'
const SESSION_KEY = 'vi_session'

async function hashPassword(email, password) {
  const data = new TextEncoder().encode(`${email}:${password}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch { /* ignore */ }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState(loadSession)

  const login = useCallback(async (email, password) => {
    const users = loadUsers()
    const norm = email.trim().toLowerCase()
    if (!users[norm]) throw new Error('No existe una cuenta con ese email.')
    const hash = await hashPassword(norm, password)
    if (users[norm].passwordHash !== hash) throw new Error('Contraseña incorrecta.')
    const session = { email: norm }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
  }, [])

  const register = useCallback(async (email, password) => {
    const users = loadUsers()
    const norm = email.trim().toLowerCase()
    if (users[norm]) throw new Error('Ya existe una cuenta con ese email.')
    const hash = await hashPassword(norm, password)
    users[norm] = { email: norm, passwordHash: hash }
    saveUsers(users)
    const session = { email: norm }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
  }, [])

  const resetPassword = useCallback(async (email, newPassword) => {
    const users = loadUsers()
    const norm = email.trim().toLowerCase()
    if (!users[norm]) throw new Error('No existe una cuenta con ese email.')
    const hash = await hashPassword(norm, newPassword)
    users[norm].passwordHash = hash
    saveUsers(users)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  return { user, login, register, resetPassword, logout }
}
