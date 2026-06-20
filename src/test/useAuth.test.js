import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../hooks/useAuth'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
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

  it('persists user to localStorage', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('x@y.com', 'pass123') })
    const stored = JSON.parse(localStorage.getItem('vi_users'))
    expect(stored['x@y.com']).toBeDefined()
    expect(stored['x@y.com'].passwordHash).toBeTruthy()
  })

  it('stores session in sessionStorage', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('s@s.com', 'pass123') })
    const session = JSON.parse(sessionStorage.getItem('vi_session'))
    expect(session.email).toBe('s@s.com')
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
  it('clears user and session', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('lo@lo.com', 'pass') })
    act(() => { result.current.logout() })
    expect(result.current.user).toBeNull()
    expect(sessionStorage.getItem('vi_session')).toBeNull()
  })
})

describe('useAuth - resetPassword', () => {
  it('changes password so old one no longer works', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('rp@rp.com', 'oldpass') })
    await act(async () => { result.current.logout() })
    await act(async () => { await result.current.resetPassword('rp@rp.com', 'newpass') })
    await expect(
      act(async () => { await result.current.login('rp@rp.com', 'oldpass') })
    ).rejects.toThrow('Contraseña incorrecta')
  })

  it('new password works after reset', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.register('np@np.com', 'oldpass') })
    await act(async () => { result.current.logout() })
    await act(async () => { await result.current.resetPassword('np@np.com', 'newpass') })
    await act(async () => { await result.current.login('np@np.com', 'newpass') })
    expect(result.current.user?.email).toBe('np@np.com')
  })

  it('throws if email does not exist', async () => {
    const { result } = renderHook(() => useAuth())
    await expect(
      act(async () => { await result.current.resetPassword('ghost@x.com', 'newpass') })
    ).rejects.toThrow('No existe una cuenta')
  })
})

describe('useAuth - session persistence', () => {
  it('restores user from sessionStorage on mount', async () => {
    sessionStorage.setItem('vi_session', JSON.stringify({ email: 'persisted@x.com' }))
    const { result } = renderHook(() => useAuth())
    expect(result.current.user?.email).toBe('persisted@x.com')
  })

  it('starts with null user when no session', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
  })
})
