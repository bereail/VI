import { useState, useRef, useCallback, useEffect } from 'react'

const BASE = 'https://api.themoviedb.org/3'
export const IMG_BASE = 'https://image.tmdb.org/t/p'

const DEFAULT_API_KEY = 'f14d67712e440235df03189a794d9aab'

function getBearer() {
  return import.meta.env.VITE_TMDB_BEARER_TOKEN || localStorage.getItem('vi_tmdb_bearer') || ''
}

function getApiKey() {
  return import.meta.env.VITE_TMDB_API_KEY || localStorage.getItem('vi_tmdb_key') || DEFAULT_API_KEY
}

export function hasApiKey() {
  return Boolean(getBearer() || getApiKey())
}

export function posterUrl(path, size = 'w500') {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

async function tmdbFetch(path, params = {}) {
  const apiKey = getApiKey()
  const bearer = getBearer()
  if (!apiKey && !bearer) throw new Error('NO_KEY')

  const { _signal, ...rest } = params
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('language', 'es-MX')
  if (apiKey) url.searchParams.set('api_key', apiKey)
  Object.entries(rest).forEach(([k, v]) => url.searchParams.set(k, String(v)))

  const options = {}
  if (_signal) options.signal = _signal
  if (!apiKey && bearer) options.headers = { 'Authorization': `Bearer ${bearer}` }

  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`TMDB_${res.status}`)
  const data = await res.json()
  if (data.success === false) throw new Error(`TMDB_BACKEND_${data.status_code}`)
  return data
}

// ---- Genre cache ----
let genreCache = null
let genrePromise = null

function loadGenres() {
  if (genrePromise) return genrePromise
  genreCache = {}
  genrePromise = tmdbFetch('/genre/movie/list')
    .then(data => { (data.genres || []).forEach(g => { genreCache[g.id] = g.name }) })
    .catch(() => {})
  return genrePromise
}

function loadGenresBackground() {
  if (genreCache !== null) return
  loadGenres()
}

async function ensureGenres() {
  if (genreCache && Object.keys(genreCache).length > 0) return
  await loadGenres()
}

function mapMovie(r) {
  const genres = (r.genre_ids || []).map(id => genreCache?.[id]).filter(Boolean)
  return {
    tmdbId: r.id,
    title: r.title || r.original_title,
    year: r.release_date ? parseInt(r.release_date) : null,
    poster: r.poster_path ? posterUrl(r.poster_path) : null,
    overview: r.overview || '',
    genres,
    tmdbRating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
    director: null,
  }
}

function mapDetails(r) {
  const director = (r.credits?.crew || []).find(c => c.job === 'Director')?.name || null
  return {
    tmdbId: r.id,
    title: r.title || r.original_title,
    year: r.release_date ? parseInt(r.release_date) : null,
    poster: r.poster_path ? posterUrl(r.poster_path) : null,
    overview: r.overview || '',
    genres: (r.genres || []).map(g => g.name),
    director,
    runtime: r.runtime || null,
    tmdbRating: r.vote_average ? Math.round(r.vote_average * 10) / 10 : null,
  }
}

// ---- Public async API ----

export async function getTmdbGenres() {
  await ensureGenres()
  return Object.entries(genreCache || {})
    .map(([id, name]) => ({ id: Number(id), name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export async function fetchTrending() {
  await ensureGenres()
  const data = await tmdbFetch('/trending/movie/week')
  return (data.results || []).map(mapMovie)
}

export async function fetchDiscover({ sortBy = 'popularity.desc', genreId, personId, personRole = 'cast', page = 1 } = {}) {
  await ensureGenres()
  const params = { sort_by: sortBy, page }
  if (genreId) params.with_genres = genreId
  if (personId) {
    if (personRole === 'director') params.with_crew = personId
    else params.with_cast = personId
  }
  if (sortBy === 'vote_average.desc') params['vote_count.gte'] = 500
  const data = await tmdbFetch('/discover/movie', params)
  return {
    results: (data.results || []).map(mapMovie),
    totalPages: Math.min(data.total_pages || 1, 10),
    page: data.page || 1,
  }
}

export async function searchPerson(query) {
  if (!query.trim()) return []
  const data = await tmdbFetch('/search/person', { query: query.trim() })
  return (data.results || []).slice(0, 6).map(p => ({
    id: p.id,
    name: p.name,
    role: p.known_for_department === 'Directing' ? 'director' : 'cast',
  }))
}

export async function getMovieDetails(tmdbId) {
  const data = await tmdbFetch(`/movie/${tmdbId}`, { append_to_response: 'credits' })
  return mapDetails(data)
}

// ---- useMovieSearch hook ----

export function useMovieSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const timerRef = useRef(null)

  const search = useCallback((query) => {
    clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    loadGenresBackground()
    setLoading(true)
    setError(null)

    timerRef.current = setTimeout(async () => {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const data = await tmdbFetch('/search/movie', {
          query: query.trim(),
          include_adult: 'false',
          _signal: ctrl.signal,
        })
        setResults((data.results || []).slice(0, 10).map(mapMovie))
      } catch (err) {
        if (err.name === 'AbortError') return
        if (err.message === 'NO_KEY') {
          setError('Configurá tu API key de TMDB en ajustes.')
        } else if (err.message === 'TMDB_401' || err.message === 'TMDB_403') {
          setError('Token inválido. Verificá tu clave en ⚙️.')
        } else if (err.message?.startsWith('TMDB_5') || err.message?.startsWith('TMDB_BACKEND')) {
          setError('TMDB no disponible en este momento. Intentá de nuevo en unos segundos.')
        } else {
          setError('Error al buscar. Revisá tu conexión.')
        }
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }, [])

  const getDetails = useCallback(async (tmdbId) => {
    return getMovieDetails(tmdbId)
  }, [])

  const clear = useCallback(() => {
    clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()
    setResults([])
    setLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  return { results, loading, error, search, getDetails, clear }
}

export function saveApiKey(key) {
  const trimmed = key.trim()
  if (trimmed.startsWith('ey')) {
    localStorage.setItem('vi_tmdb_bearer', trimmed)
  } else {
    localStorage.setItem('vi_tmdb_key', trimmed)
  }
  genreCache = null
  genrePromise = null
}

export function removeApiKey() {
  localStorage.removeItem('vi_tmdb_bearer')
  localStorage.removeItem('vi_tmdb_key')
  genreCache = null
  genrePromise = null
}
