import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../hooks/useAuth'

const TOKEN_KEY = 'vi_token'

const mockUsers = {}
const mockResetTokens = { 'valid-token': null }

function mockToken(email) {
  const payload = btoa(JSON.stringify({ email }))
  return `mock.${payload}.sig`
}

function makeFetch() {
  return vi.fn((url, opts = {}) => {
    const method = opts.method || 'GET'
    const path = String(url).replace('/vi-api', '')
    const body = opts.body ? JSON.parse(opts.body) : {}

    if (method === 'POST' && path === '/auth/register') {
      const email = body.email?.toLowerCase()
      if (mockUsers[email]) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Ya existe una cuenta con ese email.' }) })
      }
      mockUsers[email] = { email, password: body.password }
      const token = mockToken(email)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ token, email }) })
    }

    if (method === 'POST' && path === '/auth/login') {
      const email = body.email?.toLowerCase()
      const user = mockUsers[email]
      if (!user) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'No existe una cuenta con ese email.' }) })
      }
      if (user.password !== body.password) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Contraseña incorrecta.' }) })
      }
      const token = mockToken(email)
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ token, email }) })
    }

    if (method === 'POST' && path === '/auth/forgot-password') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) })
    }

    if (method === 'POST' && path === '/auth/reset-password') {
      const email = mockResetTokens[body.token]
      if (!email) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'El enlace es inválido o ya expiró.' }) })
      }
      mockUsers[email].password = body.password
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) })
    }

    return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) })
  })
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  Object.keys(mockUsers).forEach(k => delete mockUsers[k])
  global.fetch = makeFetch()
})

describe('useAuth - register', () => {
  it('registers a new user and creates session', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.register('test@test.com', 'password123')
    })
    expect(result.current.user).not.toBeNull()
    expect(result.current.user.email).toBe('test@test.com')
  })

  it('normalizes email to lowercase', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.register('TEST@TEST.COM', 'pass123')
    })
    expect(result.current.user.email).toBe('test@test.com')
  })

  it('throws if email already registered', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('a@b.com', 'pass123') })
    await expect(
      act(async () => { await result.current.register('a@b.com', 'otherpass') })
    ).rejects.toThrow('Ya existe una cuenta')
  })

  it('stores token in localStorage', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('x@y.com', 'pass123') })
    expect(localStorage.getItem(TOKEN_KEY)).toBeTruthy()
  })
})

describe('useAuth - login', () => {
  it('logs in with correct credentials', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('u@u.com', 'correctpass') })
    await act(async () => { result.current.logout() })
    expect(result.current.user).toBeNull()
    await act(async () => { await result.current.login('u@u.com', 'correctpass') })
    expect(result.current.user?.email).toBe('u@u.com')
  })

  it('throws on wrong password', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('r@r.com', 'rightpass') })
    await act(async () => { result.current.logout() })
    await expect(
      act(async () => { await result.current.login('r@r.com', 'wrongpass') })
    ).rejects.toThrow('Contraseña incorrecta')
  })

  it('throws on unknown email', async () => {
    const { result } = renderHook(() => useAuth())
    await expect(
      act(async () => { await result.current.login('noexiste@x.com', 'anypass') })
    ).rejects.toThrow('No existe una cuenta')
  })

  it('normalizes email on login', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('norm@test.com', 'pass') })
    await act(async () => { result.current.logout() })
    await act(async () => { await result.current.login('NORM@TEST.COM', 'pass') })
    expect(result.current.user?.email).toBe('norm@test.com')
  })
})

describe('useAuth - logout', () => {
  it('clears user and token', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('lo@lo.com', 'pass') })
    act(() => { result.current.logout() })
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('useAuth - forgotPassword', () => {
  it('resolves without throwing regardless of whether the email exists', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.forgotPassword('anyone@x.com') })
  })
})

describe('useAuth - resetPassword', () => {
  it('changes password so old one no longer works', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('rp@rp.com', 'oldpass') })
    await act(async () => { result.current.logout() })
    mockResetTokens['valid-token'] = 'rp@rp.com'
    await act(async () => { await result.current.resetPassword('valid-token', 'newpass') })
    await expect(
      act(async () => { await result.current.login('rp@rp.com', 'oldpass') })
    ).rejects.toThrow('Contraseña incorrecta')
  })

  it('new password works after reset', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('np@np.com', 'oldpass') })
    await act(async () => { result.current.logout() })
    mockResetTokens['valid-token'] = 'np@np.com'
    await act(async () => { await result.current.resetPassword('valid-token', 'newpass') })
    await act(async () => { await result.current.login('np@np.com', 'newpass') })
    expect(result.current.user?.email).toBe('np@np.com')
  })

  it('throws if token is invalid or expired', async () => {
    const { result } = renderHook(() => useAuth())
    await expect(
      act(async () => { await result.current.resetPassword('bogus-token', 'newpass') })
    ).rejects.toThrow('inválido o ya expiró')
  })
})

describe('useAuth - session persistence', () => {
  it('restores user from token in localStorage on mount', () => {
    const email = 'persisted@x.com'
    const token = mockToken(email)
    localStorage.setItem(TOKEN_KEY, token)
    const { result } = renderHook(() => useAuth())
    expect(result.current.user?.email).toBe(email)
  })

  it('starts with null user when no token', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
  })
})
