import { memo } from 'react'
import { StarRating } from './StarRating'
import { Icon } from './Icon'
import { initials, formatRuntime } from '../utils'
import { exportMovieCard } from '../exportCard'
import styles from './MovieRow.module.css'

export const MovieRow = memo(function MovieRow({ movie, onEdit, onDelete, onMarkWatched, onMarkPending, onRate, onTogglePriority }) {
  const { id, title, year, director, genres = [], poster, coverColor, status, rating, runtime, priority } = movie
  const isWatched = status === 'vista'

  return (
    <div className={styles.row}>
      <div className={styles.poster}>
        {poster
          ? <img src={poster} alt={title} loading="lazy" />
          : (
            <div className={styles.noPoster} style={{ background: coverColor || '#1a2a4a' }}>
              {initials(title)}
            </div>
          )
        }
      </div>

      <div className={styles.info}>
        <div className={styles.titleRow}>
          <span className={styles.title} title={title}>{title}</span>
          {year && <span className={styles.year}>{year}</span>}
          {isWatched
            ? <span className="badge badge-watched">✓ Vista</span>
            : <span className="badge badge-pending">◷ Pendiente</span>
          }
          {!isWatched && priority && (
            <span className={styles.priorityDot} title="Alta prioridad">★</span>
          )}
        </div>
        <div className={styles.meta}>
          {director && <span>{director}</span>}
          {runtime && <span>{formatRuntime(runtime)}</span>}
          {genres.slice(0, 2).map(g => <span key={g} className="tag">{g}</span>)}
        </div>
      </div>

      <div className={styles.rating}>
        <StarRating value={rating} onChange={v => onRate(id, v)} size="sm" />
      </div>

      <div className={styles.actions}>
        {!isWatched && (
          <button
            className={`${styles.iconBtn} ${priority ? styles.priorityActive : ''}`}
            onClick={() => onTogglePriority?.(id)}
            title={priority ? 'Quitar prioridad' : 'Alta prioridad'}
            aria-label="Prioridad"
          >
            <Icon name="star" size={15} />
          </button>
        )}
        <button className={styles.iconBtn} onClick={() => onEdit(movie)} title="Editar" aria-label="Editar">
          <Icon name="edit" size={15} />
        </button>
        <button className={styles.iconBtn} onClick={() => exportMovieCard(movie)} title="Exportar como imagen" aria-label="Exportar como imagen">
          <Icon name="download" size={15} />
        </button>
        {isWatched
          ? (
            <button className={styles.iconBtn} onClick={() => onMarkPending(id)} title="Mover a pendientes" aria-label="Mover a pendientes">
              <Icon name="clock" size={15} />
            </button>
          )
          : (
            <button
              className={`${styles.iconBtn} ${styles.watchedBtn}`}
              onClick={() => onMarkWatched(id, new Date().toISOString().slice(0, 10))}
              title="Marcar como vista (hoy)"
              aria-label="Marcar como vista"
            >
              <Icon name="check" size={15} />
            </button>
          )
        }
        <button
          className={`${styles.iconBtn} ${styles.deleteBtn}`}
          onClick={() => onDelete(id)}
          title="Eliminar"
          aria-label="Eliminar"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </div>
  )
})
