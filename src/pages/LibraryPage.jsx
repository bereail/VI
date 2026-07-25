import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { MovieCard } from '../components/MovieCard'
import { MovieRow } from '../components/MovieRow'
import { DiscoverStrip } from '../components/DiscoverStrip'
import { Icon } from '../components/Icon'
import { useDebounce } from '../hooks/useDebounce'
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
  { key: 'priority', label: 'Prioridad' },
]

const SHORTCUTS = [
  { key: 'N', label: 'nueva' },
  { key: 'B', label: 'buscar TMDB' },
  { key: 'S', label: 'stats' },
  { key: '/', label: 'buscar' },
]

const VIEW_KEY = 'vi_view'
const SORT_KEY = 'vi_sort'

function getParam(key, fallback = '') {
  return new URLSearchParams(window.location.search).get(key) ?? fallback
}

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
  onTogglePriority,
  onOpenAdmin,
}) {
  const [search, setSearch] = useState(() => getParam('q'))
  const [status, setStatus] = useState(() => getParam('status') || 'all')
  const [genre, setGenre] = useState(() => getParam('genre'))
  const [director, setDirector] = useState(() => getParam('director'))
  const [decade, setDecade] = useState(() => getParam('decade'))
  const [minRating, setMinRating] = useState(() => Number(getParam('rating')) || 0)
  const [sort, setSort] = useState(() => localStorage.getItem(SORT_KEY) || 'recent')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'grid')
  const [menuOpen, setMenuOpen] = useState(false)
  const importRef = useRef(null)
  const menuRef = useRef(null)

  const debouncedSearch = useDebounce(search, 200)

  useEffect(() => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (genre) params.set('genre', genre)
    if (director) params.set('director', director)
    if (decade) params.set('decade', decade)
    if (minRating > 0) params.set('rating', String(minRating))
    if (search) params.set('q', search)
    const str = params.toString()
    window.history.replaceState(null, '', str ? `?${str}` : window.location.pathname)
  }, [status, genre, director, decade, minRating, search])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const setViewAndPersist = useCallback((v) => {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }, [])

  const setSortAndPersist = useCallback((v) => {
    setSort(v)
    localStorage.setItem(SORT_KEY, v)
  }, [])

  const uniqueDecades = useMemo(() => {
    const set = new Set()
    movies.forEach(m => { if (m.year) set.add(Math.floor(m.year / 10) * 10) })
    return [...set].sort((a, b) => b - a)
  }, [movies])

  const filtered = useMemo(() => {
    let list = [...movies]

    if (status !== 'all') list = list.filter((m) => m.status === status)
    if (genre) list = list.filter((m) => (m.genres || []).includes(genre))
    if (director) list = list.filter((m) => m.director === director)

    if (decade) {
      const d = parseInt(decade)
      list = list.filter(m => m.year && Math.floor(m.year / 10) * 10 === d)
    }

    if (minRating > 0) list = list.filter(m => (m.rating || 0) >= minRating)

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.originalTitle?.toLowerCase().includes(q) ||
          m.director?.toLowerCase().includes(q) ||
          (m.genres || []).some((g) => g.toLowerCase().includes(q)) ||
          m.notes?.toLowerCase().includes(q) ||
          String(m.year ?? '').includes(q)
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
      case 'priority':
        list.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0) || new Date(b.addedDate) - new Date(a.addedDate))
        break
      default:
        list.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
    }

    return list
  }, [movies, status, genre, director, decade, minRating, debouncedSearch, sort])

  const activeFilters = [genre, director, decade, minRating > 0 ? 'r' : ''].filter(Boolean).length

  const handleImportClick = useCallback(() => importRef.current?.click(), [])

  const handleImportChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) onImport(file)
    e.target.value = ''
  }, [onImport])

  const clearAdvancedFilters = useCallback(() => {
    setGenre('')
    setDirector('')
    setDecade('')
    setMinRating(0)
  }, [])

  const clearFilters = useCallback(() => {
    clearAdvancedFilters()
    setSearch('')
    setStatus('all')
  }, [clearAdvancedFilters])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logoText}>VI</span>
          <div className={styles.counters}>
            <span>{stats.watched} vistas</span>
            <span className={styles.sep}>·</span>
            <span>{stats.pending} pendientes</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button className={`btn btn-ghost ${styles.tmdbBtn}`} onClick={onSearchTmdb} aria-label="Buscar en TMDB (B)">
            <Icon name="search" size={16} />
            TMDB
          </button>

          <div className={styles.mobileMenuWrap} ref={menuRef}>
            <button
              className={`btn btn-ghost ${styles.iconBtn}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Más opciones"
              aria-expanded={menuOpen}
            >
              <Icon name="dots" size={20} />
            </button>
            {menuOpen && (
              <div className={styles.mobileDropdown}>
                <span className={styles.dropdownEmail}>{user?.email}</span>
                <button className="btn btn-ghost" onClick={() => { onStats(); closeMenu() }}>
                  <Icon name="chart" size={16} /> Estadísticas
                </button>
                <button className="btn btn-ghost" onClick={() => { onApiKey(); closeMenu() }}>
                  <Icon name="settings" size={16} /> API key
                </button>
                <button className="btn btn-ghost" onClick={() => { onToggleTheme(); closeMenu() }}>
                  <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
                  {theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
                </button>
                {onOpenAdmin && (
                  <button className="btn btn-ghost" onClick={() => { onOpenAdmin(); closeMenu() }}>
                    <Icon name="users" size={16} /> Admin
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => { onExport(); closeMenu() }}>
                  <Icon name="upload" size={16} /> Exportar
                </button>
                <button className="btn btn-ghost" onClick={() => { handleImportClick(); closeMenu() }}>
                  <Icon name="download" size={16} /> Importar
                </button>
                <button className={`btn btn-ghost ${styles.menuLogout}`} onClick={() => { onLogout(); closeMenu() }}>
                  <Icon name="logout" size={16} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>

          <input
            ref={importRef}
            type="file"
            accept=".json"
            onChange={handleImportChange}
            className="sr-only"
            aria-hidden
          />

          <button className="btn btn-primary" onClick={onAdd} aria-label="Agregar película (N)">
            <Icon name="plus" size={16} />
            Agregar
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <Icon name="search" size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, director, género, año..."
            aria-label="Buscar películas"
            data-shortcut="filter"
          />
          {search && (
            <button className={`btn btn-ghost ${styles.clearBtn}`} onClick={() => setSearch('')} aria-label="Limpiar">
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.tabs}>
            {STATUS_TABS.map((t) => {
              const count = t.key === 'all' ? movies.length : t.key === 'vista' ? stats.watched : stats.pending
              return (
                <button
                  key={t.key}
                  className={`${styles.tab} ${status === t.key ? styles.tabActive : ''}`}
                  onClick={() => setStatus(t.key)}
                >
                  {t.label}
                  {count > 0 && <span className={styles.tabCount}>{count}</span>}
                </button>
              )
            })}
          </div>

          <div className={styles.controlsRight}>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSortAndPersist(e.target.value)}
              aria-label="Ordenar por"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>

            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${view === 'grid' ? styles.viewActive : ''}`}
                onClick={() => setViewAndPersist('grid')}
                aria-label="Vista cuadrícula"
                title="Cuadrícula"
              >
                <Icon name="grid" size={15} />
              </button>
              <button
                className={`${styles.viewBtn} ${view === 'list' ? styles.viewActive : ''}`}
                onClick={() => setViewAndPersist('list')}
                aria-label="Vista lista"
                title="Lista"
              >
                <Icon name="list" size={15} />
              </button>
            </div>

            <button
              className={`btn btn-secondary ${filtersOpen ? styles.filterBtnActive : ''}`}
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
            >
              <Icon name="filter" size={15} />
              Filtros
              {activeFilters > 0 && <span className={styles.filterBadge}>{activeFilters}</span>}
            </button>
          </div>
        </div>

        {activeFilters > 0 && (
          <div className={styles.activeChips}>
            {genre && (
              <button className={styles.chip} onClick={() => setGenre('')}>
                {genre}
                <Icon name="close" size={11} />
              </button>
            )}
            {director && (
              <button className={styles.chip} onClick={() => setDirector('')}>
                {director}
                <Icon name="close" size={11} />
              </button>
            )}
            {decade && (
              <button className={styles.chip} onClick={() => setDecade('')}>
                {decade}s
                <Icon name="close" size={11} />
              </button>
            )}
            {minRating > 0 && (
              <button className={styles.chip} onClick={() => setMinRating(0)}>
                {'★'.repeat(minRating)}+
                <Icon name="close" size={11} />
              </button>
            )}
            {activeFilters > 1 && (
              <button className={styles.clearChip} onClick={clearAdvancedFilters}>
                Limpiar todo
              </button>
            )}
          </div>
        )}

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
            {uniqueDecades.length > 0 && (
              <div className={styles.filterField}>
                <label>Década</label>
                <select value={decade} onChange={(e) => setDecade(e.target.value)}>
                  <option value="">Todas las décadas</option>
                  {uniqueDecades.map(d => <option key={d} value={String(d)}>{d}s</option>)}
                </select>
              </div>
            )}
            <div className={styles.filterField}>
              <label>Puntuación mínima</label>
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                <option value={0}>Cualquier puntuación</option>
                <option value={1}>★ 1+</option>
                <option value={2}>★★ 2+</option>
                <option value={3}>★★★ 3+</option>
                <option value={4}>★★★★ 4+</option>
                <option value={5}>★★★★★ Solo 5</option>
              </select>
            </div>
            {activeFilters > 0 && (
              <button className="btn btn-ghost" onClick={clearAdvancedFilters} style={{ alignSelf: 'flex-end' }}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <DiscoverStrip onSelect={onAddFromDiscover} onExplore={onSearchTmdb} />

      <main className={styles.main}>
        {movies.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icon name="film" size={56} style={{ color: 'var(--bg-4)' }} />
            </div>
            <div className={styles.emptyActions}>
              <button className="btn btn-primary" onClick={onSearchTmdb}>
                <Icon name="search" size={16} /> Buscar en TMDB
              </button>
              <button className="btn btn-secondary" onClick={onAdd}>
                <Icon name="plus" size={16} /> Agregar manual
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Sin resultados para esa búsqueda</p>
            <button className="btn btn-secondary" onClick={clearFilters}>Limpiar filtros</button>
          </div>
        ) : view === 'grid' ? (
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
                onTogglePriority={onTogglePriority}
              />
            ))}
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map((movie) => (
              <MovieRow
                key={movie.id}
                movie={movie}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkWatched={onMarkWatched}
                onMarkPending={onMarkPending}
                onRate={onRate}
                onTogglePriority={onTogglePriority}
              />
            ))}
          </div>
        )}
      </main>

      <div className={styles.shortcuts}>
        {SHORTCUTS.map(({ key, label }) => (
          <span key={key}><kbd>{key}</kbd> {label}</span>
        ))}
      </div>
    </div>
  )
}
