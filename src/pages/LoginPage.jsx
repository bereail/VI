import { useState } from 'react'
import { Icon } from '../components/Icon'
import styles from './LoginPage.module.css'

const VIEWS = { login: 'login', register: 'register', reset: 'reset' }

export function LoginPage({ onLogin, onRegister, onForgotPassword, onGuestLogin }) {
  const [view, setView] = useState(VIEWS.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const handleGuest = async () => {
    clear()
    setGuestLoading(true)
    try {
      await onGuestLogin()
    } catch (err) {
      setError(err.message)
      setGuestLoading(false)
    }
  }

  const clear = () => { setError(''); setSuccess('') }

  const go = (v) => {
    setView(v)
    setError('')
    setSuccess('')
    setPassword('')
    setPassword2('')
    setShowPass(false)
    setShowPass2(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clear()

    const norm = email.trim().toLowerCase()
    if (!norm) { setError('Ingresá tu email.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) { setError('Ingresá un email válido.'); return }

    if (view === VIEWS.register) {
      if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
      if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    }

    if (view !== VIEWS.reset && !password) { setError('Ingresá tu contraseña.'); return }

    setLoading(true)
    try {
      if (view === VIEWS.login) {
        await onLogin(norm, password)
      } else if (view === VIEWS.register) {
        await onRegister(norm, password)
      } else {
        await onForgotPassword(norm)
        setSuccess('Si el email está registrado, te enviamos un enlace para restablecer tu contraseña. Revisá tu casilla.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoText}>VI</span>
        </div>
        <p className={styles.tagline}>Tu colección de películas</p>

        {view !== VIEWS.reset && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${view === VIEWS.login ? styles.tabActive : ''}`}
              onClick={() => go(VIEWS.login)}
              type="button"
            >
              Ingresar
            </button>
            <button
              className={`${styles.tab} ${view === VIEWS.register ? styles.tabActive : ''}`}
              onClick={() => go(VIEWS.register)}
              type="button"
            >
              Registrarse
            </button>
          </div>
        )}

        {view === VIEWS.reset && (
          <>
            <h2 className={styles.resetTitle}>Recuperar contraseña</h2>
            {!success && (
              <p className={styles.resetHint}>Ingresá tu email y te enviamos un enlace para elegir una nueva contraseña.</p>
            )}
          </>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {(view !== VIEWS.reset || !success) && (
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clear() }}
                placeholder="tu@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          )}

          {view === VIEWS.reset ? null : (
            <div className={styles.field}>
              <label htmlFor="password">Contraseña</label>
              <div className={styles.inputWrap}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clear() }}
                  placeholder={view === VIEWS.register ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  autoComplete={view === VIEWS.register ? 'new-password' : 'current-password'}
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  <Icon name={showPass ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </div>
          )}

          {view === VIEWS.register && (
            <div className={styles.field}>
              <label htmlFor="password2">Repetir contraseña</label>
              <div className={styles.inputWrap}>
                <input
                  id="password2"
                  type={showPass2 ? 'text' : 'password'}
                  value={password2}
                  onChange={(e) => { setPassword2(e.target.value); clear() }}
                  placeholder="Repetí la contraseña"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass2(v => !v)}
                  aria-label={showPass2 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  <Icon name={showPass2 ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </div>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
          {success && <p className={styles.success} role="status">{success}</p>}

          {(view !== VIEWS.reset || !success) && (
            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} aria-hidden />
              ) : view === VIEWS.login ? 'Ingresar'
                : view === VIEWS.register ? 'Crear cuenta'
                : 'Enviar enlace'}
            </button>
          )}

          {view === VIEWS.login && (
            <>
              <button
                type="button"
                className={`btn btn-secondary ${styles.submitBtn}`}
                onClick={handleGuest}
                disabled={loading || guestLoading}
              >
                {guestLoading ? <span className={styles.spinner} aria-hidden /> : 'Ver sin cuenta'}
              </button>
              <button
                type="button"
                className={styles.link}
                onClick={() => go(VIEWS.reset)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}

          {view === VIEWS.reset && (
            <button
              type="button"
              className={styles.link}
              onClick={() => go(VIEWS.login)}
            >
              ← Volver a ingresar
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
