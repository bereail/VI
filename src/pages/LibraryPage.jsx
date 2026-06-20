import { useState, useMemo, useCallback, useRef } from 'react'
import { MovieCard } from '../components/MovieCard'
import { DiscoverStrip } from '../components/DiscoverStrip'
import styles from './LibraryPage.module.css'

const STATUS_TABS = [
  { key: 'all', label: 'Todas' },
  { key: 'vista', label: 'Vistas' },
  { key: 'pendiente', label: 'Pendientes' },
]

const SORT_OPTIONS = [
  { key: 'recent', label: 'Más recientes' },
  { key: 'oldest', label: 'Más antiguas' },
  { key: 'rating', label: 'Mejor puntuadas' },
  { key: 'title', label: 'A → Z' },
  { key: 'year', label: 'Año' },
]

export function LibraryPage({
  movies,
  uniqueGenres,
  uniqueDirectors,
  stats,
  user,
  onEdit,
  onDelete,
  onMarkWatched,
  onMarkPending,
  onRate,
  onAdd,
  onSearchTmdb,
  onAddFromDiscover,
  onStats,
  onExport,
  onImport,
  onToggleTheme,
  theme,
  onApiKey,
  onLogout,
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [genre, setGenre] = useState('')
  const [director, setDirector] = useState('')
  const [sort, setSort] = useState('recent')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const importRef = useRef(null)

  const filtered = useMemo(() => {
    let list = [...movies]

    if (status !== 'all') list = list.filter((m) => m.status === status)

    if (genre) list = list.filter((m) => (m.genres || []).includes(genre))

    if (director) list = list.filter((m) => m.director === director)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.originalTitle?.toLowerCase().includes(q) ||
          m.director?.toLowerCase().includes(q) ||
          (m.genres || []).some((g) => g.toLowerCase().includes(q)) ||
          m.notes?.toLowerCase().includes(q)
      )
    }

    switch (sort) {
      case 'oldest':
        list.sort((a, b) => new Date(a.addedDate) - new Date(b.addedDate))
        break
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title, 'es'))
        break
      case 'year':
        list.sort((a, b) => (b.year || 0) - (a.year || 0))
        break
      default:
        list.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
    }

    return list
  }, [movies, status, genre, director, search, sort])

  const activeFilters = [genre, director].filter(Boolean).length

  const handleImportClick = useCallback(() => importRef.current?.click(), [])

  const handleImportChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) onImport(file)
    e.target.value = ''
  }, [onImport])

  const clearFilters = useCallback(() => {
    setGenre('')
    setDirector('')
    setSearch('')
    setStatus('all')
  }, [])

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎬</span>
            <span className={styles.logoText}>VI</span>
          </div>
          <div className={styles.counters}>
            <span className={styles.counter}>{stats.watched} vistas</span>
            <span className={styles.counterSep}>·</span>
            <span className={styles.counter}>{stats.pending} pendientes</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userEmail} title={user?.email}>{user?.email}</span>
          <button className="btn btn-ghost" onClick={onStats} aria-label="Estadísticas">
            📊
          </button>
          <button className="btn btn-ghost" onClick={onApiKey} title="Configurar TMDB API key" aria-label="API key">
            ⚙️
          </button>
          <button className="btn btn-ghost" onClick={onToggleTheme} aria-label="Cambiar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-ghost" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
            ↩
          </button>
          <div className={styles.headerMenu}>
            <button className="btn btn-ghost" onClick={onExport} title="Exportar" aria-label="Exportar">
              ⬆️
            </button>
            <button className="btn btn-ghost" onClick={handleImportClick} title="Importar" aria-label="Importar">
              ⬇️
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              onChange={handleImportChange}
              className="sr-only"
              aria-hidden
            />
          </div>
          <button className="btn btn-ghost" onClick={onSearchTmdb} aria-label="Buscar en TMDB (B)">
            🔍 TMDB
          </button>
          <button className="btn btn-primary" onClick={onAdd} aria-label="Agregar película (N)">
            + Agregar
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, director, género..."
            aria-label="Buscar películas"
          />
          {search && (
            <button className="btn btn-ghost" onClick={() => setSearch('')} aria-label="Limpiar" style={{ padding: '4px 8px' }}>✕</button>
          )}
        </div>

        <div className={styles.controlsRow}>
          {/* Status tabs */}
          <div className={styles.tabs}>
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                className={`${styles.tab} ${status === t.key ? styles.tabActive : ''}`}
                onClick={() => setStatus(t.key)}
              >
                {t.label}
                {t.key === 'all' && movies.length > 0 && (
                  <span className={styles.tabCount}>{movies.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.controlsRight}>
            {/* Sort */}
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Ordenar por"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>

            {/* Filters toggle */}
            <button
              className={`btn btn-secondary ${filtersOpen ? styles.filterBtnActive : ''}`}
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
            >
              Filtros {activeFilters > 0 && <span className={styles.filterBadge}>{activeFilters}</span>}
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        {filtersOpen && (
          <div className={styles.filters}>
            <div className={styles.filterField}>
              <label>Género</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option value="">Todos los géneros</option>
                {uniqueGenres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className={styles.filterField}>
              <label>Director/a</label>
              <select value={director} onChange={(e) => setDirector(e.target.value)}>
                <option value="">Todos los directores</option>
                {uniqueDirectors.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {activeFilters > 0 && (
              <button className="btn btn-ghost" onClick={clearFilters} style={{ alignSelf: 'flex-end' }}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Discover strip */}
      <DiscoverStrip onSelect={onAddFromDiscover} onExplore={onSearchTmdb} />

      {/* Grid */}
      <main className={styles.main}>
        {filtered.length === 0 && movies.length > 0 ? (
          <div className={styles.emptyState}>
            <p>Sin resultados para esa búsqueda</p>
            <button className="btn btn-secondary" onClick={clearFilters}>Limpiar filtros</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkWatched={onMarkWatched}
                onMarkPending={onMarkPending}
                onRate={onRate}
              />
            ))}
          </div>
        )}
      </main>

      {/* Keyboard shortcuts hint */}
      <div className={styles.shortcuts}>
        <span><kbd>N</kbd> nueva</span>
        <span><kbd>B</kbd> buscar TMDB</span>
        <span><kbd>S</kbd> stats</span>
        <span><kbd>/</kbd> filtrar</span>
      </div>
    </div>
  )
}
