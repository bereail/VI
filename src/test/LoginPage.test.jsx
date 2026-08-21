import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginPage } from '../pages/LoginPage'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

const noop = () => {}

// Helper: the submit button is the last "Ingresar" (tab + submit coexist)
const getSubmitBtn = () => {
  const btns = screen.getAllByRole('button', { name: 'Ingresar' })
  return btns[btns.length - 1]
}

describe('LoginPage - render', () => {
  it('shows login form by default', () => {
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={noop} />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(getSubmitBtn()).toBeInTheDocument()
  })

  it('shows the VI logo', () => {
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={noop} />)
    expect(screen.getByText('VI')).toBeInTheDocument()
  })

  it('switches to register view', () => {
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    expect(screen.getByLabelText('Repetir contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument()
  })

  it('switches to reset view', () => {
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={noop} />)
    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }))
    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar enlace' })).toBeInTheDocument()
  })

  it('can go back from reset to login', () => {
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={noop} />)
    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }))
    fireEvent.click(screen.getByRole('button', { name: '← Volver a ingresar' }))
    // back to login: email and password fields visible
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(getSubmitBtn()).toBeInTheDocument()
  })
})

describe('LoginPage - validation', () => {
  it('shows error when email is empty on login', async () => {
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={noop} />)
    fireEvent.click(getSubmitBtn())
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Ingresá tu email'))
  })

  it('shows error when password is empty on login', async () => {
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={noop} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.click(getSubmitBtn())
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Ingresá tu contraseña'))
  })

  it('shows error when passwords do not match on register', async () => {
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'pass123' } })
    fireEvent.change(screen.getByLabelText('Repetir contraseña'), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('no coinciden'))
  })

  it('shows error when password is too short on register', async () => {
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText('Repetir contraseña'), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('6 caracteres'))
  })
})

describe('LoginPage - callbacks', () => {
  it('calls onLogin with email and password', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined)
    render(<LoginPage onLogin={onLogin} onRegister={noop} onForgotPassword={noop} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mypassword' } })
    fireEvent.click(getSubmitBtn())
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('test@test.com', 'mypassword'))
  })

  it('calls onRegister with email and password', async () => {
    const onRegister = vi.fn().mockResolvedValue(undefined)
    render(<LoginPage onLogin={noop} onRegister={onRegister} onForgotPassword={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'pass123' } })
    fireEvent.change(screen.getByLabelText('Repetir contraseña'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(onRegister).toHaveBeenCalledWith('new@test.com', 'pass123'))
  })

  it('shows error message from thrown login error', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Contraseña incorrecta.'))
    render(<LoginPage onLogin={onLogin} onRegister={noop} onForgotPassword={noop} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'wrong' } })
    fireEvent.click(getSubmitBtn())
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Contraseña incorrecta'))
  })

  it('shows error message from thrown register error', async () => {
    const onRegister = vi.fn().mockRejectedValue(new Error('Ya existe una cuenta con ese email.'))
    render(<LoginPage onLogin={noop} onRegister={onRegister} onForgotPassword={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dup@test.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'pass123' } })
    fireEvent.change(screen.getByLabelText('Repetir contraseña'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Ya existe una cuenta'))
  })

  it('calls onForgotPassword with email and shows confirmation', async () => {
    const onForgotPassword = vi.fn().mockResolvedValue(undefined)
    render(<LoginPage onLogin={noop} onRegister={noop} onForgotPassword={onForgotPassword} />)
    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    await waitFor(() => expect(onForgotPassword).toHaveBeenCalledWith('a@b.com'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('enlace'))
  })
})
