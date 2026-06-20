import { useState, useEffect, useRef } from 'react'
import { useMovieSearch, posterUrl } from '../hooks/useMovieSearch'
import styles from './SearchModal.module.css'

export function SearchModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [loading2, setLoading2] = useState(false)
  const { results, loading, error, search, getDetails, clear } = useMovieSearch()
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    return () => clear()
  }, [clear])

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleChange = (e) => {
    const v = e.target.value
    setQuery(v)
    search(v)
  }

  const handleSelect = async (movie) => {
    setLoading2(true)
    try {
      const details = await getDetails(movie.tmdbId)
      onSelect(details)
    } catch {
      onSelect(movie)
    } finally {
      setLoading2(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-panel ${styles.panel}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchBar}>
          <span className={styles.icon}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Buscar película en TMDB..."
            className={styles.input}
          />
          {query && (
            <button className="btn btn-ghost" onClick={() => { setQuery(''); clear() }} aria-label="Limpiar">✕</button>
          )}
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar">Esc</button>
        </div>

        {error && (
          <div className={styles.error}>
            <span>⚠️</span> {error}
          </div>
        )}

        {(loading || loading2) && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Buscando...</span>
          </div>
        )}

        {!loading && !loading2 && results.length === 0 && query.length > 1 && !error && (
          <div className={styles.empty}>Sin resultados para "{query}"</div>
        )}

        {!loading && !loading2 && results.length === 0 && !query && (
          <div className={styles.hint}>
            <p>Buscá por título en español o inglés</p>
            <p className={styles.hintSub}>Los datos se importan automáticamente desde TMDB</p>
          </div>
        )}

        <div className={styles.results}>
          {results.map((movie) => (
            <button
              key={movie.tmdbId}
              className={styles.result}
              onClick={() => handleSelect(movie)}
            >
              <div className={styles.resultPoster}>
                {movie.poster ? (
                  <img src={posterUrl(null) || movie.poster} alt={movie.title} />
                ) : (
                  <div className={styles.noPoster}>{movie.title[0]}</div>
                )}
              </div>
              <div className={styles.resultInfo}>
                <span className={styles.resultTitle}>{movie.title}</span>
                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <span className={styles.resultOriginal}>{movie.originalTitle}</span>
                )}
                <div className={styles.resultMeta}>
                  {movie.year && <span>{movie.year}</span>}
                  {movie.genres.slice(0, 2).map((g) => (
                    <span key={g} className="tag">{g}</span>
                  ))}
                </div>
                {movie.overview && (
                  <p className={styles.resultOverview}>{movie.overview}</p>
                )}
              </div>
              <span className={styles.resultArrow}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
