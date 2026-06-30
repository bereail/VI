import { useState, useCallback, useEffect } from 'react'
import { StarRating } from './StarRating'
import { Icon } from './Icon'
import styles from './MovieCard.module.css'

const DEFAULT_COLOR = '#1a2a4a'

function initials(title = '') {
  return title.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function formatRuntime(min) {
  if (!min) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m}min`
  if (!m) return `${h}h`
  return `${h}h ${m}min`
}

export function MovieCard({ movie, onEdit, onDelete, onMarkWatched, onMarkPending, onRate, onTogglePriority }) {
  const [flipped, setFlipped] = useState(false)
  const [pickingDate, setPickingDate] = useState(false)
  const [watchDate, setWatchDate] = useState('')

  const flip = useCallback(() => setFlipped((f) => !f), [])
  const stop = useCallback((e) => e.stopPropagation(), [])

  const handleAction = useCallback((e, fn) => {
    e.stopPropagation()
    fn()
  }, [])

  useEffect(() => {
    if (!flipped) setPickingDate(false)
  }, [flipped])

  const { title, year, director, genres = [], poster, overview, status, rating, watchedDate, notes, coverColor, runtime, priority } = movie
  const isWatched = status === 'vista'

  return (
    <div
      className={styles.wrapper}
      onClick={flip}
      role="button"
      tabIndex={0}
      aria-label={`${title} — clic para ver detalles`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && flip()}
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
              {!isWatched && priority && (
                <span className={styles.priorityStar}>★</span>
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
              <div className={styles.backTitleWrap}>
                <h3 className={styles.backTitle}>{title}</h3>
                <p className={styles.backMeta}>
                  {[year, director, formatRuntime(runtime)].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                className={`btn btn-ghost ${styles.closeBtn}`}
                onClick={(e) => handleAction(e, flip)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={14} />
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
              <span className={styles.ratingLabel}>Puntuación</span>
              <StarRating
                value={rating}
                onChange={(v) => onRate(movie.id, v)}
              />
            </div>

            {isWatched && watchedDate && (
              <p className={styles.watchedDate}>
                Vista el {new Date(watchedDate + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}

            {notes && (
              <p className={styles.notes}>"{notes}"</p>
            )}

            {pickingDate ? (
              <div className={styles.datePicker} onClick={stop}>
                <input
                  type="date"
                  value={watchDate}
                  onChange={(e) => setWatchDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className={styles.dateInput}
                />
                <button
                  className="btn btn-primary"
                  onClick={(e) => handleAction(e, () => {
                    onMarkWatched(movie.id, watchDate || new Date().toISOString().slice(0, 10))
                    setPickingDate(false)
                  })}
                  aria-label="Confirmar fecha"
                >
                  <Icon name="check" size={14} />
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={(e) => handleAction(e, () => setPickingDate(false))}
                  aria-label="Cancelar"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ) : (
              <div className={styles.actions}>
                <button
                  className="btn btn-secondary"
                  onClick={(e) => handleAction(e, () => onEdit(movie))}
                  aria-label="Editar"
                >
                  <Icon name="edit" size={13} />
                  Editar
                </button>
                {!isWatched && (
                  <button
                    className={`btn ${priority ? 'btn-primary' : 'btn-ghost'} ${styles.priorityBtn}`}
                    onClick={(e) => handleAction(e, () => onTogglePriority?.(movie.id))}
                    title={priority ? 'Quitar prioridad' : 'Alta prioridad'}
                    aria-label="Prioridad"
                  >
                    <Icon name="star" size={14} />
                  </button>
                )}
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
                    onClick={(e) => handleAction(e, () => {
                      setWatchDate(new Date().toISOString().slice(0, 10))
                      setPickingDate(true)
                    })}
                    aria-label="Marcar como vista"
                  >
                    <Icon name="check" size={13} />
                    Vista
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={(e) => handleAction(e, () => onDelete(movie.id))}
                  aria-label="Eliminar"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
