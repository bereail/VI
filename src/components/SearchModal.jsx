import { useState, useEffect, useRef, useCallback } from 'react'
import {
  useMovieSearch,
  fetchTrending,
  fetchDiscover,
  searchPerson,
  getTmdbGenres,
} from '../hooks/useMovieSearch'
import { Icon } from './Icon'
import styles from './SearchModal.module.css'

const TABS = [
  { key: 'trending', label: 'Tendencias' },
  { key: 'popular', label: 'Popular' },
  { key: 'top_rated', label: 'Mejor puntaje' },
  { key: 'now_playing', label: 'En cines' },
]

const TAB_SORT = {
  popular: 'popularity.desc',
  top_rated: 'vote_average.desc',
  now_playing: 'primary_release_date.desc',
}

export function SearchModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [detailsLoading, setDetailsLoading] = useState(false)

  const [tab, setTab] = useState('trending')
  const [genres, setGenres] = useState([])
  const [genreId, setGenreId] = useState('')
  const [person, setPerson] = useState(null)
  const [personQuery, setPersonQuery] = useState('')
  const [personSuggestions, setPersonSuggestions] = useState([])
  const [personLoading, setPersonLoading] = useState(false)
  const [discoverResults, setDiscoverResults] = useState([])
  const [discoverLoading, setDiscoverLoading] = useState(false)
  const [discoverError, setDiscoverError] = useState(false)
  const [discoverPage, setDiscoverPage] = useState(1)
  const [discoverTotalPages, setDiscoverTotalPages] = useState(1)

  const inputRef = useRef(null)
  const personTimerRef = useRef(null)
  const loadIdRef = useRef(0)

  const { results, loading, error, search, getDetails, clear } = useMovieSearch()

  useEffect(() => {
    getTmdbGenres().then(setGenres).catch(() => {})
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
    return () => clear()
  }, [clear])

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const loadDiscover = useCallback(async (currentTab, currentGenreId, currentPerson, page, append) => {
    const id = ++loadIdRef.current
    setDiscoverLoading(true)
    setDiscoverError(false)
    try {
      let movieResults, totalPages = 1, resultPage = 1

      if (currentTab === 'trending' && !currentGenreId && !currentPerson) {
        movieResults = await fetchTrending()
      } else {
        const sortBy = currentTab === 'trending' ? 'popularity.desc' : (TAB_SORT[currentTab] || 'popularity.desc')
        const data = await fetchDiscover({
          sortBy,
          genreId: currentGenreId || undefined,
          personId: currentPerson?.id,
          personRole: currentPerson?.role,
          page,
        })
        movieResults = data.results
        totalPages = data.totalPages
        resultPage = data.page
      }

      if (id !== loadIdRef.current) return
      setDiscoverResults(prev => append ? [...prev, ...movieResults] : movieResults)
      setDiscoverTotalPages(totalPages)
      setDiscoverPage(resultPage)
    } catch {
      if (id === loadIdRef.current && !append) {
        setDiscoverResults([])
        setDiscoverError(true)
      }
    } finally {
      if (id === loadIdRef.current) setDiscoverLoading(false)
    }
  }, [])

  useEffect(() => {
    if (query) return
    loadDiscover(tab, genreId, person, 1, false)
  }, [query, tab, genreId, person, loadDiscover])

  useEffect(() => {
    clearTimeout(personTimerRef.current)
    if (!personQuery.trim()) { setPersonSuggestions([]); return }
    setPersonLoading(true)
    personTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchPerson(personQuery)
        setPersonSuggestions(res)
      } catch {
        setPersonSuggestions([])
      } finally {
        setPersonLoading(false)
      }
    }, 400)
    return () => clearTimeout(personTimerRef.current)
  }, [personQuery])

  const handleQueryChange = (e) => {
    const v = e.target.value
    setQuery(v)
    search(v)
  }

  const handleClearQuery = () => {
    setQuery('')
    clear()
    inputRef.current?.focus()
  }

  const handleSelect = async (movie) => {
    setDetailsLoading(true)
    try {
      const details = await getDetails(movie.tmdbId)
      onSelect(details)
    } catch {
      onSelect(movie)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setDiscoverResults([])
  }

  const handleGenreChange = (e) => {
    setGenreId(e.target.value)
    setDiscoverResults([])
  }

  const handlePersonSelect = (p) => {
    setPerson(p)
    setPersonQuery('')
    setPersonSuggestions([])
    setDiscoverResults([])
  }

  const handleClearPerson = () => {
    setPerson(null)
    setDiscoverResults([])
  }

  const handleLoadMore = () => {
    const next = discoverPage + 1
    loadDiscover(tab, genreId, person, next, true)
  }

  const isDiscover = !query
  const displayResults = isDiscover ? discoverResults : results
  const isLoading = isDiscover ? discoverLoading : (loading || detailsLoading)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-panel ${styles.panel}`} onClick={(e) => e.stopPropagation()}>

        <div className={styles.searchBar}>
          <Icon name="search" size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            placeholder="Buscar por título..."
            className={styles.input}
          />
          {query ? (
            <button className="btn btn-ghost" onClick={handleClearQuery} aria-label="Limpiar" style={{ padding: '6px' }}>
              <Icon name="close" size={16} />
            </button>
          ) : null}
          <button className={`btn btn-ghost ${styles.escBtn}`} onClick={onClose} aria-label="Cerrar">Esc</button>
        </div>

        {isDiscover && (
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t.key}
                className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
                onClick={() => handleTabChange(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className={styles.filters}>
          <select
            value={genreId}
            onChange={handleGenreChange}
            className={styles.filterSelect}
            aria-label="Género"
          >
            <option value="">Todos los géneros</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          {isDiscover && (
            <div className={styles.personWrap}>
              {person ? (
                <div className={styles.personChip}>
                  <span>{person.name}</span>
                  <span className={styles.personRole}>
                    {person.role === 'director' ? 'Director/a' : 'Actor/Actriz'}
                  </span>
                  <button className={styles.chipClose} onClick={handleClearPerson} aria-label="Quitar">
                    <Icon name="close" size={11} />
                  </button>
                </div>
              ) : (
                <div className={styles.personInputWrap}>
                  <input
                    value={personQuery}
                    onChange={(e) => setPersonQuery(e.target.value)}
                    placeholder="Actor, actriz o director/a..."
                    className={styles.personInput}
                    aria-label="Buscar persona"
                  />
                  {personLoading && <div className={styles.miniSpinner} />}
                  {personSuggestions.length > 0 && (
                    <div className={styles.personDropdown}>
                      {personSuggestions.map(p => (
                        <button
                          key={p.id}
                          className={styles.personOption}
                          onClick={() => handlePersonSelect(p)}
                        >
                          <span className={styles.personName}>{p.name}</span>
                          <span className={styles.personRole}>
                            {p.role === 'director' ? 'Director/a' : 'Actor/Actriz'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {error && !isDiscover && (
          <div className={styles.errorMsg}>{error}</div>
        )}

        {discoverError && isDiscover && (
          <div className={styles.errorMsg}>No se pudieron cargar las películas. Revisá tu conexión.</div>
        )}

        {isLoading && displayResults.length === 0 && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Cargando...</span>
          </div>
        )}

        {!isDiscover && !loading && !detailsLoading && results.length === 0 && query.length > 1 && !error && (
          <div className={styles.empty}>Sin resultados para "{query}"</div>
        )}

        <div className={styles.results}>
          {displayResults.map((movie) => (
            <button
              key={movie.tmdbId}
              className={styles.result}
              onClick={() => handleSelect(movie)}
            >
              <div className={styles.resultPoster}>
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} loading="lazy" />
                ) : (
                  <div className={styles.noPoster}>{movie.title[0]}</div>
                )}
              </div>
              <div className={styles.resultInfo}>
                <span className={styles.resultTitle}>{movie.title}</span>
                <div className={styles.resultMeta}>
                  {movie.year && <span>{movie.year}</span>}
                  {movie.tmdbRating > 0 && (
                    <span className={styles.tmdbRating}>★ {movie.tmdbRating}</span>
                  )}
                  {movie.genres.slice(0, 2).map((g) => (
                    <span key={g} className="tag">{g}</span>
                  ))}
                </div>
                {movie.overview && (
                  <p className={styles.resultOverview}>{movie.overview}</p>
                )}
              </div>
              <Icon name="arrowRight" size={16} className={styles.resultArrow} />
            </button>
          ))}

          {isDiscover && discoverResults.length > 0 && discoverPage < discoverTotalPages && (
            <button
              className={styles.loadMore}
              onClick={handleLoadMore}
              disabled={discoverLoading}
            >
              {discoverLoading ? 'Cargando...' : 'Ver más'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
