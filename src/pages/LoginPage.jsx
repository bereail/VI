import { useState } from 'react'
import styles from './LoginPage.module.css'

const VIEWS = { login: 'login', register: 'register', reset: 'reset' }

export function LoginPage({ onLogin, onRegister, onReset }) {
  const [view, setView] = useState(VIEWS.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const clear = () => { setError(''); setSuccess('') }

  const go = (v) => { setView(v); setError(''); setSuccess(''); setPassword(''); setPassword2('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clear()

    const norm = email.trim().toLowerCase()
    if (!norm) { setError('Ingresá tu email.'); return }

    if (view === VIEWS.register) {
      if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
      if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    }

    if (view !== VIEWS.reset && !password) { setError('Ingresá tu contraseña.'); return }

    if (view === VIEWS.reset) {
      if (password.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); return }
      if (password !== password2) { setError('Las contraseñas no coinciden.'); return }
    }

    setLoading(true)
    try {
      if (view === VIEWS.login) {
        await onLogin(norm, password)
      } else if (view === VIEWS.register) {
        await onRegister(norm, password)
      } else {
        await onReset(norm, password)
        setSuccess('Contraseña actualizada. Ya podés iniciar sesión.')
        go(VIEWS.login)
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
          <span className={styles.logoIcon}>🎬</span>
          <span className={styles.logoText}>VI</span>
        </div>
        <p className={styles.tagline}>Tu registro de películas</p>

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

        {view === VIEWS.reset && (
          <h2 className={styles.resetTitle}>Recuperar contraseña</h2>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
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

          {view === VIEWS.reset ? (
            <>
              <div className={styles.field}>
                <label htmlFor="newpass">Nueva contraseña</label>
                <input
                  id="newpass"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clear() }}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="newpass2">Repetir contraseña</label>
                <input
                  id="newpass2"
                  type="password"
                  value={password2}
                  onChange={(e) => { setPassword2(e.target.value); clear() }}
                  placeholder="Repetí la contraseña"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            <div className={styles.field}>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clear() }}
                placeholder={view === VIEWS.register ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                autoComplete={view === VIEWS.register ? 'new-password' : 'current-password'}
                disabled={loading}
              />
            </div>
          )}

          {view === VIEWS.register && (
            <div className={styles.field}>
              <label htmlFor="password2">Repetir contraseña</label>
              <input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => { setPassword2(e.target.value); clear() }}
                placeholder="Repetí la contraseña"
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
          {success && <p className={styles.success} role="status">{success}</p>}

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} aria-hidden />
            ) : view === VIEWS.login ? 'Ingresar'
              : view === VIEWS.register ? 'Crear cuenta'
              : 'Cambiar contraseña'}
          </button>

          {view === VIEWS.login && (
            <button
              type="button"
              className={styles.link}
              onClick={() => go(VIEWS.reset)}
            >
              ¿Olvidaste tu contraseña?
            </button>
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
