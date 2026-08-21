import { useState } from 'react'
import { Icon } from '../components/Icon'
import styles from './LoginPage.module.css'

export function ResetPasswordPage({ token, onReset, onDone }) {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== password2) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    try {
      await onReset(token, password)
      setSuccess(true)
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
        <h2 className={styles.resetTitle}>Nueva contraseña</h2>
        {!success && <p className={styles.resetHint}>Elegí una nueva contraseña para tu cuenta.</p>}

        {success ? (
          <div className={styles.form}>
            <p className={styles.success} role="status">¡Contraseña actualizada! Ya podés iniciar sesión.</p>
            <button type="button" className={`btn btn-primary ${styles.submitBtn}`} onClick={onDone}>
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="newpass">Contraseña nueva</label>
              <div className={styles.inputWrap}>
                <input
                  id="newpass"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  disabled={loading}
                  autoFocus
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
            <div className={styles.field}>
              <label htmlFor="newpass2">Repetir contraseña</label>
              <div className={styles.inputWrap}>
                <input
                  id="newpass2"
                  type={showPass2 ? 'text' : 'password'}
                  value={password2}
                  onChange={(e) => { setPassword2(e.target.value); setError('') }}
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

            {error && <p className={styles.error} role="alert">{error}</p>}

            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? <span className={styles.spinner} aria-hidden /> : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
