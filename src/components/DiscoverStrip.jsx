import { useState, useEffect, useCallback } from 'react'
import { fetchTrending, fetchDiscover, getMovieDetails } from '../hooks/useMovieSearch'
import { Icon } from './Icon'
import styles from './DiscoverStrip.module.css'

const CATEGORIES = [
  { key: 'trending', label: 'Tendencias', fetch: fetchTrending },
  { key: 'top_rated', label: 'Mejor puntuadas', fetch: () => fetchDiscover({ sortBy: 'vote_average.desc' }).then(d => d.results) },
  { key: 'popular', label: 'Populares', fetch: () => fetchDiscover({ sortBy: 'popularity.desc' }).then(d => d.results) },
  { key: 'now_playing', label: 'En cines', fetch: () => fetchDiscover({ sortBy: 'primary_release_date.desc' }).then(d => d.results) },
]

function DiscoverCard({ movie, adding, onAdd }) {
  return (
    <div className={styles.card}>
      <div className={styles.poster}>
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title} loading="lazy" decoding="async" />
        ) : (
          <div className={styles.noPoster}>{movie.title[0]}</div>
        )}
        {movie.tmdbRating > 0 && (
          <span className={styles.rating}>★ {movie.tmdbRating}</span>
        )}
        <button
          className={styles.addBtn}
          onClick={() => onAdd(movie)}
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
  )
}

function DiscoverRow({ label, movies, loading, adding, onAdd }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowTitle}>{label}</span>
      <div className={styles.scroll}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`${styles.card} ${styles.skeleton}`} />
            ))
          : movies.map(movie => (
              <DiscoverCard key={movie.tmdbId} movie={movie} adding={adding} onAdd={onAdd} />
            ))}
      </div>
    </div>
  )
}

export function DiscoverStrip({ onSelect, onExplore }) {
  const [data, setData] = useState(() =>
    Object.fromEntries(CATEGORIES.map(c => [c.key, { movies: [], loading: true, failed: false }]))
  )
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('vi_discover_collapsed') === '1')
  const [adding, setAdding] = useState(null)

  useEffect(() => {
    CATEGORIES.forEach(({ key, fetch }) => {
      fetch()
        .then(movies => setData(prev => ({ ...prev, [key]: { movies, loading: false, failed: false } })))
        .catch(() => setData(prev => ({ ...prev, [key]: { movies: [], loading: false, failed: true } })))
    })
  }, [])

  const handleAdd = useCallback(async (movie) => {
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
  }, [adding, onSelect])

  const visibleCategories = CATEGORIES.filter(c => {
    const row = data[c.key]
    return row.loading || (row.movies.length > 0 && !row.failed)
  })

  if (visibleCategories.length === 0) return null

  const toggleCollapsed = () => setCollapsed(c => {
    const next = !c
    localStorage.setItem('vi_discover_collapsed', next ? '1' : '0')
    return next
  })

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.title}>Descubrí</span>
        <div className={styles.actions}>
          <button className="btn btn-ghost" style={{ fontSize: 12, gap: 4 }} onClick={onExplore}>
            Explorar
            <Icon name="arrowRight" size={14} />
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 8px' }}
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Mostrar descubrimiento' : 'Ocultar descubrimiento'}
          >
            <Icon name={collapsed ? 'chevDown' : 'chevUp'} size={16} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className={styles.categories}>
          {visibleCategories.map(c => (
            <DiscoverRow
              key={c.key}
              label={c.label}
              movies={data[c.key].movies}
              loading={data[c.key].loading}
              adding={adding}
              onAdd={handleAdd}
            />
          ))}
        </div>
      )}
    </section>
  )
}
