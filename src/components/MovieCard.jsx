import { useState, useCallback } from 'react'
import { StarRating } from './StarRating'
import styles from './MovieCard.module.css'

const DEFAULT_COLOR = '#1a2a4a'

function initials(title = '') {
  return title.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function MovieCard({ movie, onEdit, onDelete, onMarkWatched, onMarkPending, onRate }) {
  const [flipped, setFlipped] = useState(false)

  const flip = useCallback(() => setFlipped((f) => !f), [])

  const stop = useCallback((e) => e.stopPropagation(), [])

  const handleAction = useCallback((e, fn) => {
    e.stopPropagation()
    fn()
  }, [])

  const { title, year, director, genres = [], poster, overview, status, rating, watchedDate, notes, coverColor } = movie

  const isWatched = status === 'vista'

  return (
    <div
      className={styles.wrapper}
      onClick={flip}
      role="button"
      tabIndex={0}
      aria-label={`${title} — clic para ver detalles`}
      onKeyDown={(e) => e.key === 'Enter' && flip()}
    >
      <div className={`${styles.card} ${flipped ? styles.flipped : ''}`}>
        {/* FRONT */}
        <div className={styles.front}>
          {poster ? (
            <img src={poster} alt={title} className={styles.poster} loading="lazy" />
          ) : (
            <div className={styles.placeholder} style={{ background: coverColor || DEFAULT_COLOR }}>
              <span className={styles.initials}>{initials(title)}</span>
            </div>
          )}
          <div className={styles.overlay}>
            <div className={styles.statusBadge}>
              {isWatched ? (
                <span className="badge badge-watched">✓ Vista</span>
              ) : (
                <span className="badge badge-pending">◷ Pendiente</span>
              )}
            </div>
            <div className={styles.titleBar}>
              <p className={styles.cardTitle}>{title}</p>
              {year && <span className={styles.cardYear}>{year}</span>}
              {isWatched && rating > 0 && (
                <div className={styles.miniStars}>
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className={styles.back} onClick={stop}>
          {poster && (
            <div
              className={styles.backBg}
              style={{ backgroundImage: `url(${poster})` }}
            />
          )}
          <div className={styles.backContent}>
            <div className={styles.backHeader}>
              <div>
                <h3 className={styles.backTitle}>{title}</h3>
                <p className={styles.backMeta}>
                  {[year, director].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                className={`btn btn-ghost ${styles.closeBtn}`}
                onClick={(e) => handleAction(e, flip)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {genres.length > 0 && (
              <div className={styles.genres}>
                {genres.map((g) => <span key={g} className="tag">{g}</span>)}
              </div>
            )}

            {overview && (
              <p className={styles.overview}>{overview}</p>
            )}

            <div className={styles.ratingRow} onClick={stop}>
              <span className={styles.ratingLabel}>Mi puntuación</span>
              <StarRating
                value={rating}
                onChange={(v) => onRate(movie.id, v)}
              />
            </div>

            {isWatched && watchedDate && (
              <p className={styles.watchedDate}>
                <span>📅</span> Vista el {new Date(watchedDate + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}

            {notes && (
              <p className={styles.notes}>"{notes}"</p>
            )}

            <div className={styles.actions}>
              <button
                className="btn btn-secondary"
                onClick={(e) => handleAction(e, () => onEdit(movie))}
                aria-label="Editar"
              >
                ✏️ Editar
              </button>
              {isWatched ? (
                <button
                  className="btn btn-secondary"
                  onClick={(e) => handleAction(e, () => onMarkPending(movie.id))}
                  aria-label="Mover a pendientes"
                >
                  ◷ Pendiente
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={(e) => handleAction(e, () => onMarkWatched(movie.id, null))}
                  aria-label="Marcar como vista"
                >
                  ✓ Marcar vista
                </button>
              )}
              <button
                className="btn btn-danger"
                onClick={(e) => handleAction(e, () => onDelete(movie.id))}
                aria-label="Eliminar"
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
