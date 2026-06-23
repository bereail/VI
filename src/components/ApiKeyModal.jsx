import { useState, useEffect } from 'react'
import { saveApiKey } from '../hooks/useMovieSearch'
import styles from './ApiKeyModal.module.css'

export function ApiKeyModal({ onClose }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose(false)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSave = (e) => {
    e.preventDefault()
    if (!key.trim()) { setError('Ingresá tu token o API key'); return }
    saveApiKey(key)
    onClose(true)
  }

  return (
    <div className="modal-backdrop" onClick={() => onClose(false)}>
      <div className="modal-panel" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>🎬 Conectar con TMDB</h2>
        </div>
        <form onSubmit={handleSave}>
          <div className={styles.body}>
            <div className={styles.info}>
              <p>Necesitás un token de <strong>The Movie Database (TMDB)</strong> para buscar películas. Es <strong>gratis</strong>:</p>
              <ol className={styles.steps}>
                <li>Creá cuenta en <span className={styles.link}>themoviedb.org</span></li>
                <li>Andá a <em>Configuración → API</em></li>
                <li>Copiá el <em>Read Access Token</em> (el texto largo)</li>
              </ol>
            </div>

            <div className={styles.field}>
              <label htmlFor="apikey">Read Access Token</label>
              <textarea
                id="apikey"
                value={key}
                onChange={(e) => { setKey(e.target.value); setError('') }}
                placeholder="eyJhbGciOiJIUzI1NiJ9..."
                autoComplete="off"
                rows={3}
                className={error ? styles.inputError : ''}
              />
              {error && <span className={styles.error}>{error}</span>}
            </div>
          </div>
          <div className={styles.footer}>
            <button type="button" className="btn btn-secondary" onClick={() => onClose(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
