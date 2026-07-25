import { useState, useEffect } from 'react'
import { api } from '../api'
import { Icon } from '../components/Icon'
import styles from './AdminPage.module.css'

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function AdminPage({ onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [userMovies, setUserMovies] = useState({})
  const [loadingMovies, setLoadingMovies] = useState(null)

  useEffect(() => {
    api.get('/admin/users')
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (userId) => {
    if (expanded === userId) { setExpanded(null); return }
    setExpanded(userId)
    if (!userMovies[userId]) {
      setLoadingMovies(userId)
      const movies = await api.get(`/admin/users/${userId}/movies`).catch(() => [])
      setUserMovies(prev => ({ ...prev, [userId]: movies }))
      setLoadingMovies(null)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <Icon name="arrowRight" size={14} style={{ transform: 'rotate(180deg)' }} />
          Volver
        </button>
        <h1 className={styles.title}>Panel Admin — VI</h1>
      </header>

      <main className={styles.main}>
        {loading ? (
          <p className={styles.loading}>Cargando usuarios…</p>
        ) : users.length === 0 ? (
          <p className={styles.empty}>No hay usuarios registrados.</p>
        ) : (
          <div className={styles.list}>
            <p className={styles.summary}>{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
            {users.map(u => (
              <div key={u.id} className={styles.card}>
                <button className={styles.row} onClick={() => toggle(u.id)}>
                  <div className={styles.userInfo}>
                    <span className={styles.email}>{u.email}</span>
                    <span className={styles.meta}>
                      {u.movie_count} película{u.movie_count !== 1 ? 's' : ''} · desde {formatDate(u.created_at)}
                    </span>
                  </div>
                  <Icon
                    name="chevDown"
                    size={16}
                    className={`${styles.chevron} ${expanded === u.id ? styles.open : ''}`}
                  />
                </button>

                {expanded === u.id && (
                  <div className={styles.movies}>
                    {loadingMovies === u.id ? (
                      <p className={styles.loadingMovies}>Cargando películas…</p>
                    ) : !userMovies[u.id]?.length ? (
                      <p className={styles.noMovies}>Sin películas.</p>
                    ) : (
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Título</th>
                            <th>Año</th>
                            <th>Estado</th>
                            <th>Puntaje</th>
                            <th>Vista</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userMovies[u.id].map((m, i) => (
                            <tr key={i}>
                              <td>{m.title}</td>
                              <td>{m.year || '—'}</td>
                              <td>
                                <span className={m.status === 'vista' ? styles.badgeVista : styles.badgePendiente}>
                                  {m.status === 'vista' ? 'Vista' : 'Pendiente'}
                                </span>
                              </td>
                              <td>{m.rating > 0 ? '★'.repeat(m.rating) : '—'}</td>
                              <td>{formatDate(m.watched_date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
