import { useState, useEffect } from 'react'
import { api } from '../api'
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
                  <svg
                    className={`${styles.chevron} ${expanded === u.id ? styles.open : ''}`}
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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
