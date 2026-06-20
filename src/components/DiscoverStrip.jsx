import { useState, useEffect } from 'react'
import { fetchTrending, getMovieDetails } from '../hooks/useMovieSearch'
import styles from './DiscoverStrip.module.css'

export function DiscoverStrip({ onSelect, onExplore }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState(null)

  useEffect(() => {
    fetchTrending()
      .then(setMovies)
      .catch(() => {})
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

  if (!loading && movies.length === 0) return null

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <span className={styles.title}>Tendencias</span>
          <span className={styles.sub}>esta semana en TMDB</span>
        </div>
        <div className={styles.actions}>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={onExplore}>
            Explorar más →
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Mostrar' : 'Ocultar'}
          >
            {collapsed ? '▼' : '▲'}
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
