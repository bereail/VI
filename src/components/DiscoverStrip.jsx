import { useState, useEffect } from 'react'
import { fetchTrending, getMovieDetails } from '../hooks/useMovieSearch'
import { Icon } from './Icon'
import styles from './DiscoverStrip.module.css'

export function DiscoverStrip({ onSelect, onExplore }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('vi_discover_collapsed') === '1')
  const [adding, setAdding] = useState(null)

  useEffect(() => {
    fetchTrending()
      .then(setMovies)
      .catch(() => setFetchFailed(true))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (movie) => {
    if (adding) return
    setAdding(movie.tmdbId)
    try {
      const details = await getMovieDetails(movie.tmdbId)
      onSelect(details)
    } catch {
      onSelect(movie)
    } finally {
      setAdding(null)
    }
  }

  if (!loading && (movies.length === 0 || fetchFailed)) return null

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <span className={styles.title}>Tendencias</span>
          <span className={styles.sub}>esta semana</span>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-ghost" style={{ fontSize: 12, gap: 4 }} onClick={onExplore}>
            Explorar
            <Icon name="arrowRight" size={14} />
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 8px' }}
            onClick={() => setCollapsed(c => {
              const next = !c
              localStorage.setItem('vi_discover_collapsed', next ? '1' : '0')
              return next
            })}
            aria-label={collapsed ? 'Mostrar tendencias' : 'Ocultar tendencias'}
          >
            <Icon name={collapsed ? 'chevDown' : 'chevUp'} size={16} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className={styles.scroll}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`${styles.card} ${styles.skeleton}`} />
              ))
            : movies.map(movie => (
                <div key={movie.tmdbId} className={styles.card}>
                  <div className={styles.poster}>
                    {movie.poster ? (
                      <img src={movie.poster} alt={movie.title} loading="lazy" />
                    ) : (
                      <div className={styles.noPoster}>{movie.title[0]}</div>
                    )}
                    {movie.tmdbRating > 0 && (
                      <span className={styles.rating}>★ {movie.tmdbRating}</span>
                    )}
                    <button
                      className={styles.addBtn}
                      onClick={() => handleAdd(movie)}
                      disabled={adding === movie.tmdbId}
                      aria-label={`Agregar ${movie.title}`}
                    >
                      {adding === movie.tmdbId ? '…' : '+'}
                    </button>
                  </div>
                  <div className={styles.info}>
                    <span className={styles.cardTitle}>{movie.title}</span>
                    {movie.year && <span className={styles.cardYear}>{movie.year}</span>}
                  </div>
                </div>
              ))}
        </div>
      )}
    </section>
  )
}
