import { useMemo } from 'react'
import styles from './StatsModal.module.css'
import { StarRating } from './StarRating'
import { Icon } from './Icon'

function Bar({ label, value, max, color = 'var(--accent)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.barValue}>{value}</span>
    </div>
  )
}

function hours(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h && !m) return '—'
  if (!h) return `${m}min`
  if (!m) return `${h}h`
  return `${h}h ${m}min`
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function StatsModal({ stats, onClose }) {
  const { watched, pending, total, avgRating, totalMinutes, topGenres, topDirectors, monthlyCount, topRated } = stats

  const maxGenre = useMemo(() => topGenres.length ? Math.max(...topGenres.map((g) => g[1])) : 1, [topGenres])
  const maxDir = useMemo(() => topDirectors.length ? Math.max(...topDirectors.map((d) => d[1])) : 1, [topDirectors])
  const maxMonth = useMemo(() => {
    const vals = Object.values(monthlyCount)
    return vals.length ? Math.max(...vals, 1) : 1
  }, [monthlyCount])

  const monthEntries = useMemo(() => Object.entries(monthlyCount), [monthlyCount])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Estadísticas</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '6px' }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryNum}>{watched}</span>
              <span className={styles.summaryLabel}>Vistas</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryNum}>{pending}</span>
              <span className={styles.summaryLabel}>Pendientes</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryNum}>{total}</span>
              <span className={styles.summaryLabel}>Total</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryNum}>{hours(totalMinutes)}</span>
              <span className={styles.summaryLabel}>Tiempo total</span>
            </div>
            <div className={`${styles.summaryCard} ${styles.summaryAccent}`}>
              <span className={styles.summaryNum}>{avgRating > 0 ? avgRating : '—'}</span>
              <div className={styles.avgStars}>
                <StarRating value={Math.round(avgRating)} readOnly size="sm" />
              </div>
              <span className={styles.summaryLabel}>Promedio</span>
            </div>
          </div>

          {watched === 0 && (
            <div className={styles.empty}>
              <p>Todavía no marcaste películas como vistas.</p>
              <p>¡Empezá a registrar tu cine!</p>
            </div>
          )}

          {watched > 0 && monthEntries.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Películas por mes</h3>
              <div className={styles.monthChart}>
                {monthEntries.map(([key, count]) => {
                  const month = parseInt(key.split('-')[1]) - 1
                  const pct = maxMonth > 0 ? (count / maxMonth) * 100 : 0
                  return (
                    <div key={key} className={styles.monthCol}>
                      <span className={styles.monthCount}>{count > 0 ? count : ''}</span>
                      <div className={styles.monthBar}>
                        <div className={styles.monthFill} style={{ height: `${pct}%` }} />
                      </div>
                      <span className={styles.monthLabel}>{MONTH_LABELS[month]}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {topGenres.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Géneros favoritos</h3>
              <div className={styles.bars}>
                {topGenres.map(([genre, count]) => (
                  <Bar key={genre} label={genre} value={count} max={maxGenre} />
                ))}
              </div>
            </section>
          )}

          {topDirectors.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Directores más vistos</h3>
              <div className={styles.bars}>
                {topDirectors.map(([dir, count]) => (
                  <Bar key={dir} label={dir} value={count} max={maxDir} color="var(--status-pending)" />
                ))}
              </div>
            </section>
          )}

          {topRated.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Mejor puntuadas</h3>
              <div className={styles.topRated}>
                {topRated.map((m, i) => (
                  <div key={m.id} className={styles.topRatedRow}>
                    <span className={styles.topRatedRank}>#{i + 1}</span>
                    {m.poster && <img src={m.poster} alt={m.title} className={styles.topRatedPoster} />}
                    <div className={styles.topRatedInfo}>
                      <span className={styles.topRatedTitle}>{m.title}</span>
                      {m.year && <span className={styles.topRatedYear}>{m.year}</span>}
                    </div>
                    <StarRating value={m.rating} readOnly size="sm" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
